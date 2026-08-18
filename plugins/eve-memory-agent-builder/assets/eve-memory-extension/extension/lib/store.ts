import { randomUUID } from "node:crypto";

import { database, ensureSchema } from "./database";
import type { MemoryItem, MemoryKind, MemoryScope, Sensitivity } from "./types";

function mapItem(row: Record<string, unknown>): MemoryItem {
  return {
    id: String(row.id),
    kind: row.kind as MemoryKind,
    content: String(row.content),
    sensitivity: row.sensitivity as Sensitivity,
    status: row.status as MemoryItem["status"],
    sourceSessionId: row.source_session_id ? String(row.source_session_id) : null,
    sourceEventId: row.source_event_id ? String(row.source_event_id) : null,
    supersededBy: row.superseded_by ? String(row.superseded_by) : null,
    createdAt: new Date(String(row.created_at)).toISOString(),
    updatedAt: new Date(String(row.updated_at)).toISOString()
  };
}

export async function recordSessionScope(scope: MemoryScope, sessionId: string): Promise<void> {
  await ensureSchema();
  const sql = database();
  await sql`
    insert into eve_memory_session_scopes
      (namespace, session_id, tenant_id, user_id, project_id)
    values
      (${scope.namespace}, ${sessionId}, ${scope.tenantId}, ${scope.userId}, ${scope.projectId})
    on conflict (namespace, session_id) do update set
      tenant_id = excluded.tenant_id,
      user_id = excluded.user_id,
      project_id = excluded.project_id,
      last_seen_at = now()
  `;
}

export async function recordEvent(input: {
  namespace: string;
  sessionId: string;
  eventId: string;
  eventType: string;
  eventAt: string;
  data: unknown;
  truncated: boolean;
}): Promise<void> {
  await ensureSchema();
  const sql = database();
  const data = input.data === undefined ? null : JSON.stringify(input.data);
  await sql`
    insert into eve_memory_events
      (event_id, namespace, session_id, event_type, event_at, event_data, truncated)
    values
      (${input.eventId}, ${input.namespace}, ${input.sessionId}, ${input.eventType},
       ${input.eventAt}, ${data}::jsonb, ${input.truncated})
    on conflict (event_id) do nothing
  `;
}

export async function listBrief(scope: MemoryScope, limit: number): Promise<MemoryItem[]> {
  if (limit === 0) return [];
  await ensureSchema();
  const sql = database();
  const rows = await sql`
    select * from eve_memory_items
    where namespace = ${scope.namespace}
      and tenant_id = ${scope.tenantId}
      and user_id = ${scope.userId}
      and project_id = ${scope.projectId}
      and status = 'confirmed'
    order by updated_at desc
    limit ${limit}
  `;
  return rows.map((row) => mapItem(row));
}

export async function searchMemories(
  scope: MemoryScope,
  query: string,
  limit: number
): Promise<Array<MemoryItem & { score: number }>> {
  await ensureSchema();
  const sql = database();
  const likeQuery = `%${query}%`;
  const rows = await sql`
    select *,
      (case when content ilike ${likeQuery} then 2 else 0 end) +
      ts_rank(to_tsvector('simple', content), plainto_tsquery('simple', ${query})) as score
    from eve_memory_items
    where namespace = ${scope.namespace}
      and tenant_id = ${scope.tenantId}
      and user_id = ${scope.userId}
      and project_id = ${scope.projectId}
      and status = 'confirmed'
      and (
        content ilike ${likeQuery}
        or to_tsvector('simple', content) @@ plainto_tsquery('simple', ${query})
      )
    order by score desc, updated_at desc
    limit ${limit}
  `;
  return rows.map((row) => ({ ...mapItem(row), score: Number(row.score) }));
}

