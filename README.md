# Eve Memory Agent Builder

One GitHub repository, one installable Codex plugin, and one beginner-facing
skill for creating complete [Vercel Eve](https://github.com/vercel/eve) agents.

```text
$eve
```

The skill creates and validates:

- a complete Eve runtime pinned to `eve@0.39.0`;
- PostgreSQL-backed operational memory;
- a source-grounded, read-only LLM Wiki;
- nine memory and Wiki tools;
- safety instructions, evals, and structural validators;
- installed Node.js project dependencies.

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
- pnpm;
- PostgreSQL for live durable-memory behavior;
- Ubuntu/WSL or Linux for reliable local Eve execution on Windows.

Install from this GitHub marketplace:

```powershell
codex plugin marketplace add melkizac/eve-memory-agent-builder
codex plugin add eve-memory-agent-builder@eve-memory-agents
```

Start a new Codex task after installation so the bundled skill is loaded.

## What `$eve` does

```text
User invokes $eve
  -> Codex asks for the agent purpose when needed
  -> checks the project and local runtime
  -> creates the pinned Eve project
  -> installs PostgreSQL operational memory
  -> installs the read-only LLM Wiki
  -> writes agent-specific instructions
  -> installs dependencies
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
2. **PostgreSQL operational memory** holds approved preferences, decisions,
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

## What is automated and what still needs access

The plugin automates:

- project scaffolding;
- memory and Wiki integration;
- project dependency installation;
- agent instruction drafting;
- compilation and structural validation;
- eval discovery and development startup guidance.

It cannot silently manufacture or authorize:

- a PostgreSQL server or valid `DATABASE_URL`;
- model-provider or AI Gateway credentials;
- production tenant authentication;
- WSL, Docker, Node.js, or other system software changes.

The skill asks before system-level installation. It can finish the scaffold and
static checks without credentials, but it must report credential-dependent live
behavior as untested.

## Runtime and security boundaries

- Never commit `DATABASE_URL` or provider credentials.
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

Release `0.5.0` targets `eve@0.39.0` and Node.js 24. A release is ready when:

- the plugin and the single `$eve` skill validate;
- a fresh agent is created without running `eve init`;
- dependency installation produces a lockfile;
- root and memory-extension TypeScript/build commands pass;
- `eve info` reports nine tools and zero diagnostics;
- both structural validators pass;
- all five memory and Wiki evals are discovered;
- the Wiki remains read-only at runtime.

Live PostgreSQL, approval-resume, authenticated cross-tenant, and deployed
session tests require private credentials and are reported separately.

## External relationships

- [vercel/eve](https://github.com/vercel/eve) supplies the underlying agent
  runtime.
- [Karpathy's LLM Wiki gist](https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f)
  supplies the Wiki design inspiration.
- [melkizac/eve-memory-agent-builder](https://github.com/melkizac/eve-memory-agent-builder)
  owns the Codex plugin, `$eve` workflow, operational memory extension, Wiki
  integration, templates, scripts, and validation.

## License

Apache License 2.0. See [LICENSE](LICENSE).
