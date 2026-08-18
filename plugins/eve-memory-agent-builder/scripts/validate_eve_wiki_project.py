#!/usr/bin/env python3
"""Validate the structural boundary of an Eve agent with an LLM Wiki."""

from __future__ import annotations

import argparse
import json
from pathlib import Path


REQUIRED = [
    "package.json",
    "agent/instructions.md",
    "agent/tools/bash.ts",
    "agent/tools/write_file.ts",
    "agent/tools/wiki_search.ts",
    "agent/tools/wiki_read.ts",
    "agent/tools/wiki_sources.ts",
    "agent/sandbox/workspace/raw/README.md",
    "agent/sandbox/workspace/wiki/index.md",
    "agent/sandbox/workspace/wiki/source-manifest.md",
    "agent/sandbox/workspace/wiki/log.md",
    "docs/wiki-memory-contract.md",
    "evals/wiki/wiki-retrieval.eval.ts",
    "evals/wiki/wiki-readonly.eval.ts",
]


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--target", required=True)
    args = parser.parse_args()
    root = Path(args.target).expanduser().resolve()

    failures = [relative for relative in REQUIRED if not (root / relative).is_file()]
    for relative in ("agent/tools/bash.ts", "agent/tools/write_file.ts"):
        path = root / relative
        if path.is_file() and "disableTool" not in path.read_text(encoding="utf-8"):
            failures.append(f"{relative} does not disable the default runtime tool")

    instructions = root / "agent" / "instructions.md"
    if instructions.is_file():
        content = instructions.read_text(encoding="utf-8")
        for token in ("wiki_search", "wiki_read", "wiki_sources", "read-only"):
            if token not in content:
                failures.append(f"agent instructions omit {token!r}")

    contract = root / "docs" / "wiki-memory-contract.md"
    if contract.is_file():
        content = contract.read_text(encoding="utf-8").lower()
        for token in ("operational memory", "immutable", "untrusted", "contradictions"):
            if token not in content:
                failures.append(f"Wiki contract omits {token!r}")

    result = {"target": str(root), "passed": not failures, "failures": failures}
    print(json.dumps(result, indent=2))
    raise SystemExit(0 if not failures else 1)


if __name__ == "__main__":
    main()
