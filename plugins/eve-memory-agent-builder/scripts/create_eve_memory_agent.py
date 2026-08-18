#!/usr/bin/env python3
"""Create an integrated eve agent and install the bundled memory extension."""

from __future__ import annotations

import argparse
import json
import re
import shutil
import subprocess
from pathlib import Path

from bootstrap_eve_memory import bootstrap_project


PLUGIN_ROOT = Path(__file__).resolve().parents[1]
STARTER_ROOT = PLUGIN_ROOT / "assets" / "eve-agent-starter"


def package_name(value: str) -> str:
    normalized = re.sub(r"[^a-z0-9._-]+", "-", value.lower()).strip("-._")
    if not normalized:
        raise ValueError("Agent name must contain at least one letter or number.")
    return normalized


def ensure_safe_target(target: Path) -> None:
    if target == PLUGIN_ROOT or PLUGIN_ROOT in target.parents:
        raise SystemExit("Refusing to generate an agent inside the plugin source.")
    if not target.exists():
        return
    owned = [entry for entry in target.iterdir() if entry.name != ".git"]
    if owned:
        names = ", ".join(sorted(entry.name for entry in owned[:5]))
        raise SystemExit(
            f"Target is not empty: {target}. Existing entries include: {names}. "
            "Use the add-memory skill for an existing eve project."
        )


def install_dependencies(target: Path) -> None:
    pnpm = shutil.which("pnpm")
    if not pnpm:
        raise SystemExit("pnpm is required but was not found on PATH.")
    subprocess.run([pnpm, "install"], cwd=target, check=True)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--target", required=True, help="New or empty project directory")
    parser.add_argument("--name", help="npm package and eve agent name")
    parser.add_argument("--model", default="openai/gpt-5.4-mini", help="AI Gateway model id")
    parser.add_argument("--project-id", help="Stable durable-memory project scope")
    parser.add_argument(
        "--skip-install",
        action="store_true",
        help="Create files without running pnpm install",
    )
    args = parser.parse_args()

    target = Path(args.target).expanduser().resolve()
    ensure_safe_target(target)
    target.mkdir(parents=True, exist_ok=True)
    shutil.copytree(STARTER_ROOT, target, dirs_exist_ok=True)

    name = package_name(args.name or target.name)
    package_path = target / "package.json"
    package = json.loads(package_path.read_text(encoding="utf-8"))
    package["name"] = name
    package_path.write_text(
        json.dumps(package, indent=2) + "\n", encoding="utf-8", newline="\n"
    )

    agent_path = target / "agent" / "agent.ts"
    agent_source = agent_path.read_text(encoding="utf-8")
    agent_path.write_text(
        agent_source.replace('"__MODEL_ID__"', json.dumps(args.model)),
        encoding="utf-8",
        newline="\n",
    )

    memory_result = bootstrap_project(
        target=target,
        project_id=args.project_id or name,
        force=False,
    )
    if not args.skip_install:
        install_dependencies(target)

    print(
        json.dumps(
            {
                "target": str(target),
                "name": name,
                "model": args.model,
                "eveVersion": package["dependencies"]["eve"],
                "dependenciesInstalled": not args.skip_install,
                "memory": memory_result,
                "next": [
                    "Replace the placeholder in agent/instructions.md",
                    "Set DATABASE_URL outside version control",
                    "Configure verified tenant identity before production",
                    "Run pnpm typecheck && pnpm build",
                    "Run pnpm exec eve info and the plugin validator",
                ],
            },
            indent=2,
        )
    )


if __name__ == "__main__":
    main()
