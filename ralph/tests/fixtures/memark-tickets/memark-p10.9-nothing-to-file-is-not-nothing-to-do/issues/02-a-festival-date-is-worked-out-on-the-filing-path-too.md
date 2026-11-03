# 02 — A festival date is worked out on the filing path too

**Type:** defect

**Status:** completed

**Completed at:** 2026-09-17T20:28:43Z

**What to build:** the filing prompt refuses to date an occasion the Vault confirms no day for, the
way the answering prompt already does since phase 10.85's ticket 04.

**Reproduces:** 5 of 5 on `claude-haiku-4-5`, the tier ADR 0003 puts filing on. 0 of 1 on
`claude-opus-5` as a diagnostic, which got it right and proposed no day at all. Only the cheap tier
fails, so the prompt is too thin to carry the rule rather than wrong.

## What happens

`L220` sends `raksha bandhan pe ronak ko bulana hai, usko abhi bol dena padega`. The errand is real
and the day is not the box's to know: Raksha Bandhan moves with the lunar calendar and this Vault
holds no confirmed day for it in any year, only a rejected line naming it.

The model files the errand correctly and then attaches a day it invented, with a yearly rule locking
that day in for every year after.

| Run | The day it worked out | The rule beside it |
| --- | --------------------- | ------------------ |
| the pass | `2026-09-08` | `FREQ=YEARLY;BYMONTH=9;BYMONTHDAY=8` |
| repeat 1 | `2026-08-29` | `FREQ=YEARLY;BYMONTH=8;BYMONTHDAY=29` |
| repeat 2 | `2026-08-31` | `FREQ=YEARLY` |
| repeat 3 | `2026-09-08` | `FREQ=YEARLY;BYMONTH=9;BYMONTHDAY=8` |
| repeat 4 | `2026-08-29` | `FREQ=YEARLY` |
| repeat 5 | `2026-08-29` | `FREQ=YEARLY;BYMONTH=8;BYMONTHDAY=29` |

Six runs and three different days. That spread is the finding rather than any one date: a value that
changes every run is a guess, and the box writes it into a Review Date in the same voice it writes a
day somebody confirmed.

The yearly rule is wrong twice over. The day is wrong this year, and a festival that moves cannot
have a fixed one at all, so a rule anchored to a month and a day is wrong every year even if this
year's happened to be right.

## Why

Phase 10.85's ticket 04 decided this for the answering call and said why: a festival date is never
the model's to know, because the box has one record of when a festival fell and it is the Vault's
own. That fix went into the answering path and the Intent Read. The filing prompt was never part of
it, so `memark/distillation.py` still asks for a `date` on any claim that sounds like it has one,
with nothing telling it that an occasion is the case where it must not answer.

A dated line is worse than a dated sentence. A sentence is read once; a Review Date fires, and a
repeat rule fires every year, so this one invents a reminder that will go off on the wrong day
until somebody notices and deletes it.

## What to change

The filing prompt, beside the rules it already carries about dates. An occasion is named and never
dated: the errand files as a Task with no `date` and no `repeat`, and the day is the person's to
confirm the way any other proposal is.

Read phase 10.85's ticket 04 first and reuse its words rather than writing a second version of the
same rule. Two prompts saying the same thing differently is how the two drift apart.

## What was built

An edit gained an `occasion` field, which is the same field and the same reason the Intent Read has
one: the name comes back unresolved so the day does not have to be worked out. The filing prompt
says an occasion is named and never dated, reusing phase 10.85's ticket 04's own words, and
`vault/apply.py` refuses a date proposal carrying an occasion before it looks at the day at all.

The refusal is flat rather than conditional on the Vault, and that is the one place the build is
wider than the ticket's first line. **A person should confirm the widening.** The ticket asks for a
rule about "an occasion with no confirmed day in the Vault". What shipped says an occasion is never
dated, whether the Vault holds a day for it or not.

The reason is that the filing model is shown the Registry and the Cards and never a Date File. It
cannot produce a confirmed day even for an occasion the Vault holds one for, so a rule that let a
date through when the Vault happened to agree with it would be a rule that never fires. Refusing
flat costs nothing today. The day stays the person's to confirm, which is what the ticket asked for.

Two limits are worth naming rather than leaving to be found:

- An edit carrying `occasion` and a `repeat` but no `date` is a Card edit, so it never reaches the
  guard and the rule is dropped without a word. That is true of any `repeat` with no `date` and has
  been since ADR 0042, so it is not a hole this ticket opened. For this shape the prompt is the only
  thing holding the `repeat` half.
- The occasion name is not written into the Vault. The festival is already in the line's `text`, so
  a field for it on a Card line would be a second copy of the same word and a new thing the linter
  has to defend. `apply_edits` logs every occasion it read and left undated, so nothing is dropped
  in silence.

The errand still files. `L220` comes back as one open Task on Ronak's Card reading `invite Ronak for
Raksha Bandhan`, carrying `occasion` and no day, so refusing the date costs nothing the person said.

## The rate after the change

`python -m harness.live.repeat L220:date --runs 5` on `claude-haiku-4-5`: **0 of 5**, down from 5 of
5. Every run returned `nothing proposed a day for raksha bandhan`.

That was measured twice, because the prompt wording was edited after the first measurement to answer
a review. 0 of 5 both times, ten runs in total, and no run in either set proposed a day.

Three further runs printing the edits themselves returned one edit each, every time: `task=True`,
`date=None`, `repeat=None`, `occasion` as `Raksha Bandhan`, on Ronak's Card.

Two date probes were re-measured because the schema gained a field every edit now carries, in case
the extra field cost the ordinary date path. `L32:date` and `L33:date` came back 0 of 3 each.
`L32:date` went `bad` once in a further three runs, on weekday arithmetic rather than on anything
this ticket touched, and it is the same area ticket 12 already holds. `L203:day` is 2 of 3, which is
ticket 03's own defect and is left alone.

## Done when

- [x] The filing prompt says an occasion with no confirmed day in the Vault is filed with no `date`
      and no `repeat`.
- [x] `L220` files a Task and nothing dated.
- [x] A unit test asserts an occasion claim carrying a `date` is refused on the write path, so the
      prompt is not the only thing holding this.
      `tests/test_proposed_dates.py::test_a_day_worked_out_for_an_occasion_is_refused_and_the_errand_files_anyway`
      asserts all three halves: no dated line in either shape of Date File, the Task on the Card,
      and the Capture left undrained with the refusal in the log.
- [x] The rate is measured again after the change, on `claude-haiku-4-5`, and it is in the ticket.
