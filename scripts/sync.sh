#!/usr/bin/env bash
# craftwright: regenerate AGENTS.md / CLAUDE.md / GEMINI.md from the canonical
# sources — skills/discipline/SKILL.md and agents/review.md. Run after editing
# either so the cross-tool entry files stay in sync.
set -euo pipefail

cd "$(dirname "$0")/.."

OUT="AGENTS.md"

strip_frontmatter() {
  # Drop the leading YAML frontmatter block (--- … ---) and one trailing blank line.
  awk 'BEGIN{fm=0} /^---$/ && fm<2 {fm++; next} fm==2 || fm==0 {print}' "$1"
}

{
  cat <<'EOF'
# craftwright

> Senior-engineer discipline for any AI coding agent — SOLID, DRY, separation of concerns, and a strict on-demand PR reviewer.

This file is the cross-tool entry point. It contains the same content as the Claude Code skills shipped in `skills/`, concatenated and stripped of plugin-specific frontmatter. Any tool that reads `AGENTS.md` (Codex CLI, Cursor, Aider, Copilot, Windsurf, Devin, Zed, JetBrains Junie, Amp, ...) picks up these rules automatically.

For Claude Code's richer plugin install (skills + the commit-attribution hook), see the [README](README.md).

---

EOF

  for skill_md in skills/discipline/SKILL.md agents/review.md; do
    strip_frontmatter "$skill_md"
    echo
    echo "---"
    echo
  done
} > "$OUT"

# Trailing `---\n\n` from the last skill is dropped for cleanliness.
# (Two-line trim using head — works on both GNU and BSD.)
head -n -3 "$OUT" > "$OUT.tmp" && mv "$OUT.tmp" "$OUT"

# CLAUDE.md and GEMINI.md are exact copies — Claude Code and Gemini CLI prefer
# their own filenames as the project-level entry point.
cp "$OUT" CLAUDE.md
cp "$OUT" GEMINI.md

echo "wrote: AGENTS.md CLAUDE.md GEMINI.md ($(wc -l < AGENTS.md) lines)"
