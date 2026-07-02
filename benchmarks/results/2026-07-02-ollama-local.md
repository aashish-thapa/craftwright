# 2026-07-02 — local ollama run (inconclusive, underpowered)

First end-to-end run of the harness. Recorded for method, **not** as evidence that
craftwright works — the sample is far too small to claim an effect.

## Setup

- **Harness:** promptfoo 0.118.0 (pinned down from 0.121.17 for node <22.22; identical schema).
- **Hardware:** 16-core CPU, **no GPU**. qwen2.5:7b measured at ~9 tok/s.
- **Models under test:** `qwen2.5:7b`, `llama3.2:3b` (local ollama).
- **Judge:** `qwen2.5:7b` (self-bias when grading its own output — see caveats).
- **Tasks:** 6 (see `tasks.yaml`). **Arms:** baseline vs. `core.md` injected.
- **Assertion:** binary `llm-rubric` PASS/FAIL (disciplined vs. not).
- **Duration:** 18m 32s (concurrency 4). 24 generations + 24 gradings.

## Result

| Arm | llama3.2:3b | qwen2.5:7b | Total |
|---|---|---|---|
| baseline | 1/6 | 1/6 | 2/12 (17%) |
| craftwright | 2/6 | 1/6 | 3/12 (25%) |

Delta: **+1 sample.** Within noise. **Verdict: inconclusive.**

## Why the signal is weak (and how to get a real one)

1. **n=6 per cell.** Need ≥30 samples/arm before a delta means anything.
2. **Binary judge.** The PASS/FAIL rubric discards the 0–2-per-dimension detail in
   `rubric.md`. Switch the assertion to a graded score to see partial movement.
3. **Weak models on both ends.** 3B/7B may neither reliably follow injected
   discipline nor reliably produce god classes — the effect has little room to show.
   A stronger judge (hosted, via API key) would cut grading noise most.
4. **Self-bias.** qwen judging qwen. The llama-under-test rows judged by qwen are
   the cleaner comparison; even so, one judge is not enough.

## Takeaway

The rig works: keyless, reproducible, per-arm numbers. To turn it into evidence,
raise sample count, use the graded rubric, and grade with a stronger model. Until
then craftwright's value rests on the principles, not on a measured delta — and this
file says so on purpose.
