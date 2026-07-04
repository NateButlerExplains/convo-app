# Memory Protocol

This project uses layered memory so agents can keep their own identities while sharing project truth.

## Memory Layers

### 1. Profile Memory
Use profile memory for:
- Role-specific lessons.
- Agent personality and operating preferences.
- Tool quirks learned by that profile.
- Stable user preferences relevant to that profile.

Do not use profile memory for task state that other agents need.

### 2. Shared Project Memory
Use project files for:
- Decisions: `memory/decisions.md`.
- Stable facts and conventions: `memory/facts.md`.
- Task state: `tasks/kanban.md`.
- Current status: `docs/status.md`.
- Research synthesis: `docs/research.md`.

Shared project memory should be concise, durable, and easy for another profile to read quickly.

### 3. Session History
Use Hermes session history for:
- Recovering prior discussions.
- Reconstructing why a change happened.
- Finding previous commands, outputs, or user preferences.

Session history is not the source of truth. If something matters, summarize it into project files.

## What To Record
Record:
- Architecture decisions.
- Chosen tools and rejected alternatives.
- Environment facts that affect setup.
- User preferences that affect recurring work.
- Handoff summaries after significant tasks.
- Review outcomes and unresolved risks.

Do not record:
- Temporary thoughts.
- Every command output.
- Large raw logs.
- Secrets, tokens, credentials, or private keys.
- Facts that can be trivially rediscovered and do not affect future work.

## Update Rules
- Update `tasks/kanban.md` whenever task state changes.
- Update `docs/status.md` after substantial progress or blockers.
- Update `memory/decisions.md` only for real decisions with lasting impact.
- Update `memory/facts.md` for stable environment or project conventions.
- Ask Klerik to review protocol changes that increase agent autonomy.

## Kashik Consolidation Prompt
Use this after major work:

```text
^kashik
Objective: Consolidate project memory after the latest work.
Context: The project uses markdown files as shared memory.
Inputs: Read AGENTS.md, PROJECT.md, tasks/kanban.md, docs/status.md, memory/decisions.md, memory/facts.md.
Expected output: Update docs/status.md with a concise handoff and propose any additions to memory/decisions.md or memory/facts.md.
Verification: Do not duplicate existing entries. Keep durable memory short. Run the compaction checklist below.
Memory updates: Write directly to project files if appropriate.
```

## Compaction Checklist
Every Kashik consolidation pass must include lightweight compaction:

1. **Remove duplicates.** If the same fact appears in multiple files, keep it in the most appropriate one and remove the rest.
2. **Mark stale entries.** Decisions superseded by later ones, facts that no longer apply, status entries for completed work — move these to an `## Archive` section at the bottom of the file (never delete — markdown is git-diffable and deletions lose institutional knowledge).
3. **Keep only durable content.** Remove transient task state, raw logs, command output, and temporary notes that don't affect future work.
4. **Report what changed.** The consolidation output should list what was compacted so the orchestrator knows what was pruned.

Kashik should apply compaction on every consolidation pass, not just on explicit request.
