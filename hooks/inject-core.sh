#!/usr/bin/env bash
# craftwright: re-inject the compressed discipline core so it survives context
# pressure and compaction. Full core at SessionStart / SubagentStart (fresh or
# summarized context); a lean digest at UserPromptSubmit to re-anchor each turn
# without re-paying the whole core every time.
set -euo pipefail

CORE="$(dirname "$0")/../core.md"
[ -r "$CORE" ] || exit 0

input=$(cat)
event=$(printf '%s' "$input" | jq -r '.hook_event_name // ""')

emit_full() {
  # SessionStart and SubagentStart both accept the hookSpecificOutput form;
  # SubagentStart *requires* it (raw stdout is dropped for spawned subagents).
  jq -n --rawfile ctx "$CORE" --arg ev "$event" \
    '{hookSpecificOutput:{hookEventName:$ev, additionalContext:$ctx}}'
}

case "$event" in
  SessionStart|SubagentStart)
    emit_full
    ;;
  UserPromptSubmit)
    # Raw stdout is added to context. Digest = the structure-check headlines,
    # derived from core.md so there is no second copy to drift.
    {
      echo "craftwright active — structure check before you write:"
      sed -n 's/^\([0-9]\.\) \(\*\*[^*]*\*\*\).*/\1 \2/p' "$CORE"
      echo "Reject-on-sight tripwires and full rules: see core.md / the discipline skill."
    }
    ;;
  *)
    exit 0
    ;;
esac
