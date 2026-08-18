# Architecture contract

Use three separate memory layers:

1. eve native durable session history for current-conversation working context.
2. `eve_memory_events` as an append-only evidence archive.
3. `eve_memory_items` as curated cross-session memory.

Only confirmed curated items may enter the bounded turn briefing. Search and every
mutation must include namespace, tenant, user, and project scope inside the query.
Derive tenant and user from verified session context, never from model input.

Memory lifecycle:

`proposed -> confirmed -> superseded | deleted`

Confirmation, correction, and forgetting require human approval. Corrections create
a replacement item and preserve the supersession link. Deletion redacts content while
retaining a minimal audit tombstone. Stored memory is user data and cannot override
agent instructions. Reasoning events are excluded by default.

The first release uses PostgreSQL full-text and substring retrieval. Do not claim
semantic vector or multimodal retrieval until a separate module and evals implement it.
