# Beginner contract

The user should only need to describe the agent they want and invoke
`$eve`. Codex owns project creation, installation,
instruction drafting, and static validation.

## What the user receives

- A pinned Eve project that starts with `pnpm dev`.
- Durable PostgreSQL operational memory with approval-gated changes.
- A source-grounded Markdown Wiki exposed through three read-only tools.
- Generated safety instructions, evals, and structural validators.

## What still needs user-owned access

- `DATABASE_URL` for live cross-session memory.
- A valid credential for the selected model or AI Gateway.
- Authenticated tenant identity and a disposable database for production-grade
  isolation and lifecycle testing.

Never ask a beginner to run the scaffold commands themselves when Codex has shell
access. Never print, commit, or copy credentials into tracked files. Explain any
missing credential as a boundary on live testing, not as a failure to create the
project.
