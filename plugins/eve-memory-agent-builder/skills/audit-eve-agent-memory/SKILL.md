---
name: audit-eve-agent-memory
description: Audit a Vercel eve agent's durable-memory implementation for retrieval accuracy, provenance, approval gates, correction and deletion, secret handling, cross-session recall, tenant isolation, subagent boundaries, and production readiness. Use when the user asks to review, test, validate, assess, or troubleshoot eve agent memory.
---

# Audit eve Agent Memory

Inspect and report by default. Implement fixes only when the user asks for changes.

## Audit workflow

1. Read project instructions and approval gates before commands or edits.
2. Read `references/audit-matrix.md` and inspect the actual mount, extension, schema,
   route auth, tools, hooks, instructions, tests, and evals.
3. Run the structural validator when the bundled layout is present:

   ```bash
   python3 <plugin-root>/scripts/validate_eve_memory_project.py --target <project>
   ```

4. Run typecheck, extension build, `eve info`, and existing tests. Use a disposable test
   database for runtime tests. Never probe another tenant's production data.
5. Separate evidence into:
   - verified static structure;
   - verified build/typecheck;
   - verified live memory behavior;
   - unverified claims or blocked checks.
6. Rate each matrix row `pass`, `partial`, `fail`, or `not tested`, with file or runtime evidence.

Do not infer privacy or isolation from successful compilation. A strong result requires
two authenticated scopes, cross-session recall, source retrieval, correction, deletion,
secret rejection, approval parking/resume, and negative cross-scope retrieval tests.
