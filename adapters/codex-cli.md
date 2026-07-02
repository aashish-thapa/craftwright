# Install craftwright for OpenAI Codex CLI

Codex CLI reads `AGENTS.md` at the project root. Two install paths.

## Option A — append to your project's existing `AGENTS.md`

```bash
curl -sL https://raw.githubusercontent.com/aashish-thapa/craftwright/main/AGENTS.md >> AGENTS.md
```

If your project already has an `AGENTS.md`, this appends craftwright's rules below your existing content. Codex will read both.

## Option B — replace, if you want craftwright to be your only rules

```bash
curl -sL https://raw.githubusercontent.com/aashish-thapa/craftwright/main/AGENTS.md > AGENTS.md
```

## Verify

Start Codex CLI in the project. Ask: "What design principles do you follow when writing new code?" Expected: it should cite SOLID, DRY, composition root, etc. — sourced from craftwright.

## What you get

The full discipline + senior-review content as plain markdown. No frontmatter, no plugin shape — Codex just reads the rules.

## What you don't get

The Claude Code-specific PreToolUse hook that blocks `Co-Authored-By: Claude` commits. For Codex, the equivalent is a git `pre-commit` hook — see [the manual install in the main README](../README.md#manual-install) for the standalone hook script.
