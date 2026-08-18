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
3. Confirm Node 24 or newer and pnpm are available. The integrated starter pins
   `eve@0.39.0`; do not replace it with `latest` during project creation.
4. On Windows, run the live eve project from Ubuntu/WSL or Linux and create it in the
   Linux filesystem. Codex may orchestrate this from the Windows app.
5. Create the complete Eve and memory project from the bundled integrated starter:

   ```bash
   python3 <plugin-root>/scripts/create_eve_memory_agent.py \
     --target <target> --name <agent-name> --model <provider/model>
   ```

   The destination must be new or empty except for `.git`. Do not run `eve init`; the
   starter already includes the pinned Eve project contract, built-in HTTP channel,
   memory workspace, evals, and install step.
6. Replace the placeholder in `agent/instructions.md` with the user's concrete purpose,
   operating boundaries, and success criteria.
7. Configure `DATABASE_URL` outside version control. Configure route authentication so
   `ctx.session.auth.current` is a user principal with a verified string `tenantId`.
   Development fallback scope is permitted only outside production and only when explicitly enabled.
8. Verify:

   ```bash
   pnpm typecheck
   pnpm build
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

The project must be independently runnable after creation and contain pinned Eve runtime
dependencies, the built-in HTTP channel, the mounted `@local/eve-memory` workspace package,
memory architecture contract, event archive, curated memory tools, approval gates, provenance,
and eval cases. Treat build success as insufficient when live runtime or database
behavior was not exercised.
