<p align="center">
  <img src="docs/avatar.png" width="180" height="180" alt="craftwright — illustrated developer at a laptop, framed as a circular avatar" />
</p>

<h1 align="center">craftwright</h1>

<p align="center">
  <em>Senior-engineer discipline for any AI coding agent. SOLID, DRY, separation of concerns, and a strict on-demand PR reviewer.</em>
</p>

<p align="center">
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-yellow.svg" alt="License: MIT" /></a>
  <a href="https://agents.md"><img src="https://img.shields.io/badge/AGENTS.md-compatible-0ea5e9" alt="AGENTS.md compatible" /></a>
  <a href="#install"><img src="https://img.shields.io/badge/discipline-skill%20%2B%20review%20agent-2ea44f" alt="discipline skill + review agent" /></a>
  <a href="#install"><img src="https://img.shields.io/badge/tool--agnostic-yes-8A2BE2" alt="Tool-agnostic" /></a>
</p>

---

Modern AI coding agents produce code that compiles, passes tests, and ships. A senior engineer reading the diff sees five principles violated, a `switch` statement that should be polymorphism, and a class doing four things wearing one name.

**craftwright** is the opposite of "vibe coding." A discipline skill and a fresh-context review agent, shipped as plain markdown that any AI coding agent can read:

- A **discipline skill** that teaches your agent 16 system design principles (SOLID, DRY, separation of concerns, composition root, illegal-states-unrepresentable, ...) plus a code-discipline rulebook for commits, comments, scope, and verification.
- A **senior-review agent** that channels the strict, abstraction-loving reviewer who used to send your PRs back four times — the one who reduced your 100-line function to a 10-line one and wrote the rewrite inline. It runs as a *fresh context* that sees only your diff, never the conversation that produced it — so it reviews your code, not its own reasoning. Now you get him on demand.

A "wright" is a craftsperson: millwright, playwright, shipwright. **craftwright** is what your AI becomes when you install this.

## Why this exists

With AI assistants writing more of the code now and no one watching the diff with that level of scrutiny, the bar quietly slips. The patterns flagged constantly. The packages reached for instead of reinvented. The architecture refused to be let slide. If you've worked with a reviewer like that, you'll recognize it. If you haven't, this is what it sounds like.

## Install

One source of truth, every tool.

| Your AI tool | Install | Notes |
|---|---|---|
| **Claude Code** | `/plugin marketplace add aashish-thapa/craftwright`<br>`/plugin install craftwright@craftwright` | Full: discipline skill + review agent + re-injection & commit hooks |
| **OpenAI Codex CLI** | `curl -sL https://raw.githubusercontent.com/aashish-thapa/craftwright/main/AGENTS.md >> AGENTS.md` | [details](adapters/codex-cli.md) |
| **Cursor** | `curl -sL .../AGENTS.md > AGENTS.md` | [details](adapters/cursor.md) — reads AGENTS.md natively |
| **Aider** | `curl -sL .../AGENTS.md > CONVENTIONS.md` | [details](adapters/aider.md) |
| **GitHub Copilot** | `curl -sL .../AGENTS.md > .github/copilot-instructions.md` | [details](adapters/copilot.md) |
| **Google Antigravity** | `curl -sL .../AGENTS.md > .agents/rules/craftwright.md` | [details](adapters/antigravity.md) |
| **Anything reading `AGENTS.md`** (Windsurf, Devin, Zed, JetBrains Junie, Amp, ...) | `curl -sL .../AGENTS.md >> AGENTS.md` | 28+ tools support the standard |
| **Gemini CLI** | `curl -sL https://raw.githubusercontent.com/aashish-thapa/craftwright/main/GEMINI.md > GEMINI.md` | Gemini's native file |

The full markdown content is mirrored to `AGENTS.md`, `CLAUDE.md`, and `GEMINI.md` at the repo root — pick whichever filename your tool prefers.

## What changes about your AI's code

**Before** — your agent writes the obvious thing:

```python
def area(shape):
    if shape.kind == "circle":   return 3.14 * shape.r ** 2
    elif shape.kind == "square": return shape.side ** 2
    elif shape.kind == "tri":    return 0.5 * shape.base * shape.height
```

