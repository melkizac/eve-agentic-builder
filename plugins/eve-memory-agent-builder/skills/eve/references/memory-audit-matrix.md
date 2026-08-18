# Memory audit matrix

| Area | Required evidence |
|---|---|
| Session continuity | Follow-up resumes the same eve session and history |
| Cross-session recall | Confirmed memory is available in a separate session for the same scope |
| Tenant isolation | Tenant B cannot search, fetch, correct, or delete Tenant A memory |
| User isolation | A different user in one tenant cannot access another user's private memory |
| Project isolation | The same user cannot leak memory across project IDs |
| Provenance | Consequential memory resolves to source session/event evidence |
| Trust boundary | Stored text is encoded as user data and cannot become system instruction |
| Promotion | Proposed items are excluded until explicitly confirmed |
| Approval | Confirmation, correction, and forgetting park for approval |
| Correction | Replacement is confirmed and previous item is superseded with a link |
| Forgetting | Content is redacted and no longer retrievable as active memory |
| Secret handling | Passwords, tokens, private keys, payment data, and OTPs are rejected |
| Capture privacy | Reasoning capture is disabled by default; oversized events are bounded |
| Failure behavior | Capture outage does not corrupt eve history; memory tools surface failures |
| Subagents | Only bounded task-relevant memory crosses the subagent boundary |
| Context budget | Briefing has a strict item limit and deeper recall uses a tool |
| Operational proof | Typecheck, extension build, `eve info`, evals, and runtime checks are recorded |
