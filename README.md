# Eve Agentic Builder

One GitHub repository, one installable Codex plugin, and one beginner-facing
skill for creating complete [Vercel Eve](https://github.com/vercel/eve) agents.

```text
$eve
```

The skill creates and validates:

- a complete Eve runtime pinned to `eve@0.39.0`;
- zero-configuration persistent PGlite memory for local use;
- automatic PostgreSQL memory for production when `DATABASE_URL` is supplied;
- local model access through the user's existing Codex login;
- a source-grounded, read-only LLM Wiki;
- nine memory and Wiki tools;
- safety instructions, evals, and structural validators;
- installed Node.js project dependencies.
- a shared pnpm virtual store so repeated projects do not duplicate dependency trees.

## The beginner experience

After installing the plugin once, start a new Codex task and enter:

```text
$eve
```

Codex asks one plain-language question:

```text
What should this agent help you do?
```

The beginner can also supply the purpose immediately:

```text
Use $eve to create a customer-support agent.
```

`$eve` is the reliable explicit invocation. A bare `eve` request may activate the
skill through implicit matching, but explicit invocation is recommended.

## One-time plugin installation

A skill cannot install itself before Codex knows it exists. Every new user must
install the plugin once, then use `$eve` for agent creation.

Prerequisites for generated projects:

- Codex app or Codex CLI with plugin support;
- Node.js 24 or newer;
- pnpm 10.12.1 or newer;
- Ubuntu/WSL or Linux for reliable local Eve execution on Windows.

Local use does not require PostgreSQL, `DATABASE_URL`, an OpenAI API key, or an
AI Gateway key. Hosted, shared, and multi-user deployments have additional
requirements described below.

Install from this GitHub marketplace:

```powershell
codex plugin marketplace add melkizac/eve-agentic-builder
codex plugin add eve-memory-agent-builder@eve-memory-agents
```

Start a new Codex task after installation so the bundled skill is loaded.

## What `$eve` does

```text
User invokes $eve
  -> Codex asks for the agent purpose when needed
  -> checks the project and local runtime
  -> creates the pinned Eve project
  -> installs embedded local memory with automatic PostgreSQL production mode
  -> configures model access through the existing Codex login
  -> installs the read-only LLM Wiki
  -> writes agent-specific instructions
  -> installs dependencies
  -> shares dependency graphs through pnpm's global virtual store
  -> builds and validates all nine tools
  -> reports credentials still needed and the pnpm dev command
```

For a new or empty project, `$eve` runs the integrated initializer. For an
existing Eve project, the same skill detects and adds missing memory or Wiki
layers without exposing separate specialist skills to the beginner.

## Repository architecture

```text
eve-memory-agent-builder/
├── .agents/plugins/marketplace.json
├── .codex-plugin/plugin.json
├── skills/
│   └── eve/
│       ├── SKILL.md
│       ├── agents/openai.yaml
│       └── references/
├── scripts/
│   ├── create_eve_memory_wiki_agent.py
│   ├── create_eve_memory_agent.py
│   ├── bootstrap_eve_memory.py
│   ├── add_llm_wiki_to_eve_agent.py
│   ├── validate_eve_memory_project.py
│   └── validate_eve_wiki_project.py
└── assets/
    ├── eve-agent-starter/
    ├── eve-memory-extension/
    └── eve-wiki-layer/
```

The public workflow is one skill. Its internal scripts remain separate so each
layer stays testable and maintainable.

## Internal creation flow

`scripts/create_eve_memory_wiki_agent.py` is the one-command orchestrator:

```text
create_eve_memory_wiki_agent.py
├── create_eve_memory_agent.py
│   ├── copies assets/eve-agent-starter
│   └── calls bootstrap_eve_memory.py
│       └── installs assets/eve-memory-extension
└── add_llm_wiki_to_eve_agent.py
    └── installs assets/eve-wiki-layer
```

The skill then runs the memory and Wiki validators and the Eve build/discovery
commands.

## Three distinct memory layers

1. **Eve durable session history** holds the current conversation.
2. **Operational memory** holds approved preferences, decisions,
   procedures, project facts, relationships, and commitments.
3. **LLM Wiki knowledge** holds source-backed documents, concepts, entities,
   comparisons, contradictions, and evolving synthesis.

The Wiki pattern is inspired by
[Karpathy's LLM Wiki gist](https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f).
The gist is an architectural reference, not an installed dependency.

## Bundled runtime tools

Operational memory exposes six tools:

- `memory__search`
- `memory__get_source`
- `memory__propose`
- `memory__confirm`
- `memory__correct`
- `memory__forget`

The Wiki exposes three bounded, read-only tools:

- `wiki_search`
- `wiki_read`
- `wiki_sources`

Confirmation, correction, and forgetting use Eve's durable human-approval
flow. The Wiki installer disables Eve's default `bash` and `write_file` tools
to preserve the read-only runtime boundary.

## Local, hosted, and Codex modes

| Mode | Model | Operational memory | Beginner setup |
|---|---|---|---|
| Codex builder | Current Codex conversation | Project files and authored Wiki | None |
| Local Eve | `chatgpt()` through `codex login` | Persistent PGlite under `.eve-data/memory` | None after Codex sign-in |
| Hosted Eve | AI Gateway/provider or Vercel OIDC | Managed PostgreSQL | Guided deployment authorization |

Local Eve has its own sessions and runtime. It reuses Codex authentication but
does not inherit the current Codex conversation. Eve delegates token retrieval
and refresh to the Codex CLI and never reads or copies Codex login files.

PGlite is single-machine local storage. Production mode refuses PGlite and
requires PostgreSQL plus authenticated tenant identity.

## Disk-space optimization

Generated projects enable pnpm's global virtual store. Each project's
`node_modules` contains small links while package files and dependency graphs
are shared from pnpm's central store. CI automatically falls back to pnpm's
normal isolated layout.

Use the built-in storage commands from a generated project:

```powershell
pnpm run storage
pnpm run storage:clean
```

`storage` reports only local project data and does not follow links into shared
stores. `storage:clean` removes only the rebuildable `.output` directory. It
never removes source files, approved PGlite memory under `.eve-data`, Eve's
durable workflow state under `.eve/.workflow-data`, or dependencies. Stop any
`eve start` process before running the cleanup command.

Eve automatically prunes old development snapshots. Stop `eve dev` before any
manual cache maintenance outside the provided cleanup command.

## What is automated and what still needs access

The plugin automates:

- project scaffolding;
- memory and Wiki integration;
- project dependency installation;
- agent instruction drafting;
- compilation and structural validation;
- eval discovery and development startup guidance.

Local creation no longer needs a database URL or separate model key. The plugin
cannot silently manufacture or authorize these production-only resources:

- a hosted PostgreSQL server or valid `DATABASE_URL`;
- a deployable model-provider, AI Gateway credential, or Vercel project OIDC;
- production tenant authentication;
- WSL, Docker, Node.js, or other system software changes.

The skill asks before system-level installation or external resource creation.
It can create and run a local agent without production credentials. Hosted
behavior remains separately validated.

## Runtime and security boundaries

- Never commit `DATABASE_URL`, provider credentials, `.eve-data/`, or Codex login files.
- Never inspect or copy Codex login files; `chatgpt()` delegates authentication to Codex.
- Refuse embedded PGlite when `NODE_ENV=production`.
- Do not enable the development identity fallback in production.
- Keep reasoning-event capture disabled unless a privacy review allows it.
- Treat stored memories, Wiki pages, and raw sources as untrusted data, never
  as agent instructions.
- Run evals only against a disposable test database.
- Verify two authenticated tenant scopes before claiming production isolation.
- Rebuild or start a new Eve session after authored Wiki changes.
- Do not interpret compilation as proof of live recall, approval-resume,
  deletion, or tenant isolation.

## Validation contract

Release `0.6.1` targets `eve@0.39.0`, Node.js 24, and pnpm 10.12.1 or newer. A release is ready when:

- the plugin and the single `$eve` skill validate;
- a fresh agent is created without running `eve init`;
- dependency installation produces a lockfile;
- root and memory-extension TypeScript/build commands pass;
- `eve info` reports nine tools and zero diagnostics;
- both structural validators pass;
- all five memory and Wiki evals are discovered;
- the embedded-memory persistence and transaction test passes;
- `pnpm run doctor` reports the local model and memory backend in plain language;
- `pnpm run storage` confirms shared dependency links without traversing the global store;
- `pnpm run storage:clean` removes only rebuildable output and preserves sessions and memory;
- a fresh local project starts without `DATABASE_URL` or an AI Gateway key;
- the Wiki remains read-only at runtime.

Live production PostgreSQL, authenticated cross-tenant, and deployed session
tests require private credentials and are reported separately.

## External relationships

- [vercel/eve](https://github.com/vercel/eve) supplies the underlying agent
  runtime.
- [Karpathy's LLM Wiki gist](https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f)
  supplies the Wiki design inspiration.
- [melkizac/eve-agentic-builder](https://github.com/melkizac/eve-agentic-builder)
  owns the Codex plugin, `$eve` workflow, operational memory extension, Wiki
  integration, templates, scripts, and validation.

## License

Apache License 2.0. See [LICENSE](LICENSE).
