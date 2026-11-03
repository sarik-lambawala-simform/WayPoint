# 15 — What the cheap tier actually does with subjects

**Type:** research

**Status:** completed

**Completed at:** 2026-09-17T11:51:40Z

**Blocked by:** 10

**What to build:** a measured rate for how reliably `claude-haiku-4-5` names the subjects in a
message, because the routing rule in issue 10 rests on that read and nothing has measured it.

## Why it is work and not a note

[Ticket 03](03-a-question-that-names-a-festival-never-reaches-the-cards.md) states the risk rather
than deferring it. The rule "the Cards go in the prompt unless the message names a time and nobody"
leans on the subject read, and that read runs on `claude-haiku-4-5` per ADR 0003, hosted models over
local inference, which chose a cheap tier for mechanical filing.

The gap is already written down as **What the cheap tier actually does with subjects** in the
[p09.6 map's](../../memark-p09.6-decisions-only-you-can-make/map.md) fog. This adds a third thing to
that same measurement rather than opening a new one. A spec that shipped the rule and left the
measurement as a note would have shipped an argument untested.

## What bounds it, so nobody reads a bad number as a crisis

Two things, and both say the failure direction is safe.

- This phase's [ticket 01](01-a-common-noun-is-not-a-subject.md) shows the cheap tier naming **too
  many** subjects rather than too few, and an extra subject only sends the Cards. That costs money and
  never a wrong answer.
- `subjects is None` sends the Cards, so a reading that failed altogether fails toward reading more.

The standing preference holds and is not reopened here: a stronger model is a diagnostic and never the
answer.

## What to measure

Use `python -m harness.live.repeat` with `--runs 5` and `--also claude-opus-5`, which is how every rate
in this phase was taken. Three things off the same runs:

1. **How often a message that names a person, a place or a project comes back with that subject.** The
   misses are what would send a question to Recall that should have reached the Cards.
2. **How often a message that names nobody comes back with a subject anyway.** These are the extra
   subjects, and the number says what the rule costs in money.
3. **How often a reading fails altogether**, which is the `subjects is None` branch.

Take the numbers on the Indian household bundle, which is the one written in the language a person
actually types, and record them beside the tier they were measured on.

## Answer

The routing rule of issue 10 holds. All three rates are safe on the tier ADR 0003 puts the Intent
Read on, which is `claude-haiku-4-5`, hosted models over local inference, cheap tier for mechanical
filing. Nothing here argues with the rule and nothing is filed as its own ticket.

Three new probes read the Intent Read's own subject list off the call log, in
`harness/live/repeat.py`: `missed_the_name`, `read_a_subject_out_of_nobody` and the shared
`_the_subjects_read`, whose `None` is the `subjects is None` branch. All three read the filing call,
so none of them needs a `TIERS` entry.

**The rows are every question in the bundle that `memark/intent.py` does not work through by name.**
Ticket 01's fix wrote `L168`, `L174`, `L175`, `L179` and `L182` into the subject instruction as
worked examples. A rate taken on an example measures the example, so those five are left out and
`L182` keeps its own existing probe. Nothing else was left out.

### One. A message that names a person, a place or a project

**30 of 30 on `claude-haiku-4-5`. 6 of 6 on `claude-opus-5`.** No miss on either tier.

| Row | Sent | What the reading named |
| --- | ---- | ---------------------- |
| `L178` | `?mummy ke ghutne ka kya chal raha hai` | `mummy`, 5 of 5 |
| `L180` | `?wat did dr say abt mummy bp` | `dr` and `mummy`, 5 of 5 |
| `L181` | `?khushi ke office ka kya scene hai` | `khushi`, 5 of 5. One run added `office` |
| `L185` | `?ronak ki shaadi december me hai na, kya plan hai` | `ronak`, 5 of 5 |
| `L186` | `tell me what is pending with aarohi's admission` | `aarohi`, 5 of 5 |
| `L189` | `?ramaben ne bola diwali bonus chahiye, last year kitna diya tha` | `ramaben`, 5 of 5 |

This is the rate that could cost an answer, because a name the reading drops is a question that goes
to Recall when it should have reached the Cards. It did not happen once in thirty six runs. Three of
the six rows are harder than the plain case: `L186` has no question mark, `L181` names the person by
the nickname the Registry carries as an alias, and `L180` is typed one handed with the vowels gone.

### Two. A message that names nobody

**5 of 30 on `claude-haiku-4-5`. 0 of 6 on `claude-opus-5`.**

| Row | Sent | Extra subjects |
| --- | ---- | -------------- |
| `L169` | `?where do we go when we want Rajasthani food` | none, 0 of 5 |
| `L170` | `?what suffers if we are out of town for a few days` | `Me`, 3 of 5 |
| `L171` | `?what do I do when the net stops working at home` | `Me` and `home`, 1 of 5 |
| `L172` | `?where do we keep the important documents` | none, 0 of 5 |
| `L173` | `?how many people do I have notes on, and who are they?` | `Me`, 1 of 5 |
| `L183` | `?kya karna hai` | none, 0 of 5 |

**All five carry the literal `Me` and one of the five also carries a common noun, `home`.** That is
ticket 01's fix mostly holding on rows the prompt does not name: `documents`, `Rajasthani food`,
`net` and `people` never came back once in thirty runs, and `home` came back once. What is otherwise
left is the `Me` rule, which the same instruction asks for when a message is about the person
writing it, and `what suffers if we are out of town` is a fair reading of that. So the honest reading
of this number is an upper bound on the cost: some part of the five is the prompt working rather
than a subject nobody meant.

The cost is money and never a wrong answer. An extra subject only sends the Cards, and the Cards
going in is what ADR 0043, every Card in the prompt rather than a picker, already pays for on every
ordinary question. On this Vault's 2,723 token prompt that is $0.0069 a question, the figure
`harness/live/bill.py` measured for this phase.

### Three. A reading that failed altogether

**0 of 60 on `claude-haiku-4-5`. 0 of 12 on `claude-opus-5`.** No run came back without a usable
subject list, on any of the twelve rows. The `subjects is None` branch was never taken, so it stays
covered by the unit test the spec names and not by a rate.

### The runs behind them

Five calls of `python -m harness.live.repeat`, split only to keep each one inside its time budget.
Every call was `--runs 5 --also claude-opus-5`, in `claude-cli` mode, on the Indian household bundle:
`tests/fixtures/an-indian-household` with the `an-indian-life` overlay.

```
python -m harness.live.repeat L178:subject L181:subject L185:subject --runs 5 --also claude-opus-5
python -m harness.live.repeat L186:subject L189:subject --runs 5 --also claude-opus-5
python -m harness.live.repeat L169:subject L170:subject L172:subject --runs 5 --also claude-opus-5
python -m harness.live.repeat L173:subject L183:subject --runs 5 --also claude-opus-5
python -m harness.live.repeat L171:subject L180:subject --runs 5 --also claude-opus-5
```

Sixty runs on `claude-haiku-4-5` and twelve on `claude-opus-5`, seventy two in all. Rate three is the
whole seventy two because every run of both probes can fail that way. Rates one and two each take
half of it: thirty six runs on the six name rows and thirty six on the six nobody rows.

### What this does not measure

The twelve rows are questions. A rate for the subject read on a message that files something rather
than asks something is a different number and this is not it. The routing rule only reads subjects on
the way to an answer, so this is the rate the rule rests on, but a later phase that routes on subjects
somewhere else needs its own.

The p09.6 fog patch also asked whether the cheap tier holds `Me` back when a message only says
`remind me`. No row here sends one, so that half is still unmeasured and the map says so.

## Done when

- [x] All three rates are recorded in this file under an `## Answer` heading, with the runs behind
      them.
- [x] Each rate names the model it was measured on.
- [x] The p09.6 map's fog patch is updated with the numbers and a pointer here.
- [x] Any rate bad enough to argue with issue 10's rule is filed as its own ticket rather than fixed
      by raising the tier. No rate is: 30 of 30 names found, 0 of 72 failed readings, and the five
      extra subjects all send the Cards, which costs money rather than an answer.
