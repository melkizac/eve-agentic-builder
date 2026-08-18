---
name: add-memory-to-eve-agent
description: Integrate the bundled durable-memory extension into an existing Vercel eve agent while preserving its files, instructions, tools, channels, auth, and package-manager conventions. Use when the user asks to add cross-session memory, recall, provenance, correction, forgetting, or tenant-scoped memory to an existing eve project.
---

# Add Memory to an Existing eve Agent

## Workflow

1. Inspect the real project first: `AGENTS.md`, `agent/`, `package.json`, lockfiles,
   current eve version, auth/channel configuration, Git status, tests, and evals.
2. Read `references/integration-checklist.md`.
3. Confirm the project uses a compatible eve extension contract. The bundled package
   targets `eve@0.39.0`; reconcile API drift before editing.
4. Run the bootstrap script without `--force`:

   ```bash
   python3 <plugin-root>/scripts/bootstrap_eve_memory.py --target <project>
   ```

   If generated memory paths already exist, inspect and merge them deliberately. Do not
   overwrite them with `--force` unless the user explicitly authorizes replacement.
5. Configure a non-production database first. Ensure route auth supplies a verified user
   and `tenantId`; never accept identity scope through prompts or tool parameters.
6. Run package install, existing project tests, memory typecheck/build, `eve info`, and
   the structural validator. Run memory evals only against isolated test data.
7. Report exactly what changed and distinguish static validation from live database,
   cross-session, approval, and isolation evidence.

Do not deploy, migrate a production database, or enable local fallback in production
without explicit approval.
