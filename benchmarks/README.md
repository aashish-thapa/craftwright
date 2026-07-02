# craftwright benchmark

Does injecting the craftwright core actually reduce god classes, concrete coupling,
and production tripwires — or does it just feel like it should? This harness measures
it instead of asserting it.

## Design

Two arms, same model, same tasks:

| Arm | System context |
|---|---|
| **baseline** | none |
| **craftwright** | `core.md` injected as a system message (exactly what the SessionStart hook injects at runtime) |

Each task in [`tasks.yaml`](tasks.yaml) is a coding prompt that a rushed agent tends
to answer with one god class. Every generated sample is scored **blind** (the judge
never learns the arm) against [`rubric.md`](rubric.md) across four dimensions —
SRP, dependency direction, production tripwires, scope — each 0 (clean) to 2 (bad).

The metric is the **delta**: `baseline_mean − craftwright_mean`. Positive means
craftwright produced more disciplined code on the same tasks.

## Honest caveats

- This measures **structure and safety**, not correctness. A disciplined sample that
  doesn't run should not win — pair it with a smoke-test gate before trusting a result.
- LLM-graded rubrics are noisy. Run ≥5 samples per task per arm and report the spread,
  not a single number. A 0.1 delta is noise; a 0.8 delta is signal.
- The judge model should differ from the model under test where possible, to avoid a
  model rewarding its own style.
- Results are only comparable within one model + one rubric version. Re-run both arms
  whenever either changes. Commit dated result files under `results/`.

## Running

Wiring lives in `promptfooconfig.yaml` (uses [promptfoo](https://www.promptfoo.dev/)).
It needs your own model API keys and will incur cost — it is not run in CI. See that
file's comments for the exact command.
