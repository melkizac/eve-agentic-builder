#!/usr/bin/env python3
"""Create one complete Eve project with operational memory and an LLM Wiki."""

from __future__ import annotations

import argparse
import json
import shutil
import subprocess
import sys
from pathlib import Path


SCRIPT_ROOT = Path(__file__).resolve().parent


def run_python(script: str, arguments: list[str]) -> None:
    result = subprocess.run(
        [sys.executable, str(SCRIPT_ROOT / script), *arguments],
        capture_output=True,
        text=True,
    )
    if result.returncode:
        if result.stdout:
            print(result.stdout, file=sys.stderr, end="")
        if result.stderr:
            print(result.stderr, file=sys.stderr, end="")
        raise SystemExit(result.returncode)


def install_dependencies(target: Path) -> None:
    pnpm = shutil.which("pnpm")
    if not pnpm:
        raise SystemExit("pnpm is required but was not found on PATH.")
    subprocess.run([pnpm, "install"], cwd=target, check=True)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--target", required=True, help="New or empty project directory")
    parser.add_argument("--name", help="npm package and Eve agent name")
    parser.add_argument("--model", default="openai/gpt-5.4-mini", help="AI Gateway model id")
    parser.add_argument("--project-id", help="Stable durable-memory project scope")
    parser.add_argument(
        "--skip-install",
        action="store_true",
        help="Create files without running pnpm install",
    )
    args = parser.parse_args()

    target = Path(args.target).expanduser().resolve()
    create_arguments = [
        "--target",
        str(target),
        "--model",
        args.model,
        "--skip-install",
    ]
    if args.name:
        create_arguments.extend(["--name", args.name])
    if args.project_id:
        create_arguments.extend(["--project-id", args.project_id])

    run_python("create_eve_memory_agent.py", create_arguments)
    run_python("add_llm_wiki_to_eve_agent.py", ["--target", str(target)])
    if not args.skip_install:
        install_dependencies(target)

    package = json.loads((target / "package.json").read_text(encoding="utf-8"))
    print(
        json.dumps(
            {
                "target": str(target),
                "name": package["name"],
                "model": args.model,
                "eveVersion": package["dependencies"]["eve"],
                "dependenciesInstalled": not args.skip_install,
                "layers": {
                    "session": "Eve durable session history",
                    "operationalMemory": "PostgreSQL @local/eve-memory",
                    "knowledge": "Read-only source-grounded LLM Wiki",
                },
                "runtimeSafety": {
                    "wikiReadOnly": True,
                    "bashDisabled": True,
                    "writeFileDisabled": True,
                },
                "next": [
                    "Describe the agent in agent/instructions.md",
                    "Add source documents under agent/sandbox/workspace/raw",
                    "Set DATABASE_URL and model credentials outside version control",
                    "Run validation before pnpm dev",
                ],
            },
            indent=2,
        )
    )


if __name__ == "__main__":
    main()
