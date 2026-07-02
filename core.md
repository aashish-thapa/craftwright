# craftwright — active discipline

CRAFTWRIGHT ACTIVE. This holds every response, not just the first — no drift back
to god classes and concrete coupling as context fills. Still active if unsure.
This is the compressed spine; the full rules live in the `discipline` and `review`
skills — reach for them when a decision needs the depth.

## Before you write — structure check

1. **One reason to change.** Name the unit's job in one sentence. Need "and"? Split it. A 300-line class doing five things is five classes wearing one name. (SRP)
2. **Depend on abstractions.** Every field/param/return that names a swappable dependency is a Protocol/interface, not a concrete class. Concretes appear only at the composition root. (DIP)
3. **New behavior = new code, not edited switch.** Editing the same `if/elif/switch` on every feature means you missed a polymorphism seam. (OCP)
4. **One home per fact.** A constant, rule, or shape has one authoritative representation. Duplicated *knowledge* drifts — duplicated *text* that changes for different reasons does not. (DRY)
5. **Concerns stay separated.** Domain knows nothing of HTTP/SQL/files. Adapters translate; they hold no business rules. Volatile depends on stable, never the reverse. (SoC)
6. **Illegal states unrepresentable.** Encode invariants in types and constructors, not comments. Parse at the boundary into a type that proves the invariant; trust it inside.

## Reject on sight — never in production

`assert` for validation (`-O` strips it — raise the exception) · bare `except:` / `except Exception: pass` · `print`/`console.log` as logging · hardcoded secrets · `float` for money (use `Decimal`/minor units) · naïve datetime (`datetime.now()`/`utcnow()` without tz) · string-interpolated SQL/shell, `shell=True`, `os.system` · `pickle.loads`/`yaml.load`/`eval`/`exec` on untrusted input · blocking I/O in `async def` · fire-and-forget tasks · retry without backoff+jitter+cap · `debug=True` · global mutable state · commented-out code (delete it).

## Naming & comments

Names carry the meaning — full words, booleans as questions (`is_ready`). If a comment explains *what* the code does, rename instead. Comment only the non-obvious *why*. No task/PR/history references in code or docstrings.

## Process

- **Read before writing.** Read the file, run the failing test, check the pinned version — don't act on a guess.
- **Verify external knobs from source.** No lint codes, flags, or config keys from memory.
- **Research prior art** for design-shaped problems before proposing; bring ≥2 approaches.
- **Stay in scope.** Small task → small change. Refactors need buy-in first. Adjacent issues → mention at the end.
- **Commits:** one concern, `type(scope): subject`, no AI-attribution footer, no PR-number references.
- **Risky/irreversible actions** (force push, hard reset, DB drops, external sends) → confirm first.
