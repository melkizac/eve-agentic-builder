#!/usr/bin/env python3
"""Perform deterministic structural checks for a memory-enabled eve project."""

from __future__ import annotations

import argparse
import json
from pathlib import Path


REQUIRED = [
    "package.json",
    ".gitignore",
    "agent/agent.ts",
    "agent/instructions.md",
    "agent/channels/eve.ts",
    "agent/extensions/memory.ts",
    "scripts/doctor.mjs",
    "docs/memory-architecture.md",
    "packages/eve-memory/package.json",
    "packages/eve-memory/extension/extension.ts",
    "packages/eve-memory/extension/hooks/capture.ts",
    "packages/eve-memory/extension/instructions/memory.ts",
    "packages/eve-memory/extension/lib/database.ts",
    "packages/eve-memory/extension/tools/search.ts",
    "packages/eve-memory/extension/tools/propose.ts",
    "packages/eve-memory/extension/tools/confirm.ts",
    "packages/eve-memory/extension/tools/correct.ts",
    "packages/eve-memory/extension/tools/forget.ts",
    "evals/memory/secret-rejection.eval.ts",
    "evals/memory/approval-gates.eval.ts",
    "packages/eve-memory/tests/database.test.mjs",
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
        if package.get("dependencies", {}).get("eve") != "0.39.0":
            failures.append("package.json must pin eve to 0.39.0")
        if package.get("dependencies", {}).get("@local/eve-memory") != "workspace:*":
            failures.append("package.json dependency @local/eve-memory is missing or incorrect")

    extension_package_path = root / "packages/eve-memory/package.json"
    if extension_package_path.is_file():
        extension_package = json.loads(extension_package_path.read_text(encoding="utf-8"))
        if extension_package.get("dependencies", {}).get("@electric-sql/pglite") != "0.5.5":
            failures.append("memory extension must pin @electric-sql/pglite to 0.5.5")

    agent_source = root / "agent/agent.ts"
    if agent_source.is_file():
        source = agent_source.read_text(encoding="utf-8")
        if "__MODEL_" in source:
            failures.append("agent model template placeholders were not resolved")
        if "chatgpt()" not in source and "model:" not in source:
            failures.append("agent model configuration is missing")

    mount_source = root / "agent/extensions/memory.ts"
    if mount_source.is_file():
        source = mount_source.read_text(encoding="utf-8")
        for token in ("EVE_MEMORY_BACKEND", "EVE_MEMORY_DATA_DIR", "databaseUrl"):
            if token not in source:
                failures.append(f"memory mount omits {token}")
        if 'throw new Error("DATABASE_URL is required for durable memory.")' in source:
            failures.append("memory mount still requires DATABASE_URL for local use")

    database_source = root / "packages/eve-memory/extension/lib/database.ts"
    if database_source.is_file():
        source = database_source.read_text(encoding="utf-8")
        for token in ("PGlite", 'process.env.NODE_ENV === "production"', "DATABASE_URL"):
            if token not in source:
                failures.append(f"memory database adapter omits {token}")

    gitignore_path = root / ".gitignore"
    if gitignore_path.is_file() and ".eve-data" not in gitignore_path.read_text(encoding="utf-8"):
        failures.append(".gitignore must exclude .eve-data")

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
