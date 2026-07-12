# Agent Operating Context

This file is the shared instruction layer for every agent working in this project.

## Project Goal
Build and operate a multi-agent, multi-profile Hermes fleet with shared project context, durable memory, and agent-to-agent delegation.

## Agent Routing
- Senter owns intake, triage, routing, and task board updates.
- Anser turns vague goals into structured plans and user-facing explanations.
- Crow researches external sources and writes concise findings.
- Chizul implements code, config, scripts, and file changes.
- Klerik reviews output, checks quality, and blocks unsafe or incomplete work.
- Kashik maintains project memory, status summaries, and institutional knowledge.
- Nous-girl brainstorms concepts, names, interfaces, creative direction, and alternate approaches.
- Frieza handles infra, deployment, containers, services, and automation.

## Shared Files
- `PROJECT.md`: high-level project description and current mission.
- `tasks/kanban.md`: source of truth for task state.
- `memory/decisions.md`: durable decisions and rationale.
- `memory/facts.md`: stable project facts, environment facts, and conventions.
- `docs/research.md`: research summaries and source links.
- `docs/conventions.md`: cross-agent naming, ownership, and workflow conventions.
- `docs/status.md`: current project status and handoff summary.
- `protocols/delegation.md`: rules for invoking other agents.
- `protocols/memory.md`: rules for what goes in profile memory vs project memory.

## Rules For All Agents
- Read `PROJECT.md`, `tasks/kanban.md`, and relevant protocol files before doing substantial work.
- Write durable shared knowledge to project files, not just chat memory.
- Keep task board changes small and explicit.
- Do not overwrite another agent's work without reviewing it first.
- Prefer handoffs with clear objective, context, expected output, and verification criteria.
- Klerik review is mandatory for: code, config, scripts, profile instructions, protocol changes, deployment, cron, credentials, and anything modifying ~/.hermes or external systems. Klerik review may be waived only by explicit user approval for low-risk docs, notes, research summaries, and task-board updates.
- Kashik should summarize major milestones into `docs/status.md` and `memory/decisions.md`.

## Done Definition
A task is done only when:
- The requested work exists in files or verified external state.
- Klerik has reviewed it (mandatory for code, config, scripts, protocols, deployment, cron, credentials, ~/.hermes modifications, and external system changes; waivable by explicit user approval for low-risk docs, notes, research, and task-board updates).
- `tasks/kanban.md` is updated.
- Important decisions are captured in `memory/decisions.md`.
