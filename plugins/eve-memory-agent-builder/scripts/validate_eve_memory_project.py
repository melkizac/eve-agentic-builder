#!/usr/bin/env python3
"""Perform deterministic structural checks for a memory-enabled eve project."""

from __future__ import annotations

import argparse
import json
from pathlib import Path


REQUIRED = [
    "package.json",
    "agent/extensions/memory.ts",
    "docs/memory-architecture.md",
    "packages/eve-memory/package.json",
    "packages/eve-memory/extension/extension.ts",
    "packages/eve-memory/extension/hooks/capture.ts",
    "packages/eve-memory/extension/instructions/memory.ts",
    "packages/eve-memory/extension/tools/search.ts",
    "packages/eve-memory/extension/tools/propose.ts",
    "packages/eve-memory/extension/tools/confirm.ts",
    "packages/eve-memory/extension/tools/correct.ts",
    "packages/eve-memory/extension/tools/forget.ts",
    "evals/memory/secret-rejection.eval.ts",
    "evals/memory/approval-gates.eval.ts",
]


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--target", required=True)
    args = parser.parse_args()
    root = Path(args.target).expanduser().resolve()

    missing = [relative for relative in REQUIRED if not (root / relative).is_file()]
    failures = list(missing)
    package_path = root / "package.json"
    if package_path.is_file():
        package = json.loads(package_path.read_text(encoding="utf-8"))
        if package.get("dependencies", {}).get("@local/eve-memory") != "workspace:*":
            failures.append("package.json dependency @local/eve-memory is missing or incorrect")

    scope_source = root / "packages/eve-memory/extension/lib/scope.ts"
    if scope_source.is_file():
        source = scope_source.read_text(encoding="utf-8")
        if "ctx.session.auth.current" not in source:
            failures.append("scope is not derived from ctx.session.auth.current")
        if "tenantId" not in source:
            failures.append("tenant scope is missing")

    policy_source = root / "packages/eve-memory/extension/instructions/memory-policy.md"
    if policy_source.is_file():
        policy = policy_source.read_text(encoding="utf-8").lower()
        for token in ("password", "access token", "private key", "approval"):
            if token not in policy:
                failures.append(f"memory policy omits {token!r}")

    result = {"target": str(root), "passed": not failures, "failures": failures}
    print(json.dumps(result, indent=2))
    raise SystemExit(0 if not failures else 1)


if __name__ == "__main__":
    main()
