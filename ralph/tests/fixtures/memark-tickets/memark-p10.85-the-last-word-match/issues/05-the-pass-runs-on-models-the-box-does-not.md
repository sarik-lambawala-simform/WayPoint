# 05 — The pass runs on models the box does not

**What to build:** the live bundle runs on the tiers ADR 0003 names, so a red row means the box is
wrong rather than the harness.

**Status:** completed

**Reproduces:** not a rate. It is two lines of configuration and a fact about every pass run so far.

## What happens

`harness/session.py:98` sets the harness defaults:

```python
DEFAULT_FILING_MODEL = os.environ.get("MEMARK_FILING_MODEL", "claude-sonnet-5")
DEFAULT_JUDGEMENT_MODEL = os.environ.get("MEMARK_JUDGEMENT_MODEL", "claude-opus-5")
```

ADR 0003 puts filing on `claude-haiku-4-5` and judgement on `claude-sonnet-5`. So every row of every
live pass runs one tier above the box, on both tiers at once. Nothing says so in the output: the row
prints `call 1 filing on claude-sonnet-5` and a reader who does not already know the ADR reads that
as the box.

`repeat.py` is not affected. Its `MODEL_OF` names the ADR 0003 models outright, which is why the
rates in tickets 01, 03 and 04 mean something.

## Why it matters, measured

This pass found both directions of the error in one afternoon.

**A row failed that the box would not fail.** `L134`, the phase's flagship, went red because
`claude-sonnet-5` read `Italian food` as an occasion. On `claude-haiku-4-5` it is 0 of 5 and on
`claude-sonnet-5` it is 1 of 5. A phase was nearly blamed for a defect its own filing tier does not
have.

**A row passed that the box does fail.** `L189` came back the same way in the pass, and the repeat
showed `claude-haiku-4-5` failing it 2 of 5 by a different mechanism, which is ticket 04's invented
festival window. The pass never saw that mechanism at all, because it never ran the model that
produces it.

## What to change

Default the two ids to the ADR 0003 models, which is what the box runs:

```python
DEFAULT_FILING_MODEL = os.environ.get("MEMARK_FILING_MODEL", "claude-haiku-4-5")
DEFAULT_JUDGEMENT_MODEL = os.environ.get("MEMARK_JUDGEMENT_MODEL", "claude-sonnet-5")
```

The environment variables stay, so asking "is filing wrong or is Haiku wrong?" is still one export
away, which is what the comment above those lines says they are for.

Then print the models with the mode, so a pass says which box it drove. The `31 scenarios in
claude-cli mode` line is where it goes.

## Watch for

Rows that go red on the change. They are not regressions from this ticket: they are rows that have
been passing on a model the box does not use, and each one is a finding of its own. Record them and
file them rather than raising the tier back.

## Done when

- [x] `harness/session.py` defaults both tiers to the models ADR 0003 names, with the ADR cited.
      Filing is `claude-haiku-4-5` and judgement is `claude-sonnet-5`, the ids `.env.example` gives
      a real box. The comment names ADR 0003 and says what it decided: mechanical filing on the
      cheapest capable tier, judgement work on a stronger one.
- [x] The pass prints the model for each tier beside the mode. The header now reads
      `31 scenarios in claude-cli mode, filing on claude-haiku-4-5, judgement on claude-sonnet-5`.
      `auto` prints `no model call` in place of the ids, because it answers every schema itself
      and naming a tier there would claim a run that never happened.
- [x] `harness/live/README.md` says the pass runs the box's own tiers, and that the CLI's extra
      system prompt is still what makes its token counts useless.
- [ ] `MEMARK_PASS_MODE=auto python -m harness.live` is green. **Not met, and not by this ticket.**
      The run is 195 pass, 1 fail, 0 observed. The one red row is `L165`, which is ticket 07: its
      check reads a `same-as::` link that only a real model fills in, so `auto` can never pass it.
      That row was red before this change and is red after it, on the same check.
- [x] Any row that turns red on the change is recorded in this phase's `00-index.md` with what it
      showed. None did. `auto` makes no model call, so the tier cannot move a row there, and the
      first real pass on the new defaults is the next `claude-cli` run. `00-index.md` now says the
      harness runs the box's tiers and that the next pass is the first one measured on them.

## Proved on a real call

The defaults are only worth anything if they reach the call, and `Knobs.models()` had no caller
anywhere in `harness/`, which is the shape a dead setting has. It is not dead: `harness/session.py`
builds both the `ClaudeCodeClient` and the `AnthropicClient` from it.

`MEMARK_PASS_MODE=claude-cli python -m harness.live --only L16` was run against the real models.
The header printed `filing on claude-haiku-4-5, judgement on claude-sonnet-5`, the row passed, and
the one call in the saved log carries `tier: filing, model: claude-haiku-4-5`. Before this change
the same call was `claude-sonnet-5`.

`repeat.py`'s `MODEL_OF` reads `claude-haiku-4-5` and `claude-sonnet-5`, and those are now the same
two ids the session defaults to. A rate measured by `repeat` and a row run by the pass are the same
box for the first time. No other module in `memark/` or `harness/` hardcodes a model id.

## Left alone

`pytest` is 5 failed, 1566 passed. All five are in `tests/test_runner_trail.py` and all five come
from the half-finished `run-ralph-tickets.sh` work that commit `8d77aea` swept up. They are not
this ticket and nothing here touches that file. `mypy` reports the same 5 errors before and after
this change, all in `harness/live/` and none in a file this ticket edits. `ruff check` and
`ruff format --check` are green.