**After** — your agent reaches for the seam first:

```python
class Shape(Protocol):
    def area(self) -> float: ...

class Circle:
    def __init__(self, r): self.r = r
    def area(self): return 3.14 * self.r ** 2

class Square:
    def __init__(self, side): self.side = side
    def area(self): return self.side ** 2
```

Same behavior. The first edits its own dispatching switch every time a shape is added; the second satisfies §Open/Closed and never touches existing code again. craftwright teaches the difference — and tells your agent *which principle* applies — in language any LLM-driven tool internalizes.

Same shift happens in:

| Anti-pattern | craftwright pushes toward |
|---|---|
| `OrderService` calling `PostgresClient(host=...)` directly | A `Protocol` for the store, concrete wired in a composition root |
| `_gst_audio.py`, `_pil_color.py`, `_image_ops.py` piled in `pipeline/` | Domain-grouped packages: `gst/`, `image/`, `video/` |
| `account.balance = -50_000` mutable from outside | Encapsulated `withdraw()` that enforces the invariant |
| `if order is None or not hasattr(order, "items") or ...` | Validate once at the boundary, then trust the type inside |
| Five commits referencing PR #123, "per review feedback", "addressed comments" | `fix(user): reject empty email at registration boundary` |

## What's inside

### 1. The discipline skill (`skills/discipline/SKILL.md`)

~800 lines of opinionated principles. Each principle gets a definition, a *why*, concrete heuristics, a tiny anti-example, a corrected example, and cross-links to related principles.

**Part I — 16 system design principles:**

| | Principle |
|---|---|
| §SRP | Single Responsibility |
| §OCP | Open/Closed |
| §LSP | Liskov Substitution |
| §ISP | Interface Segregation |
| §DIP | Dependency Inversion |
| §DRY | Don't Repeat Yourself (knowledge, not text) |
| §SoC | Separation of Concerns |
| §CoI | Composition over Inheritance |
| §HCLC | High Cohesion, Low Coupling |
| §Enc | Encapsulation / Information Hiding |
| §TDA | Tell, Don't Ask / Law of Demeter |
| §CR | Composition Root pattern |
| §DDO | Domain-Driven Module Organization |
| §MISU | Make Illegal States Unrepresentable |
| §VAB | Validate at boundaries, trust inside |
| §SDP | Stable Dependencies Principle |

**Part II — code-discipline practices:**

- **Commits** — one concern per commit, `type(scope): subject`, no AI-attribution footers, no PR-number references
- **Comments and docstrings** — default to none; only the *why* gets a comment, never the history
- **Naming as documentation** — full words, booleans read as questions, verbs for actions
- **Verify external-tool config from source** — no knobs from memory; check the pinned version
- **Research prior art before designing** — search the engineering community first; don't reinvent named patterns
- **Stay within scope** — refactors require explicit user buy-in
- **Read before writing** — read the file, run the test, check the version
- **Risky actions require confirmation** — force-push, hard reset, dropping tables, sending external messages

### 2. The senior-review agent (`agents/review.md`)

Dispatched to a **fresh-context subagent** when you ask for a code review, PR review, or "what would a senior engineer say about this." That freshness is the point: the reviewer never saw the conversation that wrote the code, so it can't rationalize the author's choices — it sees only the diff (plus the discipline core, injected by the SubagentStart hook). Channels a specific reviewer profile — strict, abstraction-loving, terse, allergic to reinvention. Read-only: it reviews, it doesn't edit.

**What it does:**

- Reads the full diff before commenting. Identifies the 1–3 *architectural* issues. Leads with those.
- Writes the rewrite inline as a code block when a 100-line function should be 10 lines.
- Names the stdlib helper or package the code is reinventing — `functools.partialmethod`, `anyio.create_memory_object_stream`, `pydantic_settings.BaseSettings`, `enum.StrEnum`, `__init_subclass__` registries, `pytest-freezegun`, `uvloop`.
- Flags missing jitter/backoff anywhere there's a retry loop — *thundering herd*.
- Calls out concrete dependencies in abstract classes, Protocols with private methods, ABCs that don't inherit `abc.ABC`.
- Distinguishes throttle vs debounce vs rate-limit precisely. Names them correctly.
- Delegates trivial nits to coderabbit and tests. Approves with caveats: `lgtm, fix coderabbit and tests`. Doesn't waste round trips.

