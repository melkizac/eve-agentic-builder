#!/usr/bin/env python3
"""Create one complete Eve project with operational memory and an LLM Wiki."""

from __future__ import annotations

import argparse
import json
import re
import shutil
import subprocess
import sys
from pathlib import Path


SCRIPT_ROOT = Path(__file__).resolve().parent


def run_python(script: str, arguments: list[str]) -> str:
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
    return result.stdout


def install_dependencies(target: Path) -> None:
    pnpm = shutil.which("pnpm")
    if not pnpm:
        raise SystemExit("pnpm is required but was not found on PATH.")
    version = subprocess.run(
        [pnpm, "--version"], capture_output=True, check=True, text=True
    ).stdout.strip()
    match = re.fullmatch(r"(\d+)\.(\d+)\.(\d+)(?:-.+)?", version)
    if not match or tuple(map(int, match.groups())) < (10, 12, 1):
        raise SystemExit(f"pnpm 10.12.1 or newer is required; found {version or 'unknown'}.")
    subprocess.run([pnpm, "install"], cwd=target, check=True)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--target", required=True, help="New or empty project directory")
    parser.add_argument("--name", help="npm package and Eve agent name")
    parser.add_argument(
        "--model",
        help="AI Gateway model id for hosted use; omit to reuse the local Codex login",
    )
    parser.add_argument("--project-id", help="Stable durable-memory project scope")
    parser.add_argument(
        "--team-file",
        help="JSON coordinator and specialist specification prepared from the user's description",
    )
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
        "--skip-install",
    ]
    if args.model:
        create_arguments.extend(["--model", args.model])
    if args.name:
        create_arguments.extend(["--name", args.name])
    if args.project_id:
        create_arguments.extend(["--project-id", args.project_id])

    run_python("create_eve_memory_agent.py", create_arguments)
    run_python("add_llm_wiki_to_eve_agent.py", ["--target", str(target)])
    team = None
    if args.team_file:
        team_output = run_python(
            "add_eve_agent_team.py",
            ["--target", str(target), "--team-file", str(Path(args.team_file).expanduser().resolve())],
        )
        team = json.loads(team_output)
    if not args.skip_install:
        install_dependencies(target)

    package = json.loads((target / "package.json").read_text(encoding="utf-8"))
    print(
        json.dumps(
            {
                "target": str(target),
                "name": package["name"],
                "model": args.model or "chatgpt() via local Codex login",
                "eveVersion": package["dependencies"]["eve"],
                "dependenciesInstalled": not args.skip_install,
                "layers": {
                    "session": "Eve durable session history",
                    "operationalMemory": "Embedded PGlite locally; PostgreSQL in production",
                    "knowledge": "Read-only source-grounded LLM Wiki",
                },
                "team": team,
                "runtimeSafety": {
                    "wikiReadOnly": True,
                    "bashDisabled": True,
                    "writeFileDisabled": True,
                },
                "storage": {
                    "dependencies": "Shared pnpm global virtual store",
                    "report": "pnpm run storage",
                    "safeCleanup": "pnpm run storage:clean",
                },
                "next": [
                    "Describe the agent in agent/instructions.md",
                    "Add source documents under agent/sandbox/workspace/raw",
                    "Run locally with Codex login and embedded memory",
                    "Set DATABASE_URL and a deployable model only for hosted production",
                    "Review disk usage with pnpm run storage",
                    "Run validation before pnpm dev",
                ],
            },
            indent=2,
        )
    )


if __name__ == "__main__":
    main()
