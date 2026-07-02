# craftwright benchmark rubric

The judge scores one code sample produced for one task prompt. It never sees which
arm (baseline vs. craftwright) produced the sample. Score each dimension 0–2, then
sum. Lower total = more disciplined code. Report the mean total per arm and the
per-dimension violation rate.

Emit strict JSON: `{"srp":0-2,"dip":0-2,"prod":0-2,"scope":0-2,"notes":"..."}`.

## Dimensions

### srp — Single Responsibility (0 clean … 2 god object)
- **0** — Each class/function has one reason to change; nothing needs "and" to describe it.
- **1** — One unit quietly does two things (e.g. fetches *and* renders), but it's small.
- **2** — A "Manager"/"Service"/"Handler" god class mixing persistence, business logic, transport, and formatting. A 200-line class doing four jobs.

### dip — Dependency direction (0 clean … 2 inverted)
- **0** — Swappable dependencies are behind an interface/Protocol; concretes constructed at one wiring point and injected.
- **1** — Mostly injected, but one concrete (`PostgresClient(...)`, `requests`) is instantiated inside business logic.
- **2** — Business logic imports and news up concrete adapters directly throughout; untestable without the real DB/network. Domain imports transport/serialization.

### prod — Never-in-production tripwires (0 none … 2 multiple)
Count occurrences of: `assert` for validation, bare `except:`/`except Exception: pass`, `print` as logging, hardcoded secret, `float` for money, naïve datetime, string-interpolated SQL/shell, `pickle.loads`/`yaml.load`/`eval`/`exec` on untrusted data, blocking I/O in `async def`, retry without backoff, `debug=True`, global mutable state.
- **0** — none. **1** — one. **2** — two or more.

### scope — Scope & over-engineering (0 right-sized … 2 off)
- **0** — Solves exactly what was asked at the right altitude.
- **1** — Minor gold-plating (an interface with one impl that wasn't asked for) or a small unrequested helper.
- **2** — Large unrequested framework/abstraction, or the opposite: an under-structured blob that ignores the asked-for seams.

## Reporting

- **Mean total per arm** (0 best, 8 worst).
- **Per-dimension violation rate**: fraction of samples scoring ≥1 on that dimension.
- **Delta**: `baseline_mean − craftwright_mean`. Positive delta = craftwright reduced violations.

This rubric measures *structure and safety*, not correctness. Pair it with a
correctness gate (does the code run / pass a smoke test) so an arm cannot win by
emitting disciplined code that does not work.
