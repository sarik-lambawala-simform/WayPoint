# 18. `L211` asserts the payment is not lost

**Type:** task

**Status:** completed

**Completed at:** 2026-09-25T10:38:06Z

**Blocked by:** none

**What to build:** `L211`'s hard check agrees with the rule the box now has, so a run that files the
payment is green.

Spec: [../spec.md](../spec.md), "`L211`'s own hard check will go red on every real run".

## What happens today

`L211` in `harness/live/scenarios_p10_85_india_wide.py` carries `the dropped claim is crossed out`,
through `_the_dropped_claim_comes_back("gpay")`. It passes only when a reply crosses out a line
holding `gpay` and that Capture kept no `filed::` mark.

Phase 10.9 wrote it when the payment was lost 3 of 5 and the right answer was to hold it. Ticket 13
made the right answer an edit on Ramaben's Card. Ticket 14 measured it written on 10 of 10 runs. A
written payment is never crossed out, so the check is red on exactly the runs the box got right.
It is model-gated, so the free dry run cannot show this.

## What to change

This is phase 10.9's ticket 14 again: a row asserting a rule a later phase replaced. Bring the one
assertion up to date and change nothing else about the row.

The new check passes when **either** holds:

- a line holding `gpay` landed on a Card, or
- a reply crossed out a line holding `gpay` and its Capture kept no `filed::` mark.

It fails when the payment is written nowhere and its Capture drained. That is the loss ADR 0044, a
Capture is drained by coverage and not by writes alone, exists to stop. Which of the two good
outcomes happened is the model's choice, and `L211:where` in `harness/live/repeat.py` measures it.

- The check goes in `harness/live/checks.py` and is wrapped in `only_when_a_model_answered`.
- `L211`'s message, fixture and everything else stay.
- The comment at `L211` names phase 10.96's ticket 13 as the decision that replaced the old rule.
- `L223` keeps `a_dropped_claim_is_crossed_out("mixer")`. Nothing here changed what the mixer errand
  should get.

## Done when

- [ ] `L211` carries the new check and no other change.
- [ ] `L223` is untouched.
- [ ] The comment names ticket 13.
- [ ] `MEMARK_PASS_MODE=auto python -m harness.live` is green.
- [ ] It commits.
