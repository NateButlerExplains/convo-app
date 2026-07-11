#!/usr/bin/env bash
set -euo pipefail

SESSION_NAME="${1:-bigtrip}"
PROJECT_ROOT="${PROJECT_ROOT:-/Users/nateb/agent-projects/barcelona-relocation-dashboard}"
APP_ROOT="$PROJECT_ROOT/app"

if ! command -v tmux >/dev/null 2>&1; then
  echo "tmux is not installed. Run: brew install tmux"
  exit 1
fi

if tmux has-session -t "$SESSION_NAME" 2>/dev/null; then
  echo "tmux session '$SESSION_NAME' already exists. Attach with: tmux attach -t $SESSION_NAME"
  exit 0
fi

start_live_pane() {
  local target="$1"
  local title="$2"
  local command_body="$3"

  tmux send-keys -t "$target" "bash -lc $(printf '%q' "cd '$PROJECT_ROOT' && clear && while true; do clear; printf '%s\n' '$title'; printf 'Updated: %s\n\n' \"\$(date '+%Y-%m-%d %H:%M:%S')\"; $command_body; sleep 10; done")" C-m
}

# Single board window: the default workflow lives here.
tmux new-session -d -s "$SESSION_NAME" -n board -c "$PROJECT_ROOT"
tmux split-window -h -t "$SESSION_NAME":board -c "$PROJECT_ROOT"
tmux split-window -v -t "$SESSION_NAME":board.1 -c "$PROJECT_ROOT"
tmux split-window -v -t "$SESSION_NAME":board.2 -c "$PROJECT_ROOT"
tmux select-layout -t "$SESSION_NAME":board main-vertical

tmux resize-pane -t "$SESSION_NAME":board.0 -x 120

# Pane 0: operator lane
# Pane 1: live task board
# Pane 2: live status + decisions
# Pane 3: live memory + facts
start_live_pane "$SESSION_NAME":board.0 "POSEIDON LANE" "printf 'tmux control board\n\nUse the panes on the right for live project state.\n'"
start_live_pane "$SESSION_NAME":board.1 "TASKS LANE" "printf 'tasks/kanban.md\n\n'; sed -n '1,120p' tasks/kanban.md"
start_live_pane "$SESSION_NAME":board.2 "STATUS LANE" "printf 'docs/status.md\n\n'; sed -n '1,120p' docs/status.md; printf '\n\nmemory/decisions.md\n\n'; sed -n '1,120p' memory/decisions.md"
start_live_pane "$SESSION_NAME":board.3 "MEMORY LANE" "printf 'memory/facts.md\n\n'; sed -n '1,120p' memory/facts.md; printf '\n\nRecent updates\n\n'; find memory docs tasks -maxdepth 1 -type f | sort"

tmux select-window -t "$SESSION_NAME":board

echo "Created tmux workflow session '$SESSION_NAME'."
echo "Attach with: tmux attach -t $SESSION_NAME"
echo "Detach with: Ctrl-b then d"
