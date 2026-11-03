# 11. Filing confirms a typed date on its piece

**Type:** task

**Status:** completed

**Completed at:** 2026-10-01T02:46:44Z

**Blocked by:** 10

**What to build:** `Remind me to order hand blender on 8th october` lands a Review Date at once, and
the reply says `✅ Loose Ends: order hand blender, on 08 Oct 2026. First reminder 5 days before.`

Spec: [../spec.md](../spec.md), "Strand 1: typed dates on filing". Decided in
[Where does the typed-date test run on a new Capture?](01-where-does-the-typed-date-test-run.md) and
[What does the reply say about a typed date's warning and tier?](07-what-the-reply-says-about-warning-and-tier.md).
The rule is ADR 0050, a typed date is tested on its piece and code works out its day.

## What happens today

Every dated filing edit becomes a `?` line. `memark/distillation.py` calls this "a gap rather than
a decision". The reply line names the errand only.

## What to change

In `memark/vault/apply.py`, where a filing edit carrying `date` is written:

1. Find the piece the edit came off.
2. If the cut does not add back up to the typed text, write a Proposed Date.
3. `states_a_date` on the piece's words says no: write a Proposed Date.
4. The day from ticket 10's function, on the piece's words and the Capture's arrival day, is nothing
   or is not the model's `date`: write a Proposed Date.
5. Otherwise write a Review Date, with the Vault's default Notice Schedule and tier, built the way
   `confirm_date` builds them.

The arrival day is the Capture's own date in the inbox, not the run day.

The reply line of a piece with a confirmed date adds `, on <day>. First reminder N days before.`

- The day comes from `clock.display_day`.
- The reminder wording is the `yes N` reply's, `WILL_CONFIRM_ON` and `_when` in
  `memark/commands.py`, shared and not copied. N is read from the schedule the line ended up with.
- A proposed date adds nothing to the reply.

Replace the "gap rather than a decision" docstring in `distillation.py` with one naming ADR 0050.

## The tests that assert the old rule

`tests/test_proposed_dates.py` drives Captures that state a day, with a matching model day, and
asserts a `?` line. Where a test's point is the Proposed Date machinery (the Date File, the Digest
line, the footer), change its Capture to words that state no date. Where its point is that a typed
date is proposed, rewrite it to the new rule and name this phase's ticket 01 in its docstring.

`L35` in `harness/live/scenarios_p05.py` sends `tomorrow`, which `states_a_date` says no to. It is
not edited.

## Done when

- [ ] A stated day with a matching model day lands a Review Date and the reply names the day and the
      first reminder.
- [ ] A differing model day, two dates in the piece, or a cut that does not add up, each land a
      Proposed Date and add nothing to the reply.
- [ ] Ten errands where one piece names a day confirm that one only.
- [ ] A Capture from 23:58 filed after midnight counts from its arrival day.
- [ ] `undo` after a confirmed date removes the Task and the date line.
- [ ] `tests/test_proposed_dates.py` is brought up to the rule.
- [ ] The unit suite is green.