export async function proposeMemory(
  scope: MemoryScope,
  input: {
    kind: MemoryKind;
    content: string;
    sensitivity: Sensitivity;
    sourceSessionId: string;
    sourceEventId?: string;
  }
): Promise<MemoryItem> {
  await ensureSchema();
  const sql = database();
  const id = randomUUID();
  const rows = await sql`
    insert into eve_memory_items
      (id, namespace, tenant_id, user_id, project_id, kind, content, sensitivity,
       status, source_session_id, source_event_id)
    values
      (${id}, ${scope.namespace}, ${scope.tenantId}, ${scope.userId}, ${scope.projectId},
       ${input.kind}, ${input.content}, ${input.sensitivity}, 'proposed',
       ${input.sourceSessionId}, ${input.sourceEventId ?? null})
    returning *
  `;
  return mapItem(rows[0]);
}

export async function confirmMemory(scope: MemoryScope, id: string): Promise<MemoryItem | null> {
  await ensureSchema();
  const sql = database();
  const rows = await sql`
    update eve_memory_items
    set status = 'confirmed', updated_at = now()
    where id = ${id}
      and namespace = ${scope.namespace}
      and tenant_id = ${scope.tenantId}
      and user_id = ${scope.userId}
      and project_id = ${scope.projectId}
      and status = 'proposed'
    returning *
  `;
  return rows.length === 1 ? mapItem(rows[0]) : null;
}

export async function correctMemory(
  scope: MemoryScope,
  input: { id: string; content: string; sourceSessionId: string; sourceEventId?: string }
): Promise<{ previous: MemoryItem; replacement: MemoryItem } | null> {
  await ensureSchema();
  const sql = database();
  return await sql.begin(async (tx) => {
    const previousRows = await tx`
      select * from eve_memory_items
      where id = ${input.id}
        and namespace = ${scope.namespace}
        and tenant_id = ${scope.tenantId}
        and user_id = ${scope.userId}
        and project_id = ${scope.projectId}
        and status = 'confirmed'
      for update
    `;
    if (previousRows.length !== 1) return null;

    const previous = mapItem(previousRows[0]);
    const replacementId = randomUUID();
    const replacementRows = await tx`
      insert into eve_memory_items
        (id, namespace, tenant_id, user_id, project_id, kind, content, sensitivity,
         status, source_session_id, source_event_id)
      values
        (${replacementId}, ${scope.namespace}, ${scope.tenantId}, ${scope.userId},
         ${scope.projectId}, ${previous.kind}, ${input.content}, ${previous.sensitivity},
         'confirmed', ${input.sourceSessionId}, ${input.sourceEventId ?? null})
      returning *
    `;
    await tx`
      update eve_memory_items
      set status = 'superseded', superseded_by = ${replacementId}, updated_at = now()
      where id = ${previous.id}
    `;
    return { previous, replacement: mapItem(replacementRows[0]) };
  });
}

export async function forgetMemory(scope: MemoryScope, id: string): Promise<boolean> {
  await ensureSchema();
  const sql = database();
  const rows = await sql`
    update eve_memory_items
    set status = 'deleted', content = '[deleted]', updated_at = now()
    where id = ${id}
      and namespace = ${scope.namespace}
      and tenant_id = ${scope.tenantId}
      and user_id = ${scope.userId}
      and project_id = ${scope.projectId}
      and status in ('proposed', 'confirmed')
    returning id
  `;
  return rows.length === 1;
}

export async function getMemorySource(scope: MemoryScope, id: string): Promise<unknown | null> {
  await ensureSchema();
  const sql = database();
  const rows = await sql`
    select
      m.id, m.kind, m.content, m.status, m.source_session_id, m.source_event_id,
      e.event_type, e.event_at, e.event_data, e.truncated
    from eve_memory_items m
    left join eve_memory_events e on e.event_id = m.source_event_id
    where m.id = ${id}
      and m.namespace = ${scope.namespace}
      and m.tenant_id = ${scope.tenantId}
      and m.user_id = ${scope.userId}
      and m.project_id = ${scope.projectId}
    limit 1
  `;
  return rows.length === 1 ? rows[0] : null;
}
