# craftwright enforcement configs

Reminder-only rulesets tell the agent not to write `pickle.loads`. craftwright can
make the commit **fail**. These are copyable, source-verified configs that move
craftwright rules out of "hope the model remembers" and into deterministic gates.

They're Python-oriented because craftwright's §Never-in-production examples are —
but the principle is universal; port the same tripwires to your stack's linters.

## What maps to a machine check

| craftwright rule | Enforcer | File |
|---|---|---|
| `assert` for validation, bare `except:`, `except Exception: pass`, `print`, `pickle`/`eval`/`yaml.load`, `shell=True`/`os.system`, string-SQL, naïve datetime, blocking I/O in async, `debug`-ish jinja | **ruff 0.15.20** (`S`, `T20`, `DTZ`, `ASYNC`, `BLE`, `E722`) | [`pyproject.ruff.toml`](pyproject.ruff.toml) |
| hardcoded secrets | **gitleaks v8.30.1** | [`pre-commit-config.example.yaml`](pre-commit-config.example.yaml) |
| §DIP / §SoC / §Stable Dependencies — dependency direction (domain ⊄ web/adapters) | **import-linter 2.12** | [`importlinter.example.toml`](importlinter.example.toml) |
| shell craftwright ships | **shellcheck 0.11.0** | pre-commit config |
| Trojan-source, `torch.load`, HF unsafe download (ML repos) | **bandit 1.9.4** (opt-in) | pre-commit config comment |

## What stays a judgment call

Be honest about the ceiling — two things can't be linted, and the SOLID *intent*
rules never will be:

- **`float` for money** — no ruff/bandit rule exists. Enforce via `Decimal`/minor
  units in review and typing.
- **"untrusted" input to `eval`/`pickle`/`yaml`** — the linter flags the *call*, but
  can't prove the argument is attacker-controlled. Expect a curated allowlist.
- **God classes, earned abstractions, "one reason to change"** — file-length and
  complexity thresholds (ruff `C901`, `PLR` family) are a *tripwire* that flags
  candidates, not a judge. These are what the `review` skill and the injected core
  are for. The linter catches the mechanical 80%; the discipline catches the rest.

## Adopt

1. Merge [`pyproject.ruff.toml`](pyproject.ruff.toml)'s `[tool.ruff.lint]` block into your `pyproject.toml`.
2. Add the [`importlinter.example.toml`](importlinter.example.toml) contracts, renaming `myapp` and your layers.
3. Copy the stanzas you want from [`pre-commit-config.example.yaml`](pre-commit-config.example.yaml), then `pre-commit install`.
4. Re-verify every pin before publishing — ruff, gitleaks, and promptfoo move fast (§Verify external-tool config from source).
