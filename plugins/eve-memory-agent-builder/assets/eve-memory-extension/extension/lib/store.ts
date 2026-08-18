import { randomUUID } from "node:crypto";

import { database, ensureSchema, type MemoryDatabase } from "./database";
import type { MemoryItem, MemoryKind, MemoryScope, Sensitivity } from "./types";

type Row = Record<string, unknown>;

function mapItem(row: Row): MemoryItem {
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
  const sql = await database();
  await sql.query(
    `insert into eve_memory_session_scopes
      (namespace, session_id, tenant_id, user_id, project_id)
    values ($1, $2, $3, $4, $5)
    on conflict (namespace, session_id) do update set
      tenant_id = excluded.tenant_id,
      user_id = excluded.user_id,
      project_id = excluded.project_id,
      last_seen_at = now()`,
    [scope.namespace, sessionId, scope.tenantId, scope.userId, scope.projectId]
  );
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
  const sql = await database();
  const data = input.data === undefined ? null : JSON.stringify(input.data);
  await sql.query(
    `insert into eve_memory_events
      (event_id, namespace, session_id, event_type, event_at, event_data, truncated)
    values ($1, $2, $3, $4, $5, $6::jsonb, $7)
    on conflict (event_id) do nothing`,
    [
      input.eventId,
      input.namespace,
      input.sessionId,
      input.eventType,
      input.eventAt,
      data,
      input.truncated
    ]
  );
}

export async function listBrief(scope: MemoryScope, limit: number): Promise<MemoryItem[]> {
  if (limit === 0) return [];
  await ensureSchema();
  const sql = await database();
  const rows = await sql.query(
    `select * from eve_memory_items
    where namespace = $1
      and tenant_id = $2
      and user_id = $3
      and project_id = $4
      and status = 'confirmed'
    order by updated_at desc
    limit $5`,
    [scope.namespace, scope.tenantId, scope.userId, scope.projectId, limit]
  );
  return rows.map(mapItem);
}

export async function searchMemories(
  scope: MemoryScope,
  query: string,
  limit: number
): Promise<Array<MemoryItem & { score: number }>> {
  await ensureSchema();
  const sql = await database();
  const rows = await sql.query(
    `select *,
      (case when content ilike $5 then 2 else 0 end) +
      ts_rank(to_tsvector('simple', content), plainto_tsquery('simple', $6)) as score
    from eve_memory_items
    where namespace = $1
      and tenant_id = $2
      and user_id = $3
      and project_id = $4
      and status = 'confirmed'
      and (
        content ilike $5
        or to_tsvector('simple', content) @@ plainto_tsquery('simple', $6)
      )
    order by score desc, updated_at desc
    limit $7`,
    [
      scope.namespace,
      scope.tenantId,
      scope.userId,
      scope.projectId,
      `%${query}%`,
      query,
      limit
    ]
  );
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
  const sql = await database();
  const id = randomUUID();
  const rows = await sql.query(
    `insert into eve_memory_items
      (id, namespace, tenant_id, user_id, project_id, kind, content, sensitivity,
       status, source_session_id, source_event_id)
    values ($1, $2, $3, $4, $5, $6, $7, $8, 'proposed', $9, $10)
    returning *`,
    [
      id,
      scope.namespace,
      scope.tenantId,
      scope.userId,
      scope.projectId,
      input.kind,
      input.content,
      input.sensitivity,
      input.sourceSessionId,
      input.sourceEventId ?? null
    ]
  );
  return mapItem(rows[0]);
}

export async function confirmMemory(scope: MemoryScope, id: string): Promise<MemoryItem | null> {
  await ensureSchema();
  const sql = await database();
  const rows = await sql.query(
    `update eve_memory_items
    set status = 'confirmed', updated_at = now()
    where id = $1
      and namespace = $2
      and tenant_id = $3
      and user_id = $4
      and project_id = $5
      and status = 'proposed'
    returning *`,
    [id, scope.namespace, scope.tenantId, scope.userId, scope.projectId]
  );
  return rows.length === 1 ? mapItem(rows[0]) : null;
}

export async function correctMemory(
  scope: MemoryScope,
  input: { id: string; content: string; sourceSessionId: string; sourceEventId?: string }
): Promise<{ previous: MemoryItem; replacement: MemoryItem } | null> {
  await ensureSchema();
  const sql = await database();
  return await sql.transaction(async (tx) => correctMemoryInTransaction(tx, scope, input));
}

async function correctMemoryInTransaction(
  tx: MemoryDatabase,
  scope: MemoryScope,
  input: { id: string; content: string; sourceSessionId: string; sourceEventId?: string }
): Promise<{ previous: MemoryItem; replacement: MemoryItem } | null> {
  const previousRows = await tx.query(
    `select * from eve_memory_items
    where id = $1
      and namespace = $2
      and tenant_id = $3
      and user_id = $4
      and project_id = $5
      and status = 'confirmed'
    for update`,
    [input.id, scope.namespace, scope.tenantId, scope.userId, scope.projectId]
  );
  if (previousRows.length !== 1) return null;

  const previous = mapItem(previousRows[0]);
  const replacementId = randomUUID();
  const replacementRows = await tx.query(
    `insert into eve_memory_items
      (id, namespace, tenant_id, user_id, project_id, kind, content, sensitivity,
       status, source_session_id, source_event_id)
    values ($1, $2, $3, $4, $5, $6, $7, $8, 'confirmed', $9, $10)
    returning *`,
    [
      replacementId,
      scope.namespace,
      scope.tenantId,
      scope.userId,
      scope.projectId,
      previous.kind,
      input.content,
      previous.sensitivity,
      input.sourceSessionId,
      input.sourceEventId ?? null
    ]
  );
  await tx.query(
    `update eve_memory_items
    set status = 'superseded', superseded_by = $1, updated_at = now()
    where id = $2`,
    [replacementId, previous.id]
  );
  return { previous, replacement: mapItem(replacementRows[0]) };
}

export async function forgetMemory(scope: MemoryScope, id: string): Promise<boolean> {
  await ensureSchema();
  const sql = await database();
  const rows = await sql.query(
    `update eve_memory_items
    set status = 'deleted', content = '[deleted]', updated_at = now()
    where id = $1
      and namespace = $2
      and tenant_id = $3
      and user_id = $4
      and project_id = $5
      and status in ('proposed', 'confirmed')
    returning id`,
    [id, scope.namespace, scope.tenantId, scope.userId, scope.projectId]
  );
  return rows.length === 1;
}

export async function getMemorySource(scope: MemoryScope, id: string): Promise<unknown | null> {
  await ensureSchema();
  const sql = await database();
  const rows = await sql.query(
    `select
      m.id, m.kind, m.content, m.status, m.source_session_id, m.source_event_id,
      e.event_type, e.event_at, e.event_data, e.truncated
    from eve_memory_items m
    left join eve_memory_events e on e.event_id = m.source_event_id
    where m.id = $1
      and m.namespace = $2
      and m.tenant_id = $3
      and m.user_id = $4
      and m.project_id = $5
    limit 1`,
    [id, scope.namespace, scope.tenantId, scope.userId, scope.projectId]
  );
  return rows.length === 1 ? rows[0] : null;
}
