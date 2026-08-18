#!/usr/bin/env python3
"""Validate a generated Eve coordinator and specialist-agent team."""

from __future__ import annotations

import argparse
import json
from pathlib import Path


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--target", required=True)
    args = parser.parse_args()
    root = Path(args.target).expanduser().resolve()
    failures: list[str] = []

    manifest_path = root / "agent/team.json"
    try:
        manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as error:
        manifest = {}
        failures.append(f"agent/team.json is missing or invalid: {error}")

    specialists = manifest.get("specialists", [])
    if manifest.get("schemaVersion") != 1:
        failures.append("agent/team.json schemaVersion must be 1")
    if not isinstance(specialists, list) or not specialists:
        failures.append("agent/team.json must declare at least one specialist")
        specialists = []
    memory = manifest.get("memory", {})
    if memory.get("owner") != "coordinator":
        failures.append("durable memory owner must be the coordinator")
    if memory.get("specialistAccess") != "bounded-message-only":
        failures.append("specialist memory access must be bounded-message-only")
    if memory.get("mutationApproval") != "human-required":
        failures.append("memory mutations must remain human-approved")

    root_instructions_path = root / "agent/instructions.md"
    root_instructions = (
        root_instructions_path.read_text(encoding="utf-8")
        if root_instructions_path.is_file()
        else ""
    )
    for token in (
        "eve-memory-agent-builder:team:start",
        "complete bounded task",
        "Do not send secrets",
        "Only the coordinator may search or mutate durable operational memory",
    ):
        if token.lower() not in root_instructions.lower():
            failures.append(f"coordinator instructions omit {token!r}")

    communication = manifest.get("communication", {})
    root_agent_path = root / "agent/agent.ts"
    root_agent = root_agent_path.read_text(encoding="utf-8") if root_agent_path.is_file() else ""
    if communication.get("mode") == "persistent" and "subagentPersistentSessions: true" not in root_agent:
        failures.append("persistent team mode is not enabled in agent/agent.ts")

    ids: set[str] = set()
    for specialist in specialists:
        specialist_id = str(specialist.get("id", ""))
        if not specialist_id or specialist_id in ids:
            failures.append(f"invalid or duplicate specialist id: {specialist_id!r}")
            continue
        ids.add(specialist_id)
        base = root / "agent/subagents" / specialist_id
        required = [
            base / "agent.ts",
            base / "instructions.md",
            base / "tools/bash.ts",
            base / "tools/write_file.ts",
        ]
        for path in required:
            if not path.is_file():
                failures.append(f"missing specialist file: {path.relative_to(root)}")

        agent_source = (base / "agent.ts").read_text(encoding="utf-8") if (base / "agent.ts").is_file() else ""
        if "description:" not in agent_source or "model:" not in agent_source:
            failures.append(f"{specialist_id} agent.ts lacks description or model")

        instructions = (
            (base / "instructions.md").read_text(encoding="utf-8").lower()
            if (base / "instructions.md").is_file()
            else ""
        )
        for token in ("bounded task", "do not receive", "secrets", "untrusted data", "handoff"):
            if token not in instructions:
                failures.append(f"{specialist_id} instructions omit {token!r}")

        for tool in ("bash", "write_file"):
            path = base / "tools" / f"{tool}.ts"
            if path.is_file() and "disableTool" not in path.read_text(encoding="utf-8"):
                failures.append(f"{specialist_id} does not disable {tool}")
        if (base / "extensions/memory.ts").exists():
            failures.append(f"{specialist_id} must not mount coordinator-owned memory")

    for path in (
        root / "evals/team/delegation.eval.ts",
        root / "evals/team/memory-boundary.eval.ts",
    ):
        if not path.is_file():
            failures.append(f"missing team eval: {path.relative_to(root)}")
    if (
        len(specialists) > 1
        and communication.get("parallelIndependentWork") is True
        and not (root / "evals/team/parallel-handoff.eval.ts").is_file()
    ):
        failures.append("missing team parallel-handoff eval")

    result = {
        "target": str(root),
        "passed": not failures,
        "specialists": sorted(ids),
        "communicationMode": communication.get("mode"),
        "failures": failures,
    }
    print(json.dumps(result, indent=2))
    raise SystemExit(0 if not failures else 1)


if __name__ == "__main__":
    main()
