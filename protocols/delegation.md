# Delegation Protocol

Use this protocol when one Hermes profile calls another profile to do specialized work.

## Handoff Format
Every handoff should include:

```text
^profile-name
Objective: what you need done.
Context: files, constraints, prior decisions, and current task state.
Inputs: exact paths, URLs, snippets, or commands to inspect.
Expected output: what to return or write.
Verification: how success should be checked.
Memory updates: what should be recorded and where.
```

## Handoff Quality
Every handoff must include at minimum:
- **Objective** (required): what you need done, stated clearly.
- **Inputs** (required): exact file paths, URLs, or commands to inspect. Never "read the project files" — be specific about what the receiver needs.
- **Expected output** (required): what the receiver should return or write, and where.

Context, Verification, and Memory updates are strongly recommended but not enforced. If a handoff arrives without Objective, Inputs, or Expected output, the receiving agent should ask for clarification rather than guessing.

Verification should be framed as a testable checklist ("1. Script is idempotent, 2. No hardcoded paths") rather than prose.

## Routing Defaults
- Send ambiguous new work to `senter`.
- Send planning and explanation work to `anser`.
- Send external research to `crow`.
- Send implementation to `chizul`.
- Send review, tests, and standards checks to `klerik`.
- Send memory consolidation and project wiki updates to `kashik`.
- Send creative ideation to `nous-girl`.
- Send deployment and infrastructure tasks to `frieza`.

## Required Handoff Rules
- Always name the files the receiving profile should read first.
- Always state whether the profile should edit files or only report.
- Use project-local files for durable output when possible.
- Do not ask multiple agents to edit the same file in parallel unless Senter coordinates it.
- After implementation, route to Klerik for review (mandatory for code, config, scripts, protocols, deployment, cron, credentials, ~/.hermes modifications, and external system changes; waivable by explicit user approval for low-risk docs, notes, research, and task-board updates). See AGENTS.md Done Definition for full policy.
- After major work, route to Kashik for status/memory consolidation.

## Good Examples

```text
^crow
Objective: Research best practices for shared context in multi-agent coding systems.
Context: This project uses Hermes profiles and project-local markdown memory.
Inputs: Read AGENTS.md, PROJECT.md, memory/facts.md.
Expected output: Write concise findings to docs/research.md with source links.
Verification: Include 3-5 actionable recommendations.
Memory updates: Add stable decisions only if user approves or if they are already agreed.
```

```text
^chizul
Objective: Create an install script for the profile fleet.
Context: We use SouthpawIN/sovth-config as the base fleet.
Inputs: Read AGENTS.md, PROJECT.md, tasks/kanban.md.
Expected output: Write scripts/install_fleet.sh. It should clone or update sovth-config and link plugin/profiles.
Verification: Script supports re-running safely.
Memory updates: Add implementation notes to docs/status.md.
```

```text
^klerik
Objective: Review scripts/install_fleet.sh for safety and idempotence.
Context: This script modifies ~/.hermes symlinks and clones public GitHub repos.
Inputs: Read scripts/install_fleet.sh and protocols/delegation.md.
Expected output: Report blockers first, then warnings, then suggested fixes.
Verification: Check shell safety, path quoting, idempotence, and destructive behavior.
Memory updates: If standards change, propose an update to protocols/delegation.md.
```

## Review Gates (Tiered)

### Light
**When:** Low-risk documentation, notes, research summaries, task-board updates.
**Review:** Self-check against `docs/conventions.md`. Explicit user approval is sufficient. No Klerik review required.
**Example:** Crow updating `docs/research.md`, Senter updating `tasks/kanban.md`.

### Standard
**When:** Code, config, scripts, protocol edits, profile instructions, new tools or commands.
**Review:** Klerik review required before the task is marked Done. Report blockers first, then warnings, then suggestions.
**Example:** Chizul editing `scripts/install_fleet.sh`, Anser proposing a new protocol section.

### Strict
**When:** Changes to `~/.hermes` (config, profiles, skills, plugins, cron), credentials, deployment, external systems, destructive commands, gateway configuration, or anything granting broad agent autonomy.
**Review:** Klerik review required **before and after** changes. Must include explicit verification that the change is safe and reversible.
**Example:** Frieza deploying to production, Senter modifying cron jobs, Chizul changing `~/.hermes/config.yaml`.

### Waivers
Only the user can waive a required Klerik review. Waivers must be explicit (a direct message, not implied). AGENTS.md is the authoritative source for review policy.
