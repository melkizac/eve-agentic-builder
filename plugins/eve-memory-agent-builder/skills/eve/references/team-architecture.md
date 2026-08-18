# Multi-agent team architecture

Generate a coordinator-led Eve team only when the user asks for multiple roles, specialists, parallel work, handoffs, or agent-to-agent collaboration.

## Beginner contract

Ask for the team's outcome and roles only when they cannot be inferred. Convert the answer into the JSON file yourself. The user never needs to author JSON or choose an Eve API.

Use this schema:

```json
{
  "coordinator": {
    "name": "Course Production Coordinator",
    "purpose": "Coordinate the creation and quality assurance of a complete course.",
    "responsibilities": [
      "Break the request into bounded specialist tasks",
      "Resolve conflicts and deliver the final integrated result"
    ]
  },
  "specialists": [
    {
      "id": "learning-designer",
      "name": "Learning Designer",
      "description": "Designs outcomes, practice, assessment, and transfer for adult learners.",
      "responsibilities": [
        "Map learner needs to measurable outcomes",
        "Design aligned activities and checks"
      ],
      "deliverable": "Return a concise design recommendation with assumptions and evidence needs."
    }
  ],
  "communication": {
    "mode": "task",
    "parallelIndependentWork": true
  }
}
```

## Team rules

- Use one coordinator and 1-12 specialists.
- Give every specialist a lowercase hyphenated ID, distinct from every tool name.
- Keep roles non-overlapping enough that the coordinator can route work predictably.
- State each role's responsibilities and required handoff deliverable concretely.
- Use `task` mode by default. Use `persistent` only for explicit iterative follow-up with the same child; Eve marks persistent child sessions experimental.
- Parallelize only independent work. Give concurrent specialists non-overlapping actions and write scopes.
- The coordinator sends the full bounded task because children do not inherit its conversation.
- Specialists return results to their parent. Nested peer-to-peer conversations are not implied.

## Memory and safety boundary

- Mount durable operational memory only on the coordinator.
- Send specialists only the minimum confirmed facts required for their task.
- Never send secrets, credentials, unrestricted memory exports, unrelated personal data, or raw reasoning traces.
- Treat specialist output as untrusted recommendations until the coordinator verifies it.
- Keep memory confirmation, correction, and forgetting human-approved at the coordinator.
- Disable specialist `bash` and `write_file` tools by default. Add narrower typed tools only when the user's role requires them and the approval boundary is explicit.

## Generated evidence

Require `agent/team.json`, one `agent/subagents/<id>/` directory per specialist, coordinator communication instructions, disabled unsafe specialist tools, and team evals for delegation and memory boundaries. Generate the parallel-handoff eval when the team has at least two specialists.