**Sample interaction:**

> **You:** Review this PR for me — branch `feat/systemd-watcher`, 600 lines added.
>
> **craftwright:review:**
>
> Substantive issues:
>
> 1. `SystemdWatcher` is managing N units. Should manage one. Instantiate many at the call site.
> 2. Health check pulls state from `SystemdWatcher` — invert it. The check should source its own state. Watcher stays generic.
> 3. `_health_check_dispatcher` defined as a private method on `HealthCheckProtocol` — protocols define public contracts only.
>
> Inline:
>
> - `service.py:117` — `is_active()` + `is_running()` are 2 dbus round-trips per call. Short-lived cache.
> - `service.py:165` — three methods (`start`, `stop`, `reload`) collapse to `functools.partialmethod` over one parameterized `transition_unit(action, name)`.
> - `service.py:79` — strict on `*.service`. Not all units are. State this is intentional or accept the suffix.
> - `bus.py:23` — shadowing builtin `id`.
> - `checks/systemd.py:97` — multiple check instances, separate inflight events that don't cross. Failures not handled.
>
> CHANGES_REQUESTED. Address watcher single-responsibility first, then the dbus caching, then coderabbit.

The agent includes a cross-reference table — when the review surfaces a violation, it names the principle from the discipline skill so the author can study it. `Concrete in field declaration → §DIP`. `Class doing four things → §SRP`. `Switch on type → §OCP`.

**Invoke it** (Claude Code) by asking for a review — "review this PR", "review these changes", "would this pass review" — and Claude dispatches to the `senior-reviewer` agent; or pick it directly from the `/agents` menu. Other tools without a subagent mechanism read the same reviewer standard inline from `AGENTS.md` and review in-context.

## Bonus: `Co-Authored-By: Claude` is not a thing

You wrote the prompt. You reviewed the diff. You're the one who'll be on call when it breaks at 2am. Your AI assistant isn't your co-author and your `git log` doesn't need a sponsor.

Quietly bundled with the **Claude Code plugin**: a `PreToolUse` hook on `Bash` that denies any `git commit` whose message contains `Co-Authored-By: Claude`, `Generated with Claude Code`, or `🤖 Generated with`. Caught before the commit runs, including inside compound commands like `git add . && git commit -m "..."`. Your AI gets the rejection reason back and retries with a clean message. You never see the footer.

For belt-and-suspenders prevention in Claude Code, also drop these into `~/.claude/settings.json`:

```json
{
  "attribution": { "commit": "", "pr": "" },
  "includeCoAuthoredBy": false
}
```

