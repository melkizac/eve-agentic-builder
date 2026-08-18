# eve Memory Agent Builder

An installable Codex plugin for creating, extending, and auditing complete
[Vercel eve](https://github.com/vercel/eve) agents with durable cross-session memory.

The plugin keeps eve's native durable session history as working context and adds a
PostgreSQL-backed memory extension with:

- tenant, user, project, and namespace isolation derived from authenticated eve context;
- an append-only runtime event archive;
- curated proposed and confirmed memories;
- bounded memory briefing before each turn;
- search and provenance retrieval;
- approval-gated confirmation, correction, and forgetting;
- secret-rejection and untrusted-memory policies;
- generated recall, approval, and secret-handling evals.

## Install in Codex

Prerequisites:

- Codex app or Codex CLI with plugin support;
- Node.js 24 or newer for eve projects;
- pnpm;
- PostgreSQL for live durable-memory behavior;
- Ubuntu/WSL or Linux for reliable local eve execution on Windows.

Add this repository as a marketplace and install the plugin:

```powershell
codex plugin marketplace add melkizac/eve-memory-agent-builder
codex plugin add eve-memory-agent-builder@eve-memory-agents
```

Start a new Codex task after installation so the bundled skills are loaded.

The create skill uses an integrated starter pinned to `eve@0.39.0`. Users do not
need to run `eve init`; the plugin creates the Eve runtime project, installs the
memory workspace, installs dependencies, and then guides Codex through validation.

## Use

Create a new agent:

```text
Use $create-eve-memory-agent to create an eve customer-support agent with durable memory.
```

Add memory to an existing project:

```text
Use $add-memory-to-eve-agent to add durable memory to this eve project.
```

Audit an implementation:

```text
Use $audit-eve-agent-memory to assess recall, provenance, approvals, deletion, and tenant isolation.
```

## Memory model

The generated agent separates three layers:

1. eve native history for the current durable session;
2. `eve_memory_events` for source evidence;
3. `eve_memory_items` for curated cross-session knowledge.

Only confirmed items enter briefing and search. The lifecycle is:

```text
proposed -> confirmed -> superseded | deleted
```

Every read and mutation is scoped inside the database query. The model cannot provide
tenant or user identifiers as tool arguments. Stored values are treated as user data,
not agent instructions.

## Bundled memory tools

When mounted as `memory`, the extension exposes:

- `memory__search`
- `memory__get_source`
- `memory__propose`
- `memory__confirm`
- `memory__correct`
- `memory__forget`

Confirmation, correction, and forgetting use eve's durable human-approval flow.

## Validation status

Release 0.2.0 was checked against `eve@0.39.0` and Node.js 24:

- plugin and all three skills validated;
- the one-command integrated initializer created a fresh agent without `eve init`;
- dependency installation generated the project lockfile;
- the generated root project passed TypeScript and Eve builds;
- extension TypeScript and build passed;
- a generated eve workspace typechecked;
- `eve info` discovered six tools with zero diagnostics;
- all three generated evals were discovered;
- structural and credential-pattern checks passed.

Live PostgreSQL, approval-resume, authenticated cross-tenant, and deployed-session tests
require environment credentials and were not run as part of the public package build.
Do not interpret compilation as proof of production isolation.

## Security

- Do not enable the development identity fallback in production.
- Do not commit `DATABASE_URL` or provider credentials.
- Keep reasoning-event capture disabled unless a privacy review explicitly allows it.
- Run evals only against a disposable test database.
- Verify two authenticated tenant scopes before claiming multi-tenant readiness.
- Review the plugin's Python scripts before installation; they create and update local projects.

## Repository layout

```text
.agents/plugins/marketplace.json
plugins/eve-memory-agent-builder/
  .codex-plugin/plugin.json
  skills/
  scripts/
  assets/eve-agent-starter/
  assets/eve-memory-extension/
```

## License

Apache License 2.0. See [LICENSE](LICENSE).
