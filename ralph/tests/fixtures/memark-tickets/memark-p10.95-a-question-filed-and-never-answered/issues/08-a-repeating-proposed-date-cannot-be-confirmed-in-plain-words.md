# 08 — A repeating Proposed Date cannot be confirmed in plain words

**Type:** defect

**Status:** completed

**Reproduces:** 3 of 5 on `claude-haiku-4-5`, measured by `L297:confirmed` after the first half of
the fix was in. **0 of 5 on the same probe after the second half.**

The rate was taken in two parts because the probe found a second hole the write-up missed. See
*What the probe found that this ticket did not* below.

## What the person reads

The Digest asked two questions:

    **Worth asking**
    4. Found a possible date for Priya's birthday, December 19th, about 90 days out — want me to record it?
    5. Found a possible date for your wife's birthday, January 30th, about 132 days out — want me to record it?

They answered in their own words:

    Dates for both Priya and Wifes are correct

And got back:

    Recorded: Dates for both Priya and Wifes are correct
    I cannot do that to 4 in the list I sent you, so I have changed nothing for it.
    I cannot do that to 5 in the list I sent you, so I have changed nothing for it.

Neither date was written. `yes 4` and `yes 5` typed at the same Vault both resolve and both write,
so the box can do the thing it said it could not do.

## Why

The two numbers point at repeating Proposed Dates. `dates/recurring.md` lines 2 and 3 each carry a
`repeat::` rule, per ADR 0042 — a repeating Review Date carries its rule on the line.

The Intent Read returned `kind: "a-day"` with the day it read off the item the Digest printed:

    {"kind": "a-day", "verb": "yes", "number": 4, "day": "2026-12-19", ...}
    {"kind": "a-day", "verb": "yes", "number": 5, "day": "2027-01-30", ...}

`_a_day_set` in `memark/intent.py` hands that to `a_confirmation_on` in `memark/commands.py`, which
returns `None` for any `?` line carrying a rule. Its own note says why: confirming one onto a stated
day would write a day where the rule decides the days. So the change is refused with `NOT_THAT_KIND`
and nothing is recorded.

The refusal is correct about writing a day and wrong about the answer. The person did not name a new
day. They confirmed the day the rule already reads out, which is exactly what `yes N` means, and
`_a_yes_command` resolves the same line without trouble.

## What is not wrong here

**ADR 0012 stands.** A Proposed Date is confirmed by the human, and this is that confirmation
arriving in words rather than as a typed verb. Nothing here proposes confirming anything by itself.

**ADR 0042's rule stands too.** A day may not be written onto a line whose rule decides the days.
The fix is not to let `a_confirmation_on` write one. It is that a stated day matching the rule is a
confirmation of the rule, and a stated day the rule does not name is still refused.

**The model is not the defect to fix first.** Tightening the Intent Read prompt so it returns
`digest-item` here would move the rate and would not close the hole: the next wording sends it back
to `a-day`. Code is where the two paths meet.

## The wider shape

The box has two doors onto one Proposed Date. `yes N` opens the door for a repeating line and a
one-off line alike. A day said in words opens only the one-off door and refuses the other. ADR 0032
put the Intent Read there so a person could say these things in their own words, so the two doors
disagreeing is the defect, not the wording that found it.

## Done when

- [x] A message that confirms a repeating Proposed Date in plain words writes the same `set-date`
      the typed `yes N` writes against the same block, and writes no `day::` on it. The rule stays
      the rule.
- [x] The stated day is checked against the rule before it counts as a confirmation. A day the rule
      does not name is still refused, and its refusal names the rule's own `reads::` text so the
      person can see what the box thinks the days are. It does not say "I cannot do that to N",
      which is false about a line they are looking at.
- [x] A stated notice and a stated tier in the same sentence still ride on the change, per ADR 0038
      — a tier lives on the Card and a date line inherits it.
- [x] A one-off Proposed Date confirmed by a stated day is unchanged, and so is every existing
      `a_confirmation_on` refusal that is not about a repeating line.
- [x] The reply for the repeating case names the line and when the first reminder lands, the way
      `yes N` already does.
- [x] Unit tests cover: a repeating Proposed Date confirmed by a matching stated day, the same one
      with a day the rule does not name, and a repeating line confirmed with a notice and a tier in
      the same sentence.
- [x] A live row in `harness/live/` sends this wording at a Vault holding two repeating Proposed
      Dates, and a hard check asserts both lines end confirmed.
- [x] A probe in `harness/live/repeat.py` gives this a reproduction rate on `claude-haiku-4-5`, and
      the rate is written into this file and into `00-index.md`. The probe says which call failed
      and in whose words.
- [x] `pytest`, `mypy`, `ruff check` and `ruff format --check` are green.

## What the probe found that this ticket did not

The write-up above named one door and there were two locks on it.

The first is the one it names: `a_confirmation_on` returned `None` for any `?` line carrying a
rule, so the change never resolved at all and the reply was `NOT_THAT_KIND`. Fixed by checking the
stated day against the rule and, on a match, building the `set-date` `yes N` builds, with no `to::`
on it.

**With only that in, the probe still reproduced 3 of 5.** The second lock is ADR 0032's split.
`states_a_date` reads the message, and the message that found this states no date anywhere:

    Dates for both Priya and Wifes are correct

So the day in the reading was a day the model worked out, `_a_day_set` held the change back, and
the reply said the Digest would ask again. That is ADR 0032 working exactly as written, on a case
it was not written about: the split holds back **a day being written**, and a repeating line's
confirmation writes none. The rule names the days, and the day in the reading was only ever
checked against it.

So the split is now asked of the change rather than of the reading. An instruction carrying a day
is held back on a message that stated none, which is every one-shot and nothing else. An
instruction carrying no day is not, because there is nothing there for the split to hold.

## What was built

| Where | What |
| ----- | ---- |
| `memark/commands.py` | `_a_rule_confirmed`, the repeating branch of `a_confirmation_on`, and `NOT_THOSE_DAYS` |
| `memark/intent.py` | `_a_day_set` answers a reply-only Command, and asks the split of the change |
| `tests/test_stated_dates.py` | six tests, including the exact wording that found this |
| `tests/fixtures/two-repeating-birthdays/` | a Vault holding two repeating Proposed Dates and the Digest that numbered them |
| `harness/live/checks.py` | `repeating_proposals_confirmed` |
| `harness/live/scenarios_p10_95.py` | `L297`, and the phase's own scenario module |
| `harness/live/repeat.py` | `left_a_repeating_proposal_unconfirmed`, as `L297:confirmed` |

## Blocked by

None — can start immediately.