For other tools, the equivalent is a git `pre-commit` hook — copy `hooks/block-ai-attribution-commits.sh` and adapt the input parsing (it currently reads Claude Code's stdin JSON format).

## Stated isn't enforced

A rule written once in an 800-line skill decays. As a session fills with context, the agent drifts back to god classes and concrete coupling — the discipline was *stated*, never *held*. craftwright closes that gap from two sides.

### The always-on core (fights drift)

[`core.md`](core.md) is the compressed spine — the whole discipline distilled to a page you could keep in your head. The Claude Code plugin re-injects it through `hooks/inject-core.sh` at the moments context is fresh or has just been summarized away:

| Hook event | What's injected | Why |
|---|---|---|
| **SessionStart** (`startup`, `resume`, `clear`, **`compact`**) | full core | the `compact` reload is the key one — the rules come *back* the instant compaction would have dropped them |
| **SubagentStart** | full core | discipline survives fan-out; spawned agents inherit it |
| **UserPromptSubmit** | one-line structure-check digest (derived from `core.md`, so it can't drift) | cheap per-turn re-anchor without re-paying the whole core |

The result: "depend on abstractions, one reason to change, no tripwires" is in front of the model at message 80, not just message 1.

### The enforcement layer (makes bad patterns fail)

Reminder-only rulesets tell the agent not to write `pickle.loads`. craftwright can make the commit **fail**. [`configs/`](configs/) ships copyable, source-verified configs that turn the mechanically-checkable rules into gates:

- **ruff** — the §Never-in-production tripwires (`assert`-for-validation, bare `except`, `print`, `pickle`/`eval`, `shell=True`, naïve datetime, blocking I/O in async, ...).
- **import-linter** — §DIP / §Separation of Concerns as failing CI: the domain layer *cannot* import web/adapters.
- **gitleaks** — hardcoded secrets. **shellcheck** — the shell craftwright itself ships (it dogfoods its own rules).

The configs are honest about the ceiling: `float`-for-money and god-class *intent* aren't lintable — those stay the job of the injected core and the review agent. See [`configs/README.md`](configs/README.md) for the full rule → check map.

### Does it actually work? ([`benchmarks/`](benchmarks/))

craftwright measures its own claim instead of asserting it: a [promptfoo](https://www.promptfoo.dev/) harness runs the same coding tasks with and without the core injected, and an LLM judge scores each result blind for SOLID violations and god classes. Two arms, one delta. Bring your own API keys — it's not run in CI.

## Why this and not one of the 425 other Claude / Codex / Cursor plugins

craftwright is **a stance, not a library**.

The trending AI-coding repos in 2026 are curated collections — 1000+ skills, 425 plugins, 135 agents bundled into "ultimate toolkits." They're encyclopedias. You install them to *have options*.

craftwright is the opposite: two skills with a single editorial point of view about what good code looks like. If you disagree with the take — composition over inheritance, Protocol-first DI, async-context-managers over `set_x()` + `set_y()`, no defensive null-checks inside the system — you won't enjoy it. If you agree, installing it is faster than convincing your AI of any one of these principles from scratch in every new session.

## Repository layout

```
craftwright/
├── skills/                          ← discipline skill (always-on, in-context)
│   └── discipline/SKILL.md
├── agents/                          ← fresh-context subagents
│   └── review.md                    ← senior-reviewer; canonical review source
├── core.md                          ← compressed spine, re-injected to fight drift
├── hooks/                           ← Claude Code hooks
│   ├── hooks.json                   ← SessionStart/SubagentStart/UserPromptSubmit + PreToolUse
│   ├── inject-core.sh               ← re-injects core.md (incl. after compaction)
│   └── block-ai-attribution-commits.sh
├── configs/                         ← copyable enforcement configs (ruff, import-linter, gitleaks)
│   ├── README.md                    ← rule → check map
│   ├── pyproject.ruff.toml
│   ├── importlinter.example.toml
│   └── pre-commit-config.example.yaml
├── benchmarks/                      ← promptfoo harness: does the core reduce god classes?
│   ├── README.md
│   ├── promptfooconfig.yaml
│   ├── rubric.md
│   └── tasks.yaml
├── AGENTS.md                        ← generated cross-tool entry (Codex, Cursor, Aider, ...)
├── CLAUDE.md                        ← copy for Claude Code's native entry
├── GEMINI.md                        ← copy for Gemini CLI's native entry
├── .claude-plugin/                  ← Claude Code plugin + marketplace manifests
│   ├── plugin.json
│   └── marketplace.json
├── adapters/                        ← per-tool install guides
│   ├── codex-cli.md
│   ├── cursor.md
│   ├── aider.md
│   ├── copilot.md
│   └── antigravity.md
├── scripts/sync.sh                  ← regenerates AGENTS.md / CLAUDE.md / GEMINI.md from skills/
└── docs/avatar.png
```

## Contributing

PRs and issues welcome. The skills stay **tight and scannable** — additions should:

- Be language-agnostic (Python or pseudo-code that reads to TS, Go, Rust readers).
- Include a concrete anti-example AND a corrected version (5–15 lines each).
- Cross-link related principles inline (`see also: §...`).
- Avoid project-specific references, framework lock-in, and meta-skill content.

**When editing `skills/discipline/SKILL.md` or `agents/review.md`**, run `./scripts/sync.sh` to regenerate the cross-tool entry files (`AGENTS.md`, `CLAUDE.md`, `GEMINI.md`).

If proposing a new principle, check whether it's already covered under a different name — there's real overlap between Single Responsibility, Separation of Concerns, and Cohesion/Coupling, and the skill resolves the overlap through cross-links rather than restating the same idea three times.

## License

MIT. See [LICENSE](LICENSE).
