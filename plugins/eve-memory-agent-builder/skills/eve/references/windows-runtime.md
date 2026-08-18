# Windows runtime boundary

eve requires Node 24 or newer. Previous native-Windows validation built and typechecked
an eve project but `eve dev` and `eve invoke` failed when raw `C:` paths were treated as
URL protocols. Prefer Ubuntu/WSL or Linux for live execution.

- Keep active eve projects in the WSL Linux filesystem, such as `~/agents/<name>`.
- Do not place the live project under `/mnt/c` unless current eve behavior has been
  reverified there.
- Codex on Windows can invoke WSL commands and inspect files, but runtime success must
  come from an actual `eve dev`, `eve invoke`, or deployed-session check.
- A successful build, typecheck, or `eve info` does not prove live conversation behavior.
