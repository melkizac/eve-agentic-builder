# Existing-project integration checklist

- Preserve existing instructions and same-named tools.
- Mount the extension under `agent/extensions/memory.ts`; contributed tools receive the
  `memory__` prefix.
- Keep `@local/eve-memory` as a local file dependency unless the user requests publishing.
- Verify `.eve-data/` and `.env*` remain ignored except examples.
- Use embedded PGlite when no `DATABASE_URL` exists in non-production local use.
- Require PostgreSQL and verified tenant identity before production or multi-user claims.
- Confirm route auth establishes a stable user principal and verified `tenantId`.
- Confirm every database query scopes namespace, tenant, user, and project before retrieval.
- Keep raw runtime events separate from curated confirmed items.
- Keep reasoning capture disabled unless a privacy review explicitly permits it.
- Ensure approval remains on confirm, correct, and forget.
- Preserve source event and session identifiers for consequential-memory verification.
- Verify subagents receive only bounded task-relevant memory; declared subagents do not
  automatically inherit the root extension.
- Run existing tests before and after integration and report unrelated failures separately.
