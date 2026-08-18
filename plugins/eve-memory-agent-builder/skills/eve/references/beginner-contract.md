# Beginner contract

The user should only need to describe the agent they want and invoke
`$eve`. Codex owns project creation, installation,
instruction drafting, and static validation.

## What the user receives

- A pinned Eve project that starts with `pnpm dev`.
- Durable embedded operational memory with approval-gated changes for local use.
- Automatic PostgreSQL selection when a production `DATABASE_URL` is supplied.
- A source-grounded Markdown Wiki exposed through three read-only tools.
- Generated safety instructions, evals, and structural validators.
- Shared pnpm dependency graphs so hundreds of projects do not duplicate package trees.

## Zero-configuration local defaults

- PGlite persists local memory under `.eve-data/memory` without a database server.
- Eve's `chatgpt()` model uses the local Codex login without a separate model key.
- The local development identity is permitted only outside production.
- pnpm's global virtual store keeps project-level dependency links small and is disabled automatically in CI.

## Storage safety

- `pnpm run storage` reports project-local usage without following shared-store links.
- `pnpm run storage:clean` removes only rebuildable `.output` data.
- Never remove `.eve/.workflow-data`, `.eve-data`, authored files, or sandbox state during cleanup.

## What still needs user-owned access for production

- `DATABASE_URL` for hosted or multi-user operational memory.
- A deployable model credential or Vercel project OIDC.
- Authenticated tenant identity and a disposable database for production-grade
  isolation and lifecycle testing.

Never ask a beginner to run scaffold or database commands when Codex has shell
access. Never print, commit, copy, or inspect credential files. Explain hosted
credentials as a deployment boundary, not a local-install requirement.
