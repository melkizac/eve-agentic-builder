---
name: add-llm-wiki-to-eve-agent
description: Add a Karpathy-style LLM Wiki knowledge layer to an existing Eve agent, with immutable raw sources, maintained Markdown synthesis, bounded read-only runtime tools, source references, Wiki evals, and separation from operational memory. Use when the user wants an Eve agent to answer from accumulated documents, research, project knowledge, or an LLM Wiki without replacing durable user memory.
---

# Add LLM Wiki to Eve Agent

Add a source-grounded Wiki snapshot that Codex maintains and the Eve runtime reads.
Keep Wiki knowledge separate from session history and curated operational memory.

## Workflow

1. Inspect the target, its `AGENTS.md`, Eve version, sandbox, tools, memory layer,
   Git status, and existing `raw/` or `wiki/` content.
2. Read `references/architecture.md`. When sources will be ingested or reviewed,
   also read `references/wiki-maintenance.md`. Preserve existing sources and instructions.
3. Run the deterministic installer:

   ```bash
   python3 <plugin-root>/scripts/add_llm_wiki_to_eve_agent.py --target <eve-project>
   ```

   Stop on conflicting `bash.ts`, `write_file.ts`, or `wiki_*.ts` tools. Do not
   weaken the read-only runtime boundary silently.
4. Put source material under `agent/sandbox/workspace/raw/`. Follow the bundled
   Wiki maintenance workflow for pages under `agent/sandbox/workspace/wiki/`.
   Codex may update these authored files; the running Eve agent may not.
5. Preserve the layer boundary:
   - Eve history: current durable conversation.
   - `@local/eve-memory`: confirmed user and project operational memory.
   - LLM Wiki: source-backed concepts, entities, comparisons, and synthesis.
6. Verify:

   ```bash
   pnpm typecheck
   pnpm build
   pnpm exec eve info
   python3 <plugin-root>/scripts/validate_eve_wiki_project.py --target <eve-project>
   ```

7. Run Wiki evals when model credentials are available. Rebuild or start a new
   session after changing authored Wiki files so the next sandbox receives the
   updated snapshot.
8. Report what was installed, source-ingestion status, validation evidence, and
   whether live runtime retrieval was exercised.

## Required result

Provide immutable raw-source and maintained Wiki directories, bounded
`wiki_search`, `wiki_read`, and `wiki_sources` tools, disabled runtime shell and
file writes, routing instructions, source manifest, index, log, contract, and
evals. Do not claim that the Wiki is a live shared database; it is a versioned
authored snapshot until a separately designed persistent Wiki store is added.
