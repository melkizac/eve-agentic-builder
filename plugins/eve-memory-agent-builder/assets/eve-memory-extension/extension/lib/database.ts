import { resolve } from "node:path";

import { PGlite, type Transaction } from "@electric-sql/pglite";
import postgres, { type Sql } from "postgres";

import extension from "../extension";

type Row = Record<string, unknown>;

export interface MemoryDatabase {
  query<T extends Row = Row>(statement: string, params?: readonly unknown[]): Promise<T[]>;
  transaction<T>(callback: (database: MemoryDatabase) => Promise<T>): Promise<T>;
  close(): Promise<void>;
}

type PostgresExecutor = Pick<Sql, "unsafe">;

class PostgresMemoryDatabase implements MemoryDatabase {
  constructor(
    private readonly executor: PostgresExecutor,
    private readonly root?: Sql
  ) {}

  async query<T extends Row = Row>(
    statement: string,
    params: readonly unknown[] = []
  ): Promise<T[]> {
    const rows = await this.executor.unsafe(statement, [...params] as never[]);
    return rows as unknown as T[];
  }

  async transaction<T>(callback: (database: MemoryDatabase) => Promise<T>): Promise<T> {
    if (!this.root) throw new Error("Nested memory transactions are not supported.");
    return (await this.root.begin(async (tx) => {
      return await callback(new PostgresMemoryDatabase(tx));
    })) as T;
  }

  async close(): Promise<void> {
    if (this.root) await this.root.end({ timeout: 5 });
  }
}

type PGliteExecutor = PGlite | Transaction;

class PGliteMemoryDatabase implements MemoryDatabase {
  constructor(
    private readonly root: PGlite,
    private readonly executor: PGliteExecutor = root
  ) {}

  async query<T extends Row = Row>(
    statement: string,
    params: readonly unknown[] = []
  ): Promise<T[]> {
    const result = await this.executor.query<T>(statement, [...params]);
    return result.rows;
  }

  async transaction<T>(callback: (database: MemoryDatabase) => Promise<T>): Promise<T> {
    return await this.root.transaction(async (tx) => {
      return await callback(new PGliteMemoryDatabase(this.root, tx));
    });
  }

  async close(): Promise<void> {
    if (this.executor === this.root) await this.root.close();
  }
}

let clientPromise: Promise<MemoryDatabase> | undefined;
let schemaPromise: Promise<void> | undefined;

export function selectedMemoryBackend(): "pglite" | "postgres" {
  if (extension.config.backend === "postgres") return "postgres";
  if (extension.config.backend === "auto" && extension.config.databaseUrl) return "postgres";
  return "pglite";
}

export async function createPGliteDatabase(dataDir: string): Promise<MemoryDatabase> {
  const client = await PGlite.create(dataDir);
  return new PGliteMemoryDatabase(client);
}

export function database(): Promise<MemoryDatabase> {
  clientPromise ??= createDatabase().catch((error) => {
    clientPromise = undefined;
    throw error;
  });
  return clientPromise;
}

export function ensureSchema(): Promise<void> {
  schemaPromise ??= initializeSchema().catch((error) => {
    schemaPromise = undefined;
    throw error;
  });
  return schemaPromise;
}

async function createDatabase(): Promise<MemoryDatabase> {
  const backend = selectedMemoryBackend();
  if (backend === "postgres") {
    if (!extension.config.databaseUrl) {
      throw new Error("DATABASE_URL is required when EVE_MEMORY_BACKEND=postgres.");
    }
    const client = postgres(extension.config.databaseUrl, {
      max: 5,
      idle_timeout: 20,
      connect_timeout: 10,
      prepare: false
    });
    return new PostgresMemoryDatabase(client, client);
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "Embedded PGlite memory is local-development only. Set DATABASE_URL for production."
    );
  }

  return await createPGliteDatabase(resolve(process.cwd(), extension.config.dataDir));
}

async function initializeSchema(): Promise<void> {
  const sql = await database();

  await sql.query(`
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
  `);

  await sql.query(`
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
  `);

  await sql.query(`
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
  `);

  await sql.query(`
    create index if not exists eve_memory_items_scope_idx
    on eve_memory_items (namespace, tenant_id, user_id, project_id, status, updated_at desc)
  `);

  await sql.query(`
    create index if not exists eve_memory_items_search_idx
    on eve_memory_items using gin (to_tsvector('simple', content))
  `);

  await sql.query(`
    create index if not exists eve_memory_events_session_idx
    on eve_memory_events (namespace, session_id, event_at)
  `);
}
