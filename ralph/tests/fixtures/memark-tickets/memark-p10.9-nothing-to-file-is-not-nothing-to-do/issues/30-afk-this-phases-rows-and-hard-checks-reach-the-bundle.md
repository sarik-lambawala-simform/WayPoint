# 30 — AFK: this phase's scenarios and hard checks reach the bundle

**Type:** task

**Status:** completed

**Completed at:** 2026-09-18T20:19:11Z

**Blocked by:** 21, 22, 23, 25, 26, 27, 29

**What to build:** the live bundle carries this phase's rows and hard checks, and the dry run proves
the wiring before a real call is made.

## The hard checks this phase owes

- `L211` and `L223` each end with their Capture holding no `filed::` mark, and the dropped claim
  visible as `❌` in the reply.
- A row that files cleanly today still drains. This is the check that catches a rule holding
  everything back and it matters as much as the two above.
- `L242` ends with `From: no line of your notes I can name.`
- `L226` still cites the Khushbu peanut line. **This is the important one.** It is the guard that
  stops a later session fixing the badminton reply by banning volunteering outright.
- `L239` reaches Recall and its answer names the dated line on 27 August.

## The bundle accumulates and earlier rows are not edited to pass

`harness/live/` holds every earlier phase's scenarios and they are the regression coverage. No
earlier row is edited to make this phase pass. Where a row asserts a rule this phase replaces, it is
rewritten to assert the rule the box now has and its module cites the decision. That is ticket 14's
rule and ticket 16's worked example.

## Two rules about measuring, from this phase's own mistakes

**Every probe says which call failed and in whose words.** A probe that reads only the calls holding
a dict reports a failed call as the fix working. That happened three times on this board.

**A measured rate is never edited by hand.** Where a rule was decided after a rate was taken, both
numbers are kept until the probe is sharpened and they become one.

## Done when

- [ ] This phase's rows are in a new scenarios module appended to `ALL`, not added to an earlier
      phase's module.
- [ ] Every hard check above is in `harness/live/checks.py`. A check that is a statement about the
      box rather than about one question goes in `COMMON`.
- [ ] Every check that reads what a model wrote is wrapped in `only_when_a_model_answered`.
- [ ] Probes for this phase's rows are in `harness/live/repeat.py`, and each one prints which call
      failed and its reason rather than counting a failed call as a pass.
- [ ] Any earlier row asserting a rule this phase replaced is rewritten to assert the rule the box
      now has, and its module cites the deciding ticket.
- [ ] `MEMARK_PASS_MODE=auto python -m harness.live` is green, with no `--only`.
- [ ] It commits.
