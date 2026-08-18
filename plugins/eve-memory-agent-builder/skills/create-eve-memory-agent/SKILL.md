---
name: create-eve-memory-agent
description: Create a new real Vercel eve agent with the bundled PostgreSQL durable-memory extension, authenticated tenant isolation, approval-gated memory lifecycle, provenance, and evals. Use when the user asks Codex to build, scaffold, initialize, or generate a new eve agent that remembers across sessions.
---

# Create an eve Memory Agent

Build a real eve project and integrate the plugin's memory extension. Do not use
the folder-only Eve-inspired scaffold for this workflow.

## Workflow

1. Inspect the destination, existing instructions, package manager, runtime, and Git status.
2. Read `references/architecture.md`. On Windows, also read `references/windows-runtime.md`.
3. Confirm the current npm `eve` version and Node engine. The bundled extension targets
   `eve@0.39.0` and Node 24. If npm reports a newer incompatible eve release, update and
   validate the bundled extension before generating the project; do not silently mix APIs.
4. On Windows, run the live eve project from Ubuntu/WSL or Linux and create it in the
   Linux filesystem. Codex may orchestrate this from the Windows app.
5. Scaffold with an explicit target so a non-interactive run cannot enter a location prompt:

   ```bash
   pnpm dlx eve@0.39.0 init <target> --model <provider/model>
   ```

6. Run the plugin bootstrap script against the new project:

   ```bash
   python3 <plugin-root>/scripts/bootstrap_eve_memory.py --target <target>
   ```

7. Configure `DATABASE_URL` outside version control. Configure route authentication so
   `ctx.session.auth.current` is a user principal with a verified string `tenantId`.
   Development fallback scope is permitted only outside production and only when explicitly enabled.
8. Install and verify:

   ```bash
   pnpm install
   pnpm memory:typecheck
   pnpm memory:build
   pnpm exec eve info
   python3 <plugin-root>/scripts/validate_eve_memory_project.py --target <target>
   ```

9. Run the agent's relevant tests and memory evals when credentials and a disposable
   test database are available. Never point evals at production memory.
10. Report the created paths, verification evidence, unverified runtime boundaries, and
    required environment variables. Do not deploy, publish, or expose credentials without approval.

## Required result

The project must contain the mounted `@local/eve-memory` workspace package,
memory architecture contract, event archive, curated memory tools, approval gates, provenance,
and eval cases. Treat build success as insufficient when live runtime or database
behavior was not exercised.
