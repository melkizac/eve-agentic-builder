import postgres, { type Sql } from "postgres";

import extension from "../extension";

let client: Sql | undefined;
let schemaPromise: Promise<void> | undefined;

export function database(): Sql {
  client ??= postgres(extension.config.databaseUrl, {
    max: 5,
    idle_timeout: 20,
    connect_timeout: 10,
    prepare: false
  });
  return client;
}

export function ensureSchema(): Promise<void> {
  schemaPromise ??= initializeSchema().catch((error) => {
    schemaPromise = undefined;
    throw error;
  });
  return schemaPromise;
}

async function initializeSchema(): Promise<void> {
  const sql = database();

  await sql`
    create table if not exists eve_memory_session_scopes (
      namespace text not null,
      session_id text not null,
      tenant_id text not null,
      user_id text not null,
      project_id text not null,
      first_seen_at timestamptz not null default now(),
      last_seen_at timestamptz not null default now(),
      primary key (namespace, session_id)
    )
  `;

  await sql`
    create table if not exists eve_memory_events (
      event_id text primary key,
      namespace text not null,
      session_id text not null,
      event_type text not null,
      event_at timestamptz not null,
      event_data jsonb,
      truncated boolean not null default false,
      captured_at timestamptz not null default now()
    )
  `;

  await sql`
    create table if not exists eve_memory_items (
      id text primary key,
      namespace text not null,
      tenant_id text not null,
      user_id text not null,
      project_id text not null,
      kind text not null check (kind in ('preference','decision','procedure','project_fact','relationship','open_commitment')),
      content text not null,
      sensitivity text not null default 'normal' check (sensitivity in ('normal','restricted')),
      status text not null default 'proposed' check (status in ('proposed','confirmed','superseded','deleted')),
      source_session_id text,
      source_event_id text,
      superseded_by text,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    )
  `;

  await sql`
    create index if not exists eve_memory_items_scope_idx
    on eve_memory_items (namespace, tenant_id, user_id, project_id, status, updated_at desc)
  `;

  await sql`
    create index if not exists eve_memory_items_search_idx
    on eve_memory_items using gin (to_tsvector('simple', content))
  `;

  await sql`
    create index if not exists eve_memory_events_session_idx
    on eve_memory_events (namespace, session_id, event_at)
  `;
}
