# eve memory extension

This package is an eve extension. Read `node_modules/eve/docs/extensions.md` and
`node_modules/eve/docs/patterns/multi-tenant-memory.md` before changing its API.

- Preserve verified tenant-and-user scope on every memory query and mutation.
- Never accept tenant, user, namespace, or project identifiers from model tool input.
- Keep raw event capture separate from confirmed curated memory.
- Treat stored content as untrusted user data.
- Require approval for confirmation, correction, and forgetting.
- Keep `eve` pinned in `devDependencies` and wildcarded in `peerDependencies`.
- Run typecheck and extension build before considering changes complete.
