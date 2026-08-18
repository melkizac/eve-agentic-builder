# Wiki maintenance workflow

## Ingest

1. Read `wiki/index.md`, `wiki/source-manifest.md`, and recent `wiki/log.md` entries.
2. Inspect the immutable raw source directly.
3. Create or update a source summary under `wiki/sources/`.
4. Update only durable concept or entity pages that the source materially affects.
5. Link claims to the source summary or raw path. Mark contradictions, uncertainty,
   stale claims, and superseded values explicitly.
6. Update `wiki/index.md` and the source status in `wiki/source-manifest.md`.
7. Append `## [YYYY-MM-DD] ingest | Short title` to `wiki/log.md`.

## Query

1. Read the index first and search the Wiki before opening raw sources.
2. Read relevant pages and their recorded source references.
3. Inspect raw evidence when a consequential claim is not adequately supported.
4. Cite Wiki paths and source paths in the answer.
5. File durable new synthesis only when it will recur; record the update in the log.

## Lint

- Find pages missing from the index.
- Find manifest entries without source summaries.
- Search for `needs-review`, `contradiction`, `uncertain`, and `stale`.
- Find important claims without source links and orphan pages without inbound links.
- Append `## [YYYY-MM-DD] lint | Short title` to the log.

Use concise YAML frontmatter with `type`, `status`, `created`, `updated`,
`sources`, and `tags`. Prefer lowercase hyphenated filenames.
