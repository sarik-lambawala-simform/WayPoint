# 01 — A weekday is resolved by a rule that only reads numbers

**Status:** done

**Reproduces on Haiku:** structural, always. The measured cost is 7 of 15 weekday words dated wrong.

The filing prompt tells the model that `friday` names a day, then gives it a rule that can only
resolve a number. The model is left to work the weekday out from a calendar it does not have, and
it gets it wrong about half the time.

## What the pass sent and what came back

Every Capture below was sent on Thursday 27 August 2026, which is the day the fixture pins.

| Row | The message | Model returned | The day it names |
| --- | ----------- | -------------- | ---------------- |
| L1 | `chase him friday if nothing by then` | `2026-08-29`, a Saturday | `2026-08-28` |
| L32 | `I'm cancelling the broadband on Monday` | `2026-09-01`, a Tuesday | `2026-08-31` |
| L33 | `I need to cancel the wifi on Tuesday` | `2026-09-01` | correct |

The model returns the ISO date itself, so no code computed these. From the L32 call log:

```json
{"kind": "extend", "subject": null, "heading": "Tasks",
 "text": "cancel the broadband", "task": true, "date": "2026-09-01"}
```

Both wrong answers are one day late, and the errors are internally consistent. A model that
believes 29 August is a Friday also believes 1 September is a Monday. It is not reading the
calendar wrong at random. It has no calendar to read.

## Why it happens

Two lines of `distillation.py` between them ask for arithmetic and withhold what it needs.

The prompt's day rule, at `memark/distillation.py:401`:

```
- A day can be named by its number alone, and that is still a day. `the 4th` names one, and so
do `friday` and `tomorrow`. Which day it is follows from the day the Capture was sent: the next
day carrying that number, on or after it. `the 4th` sent on 2026-08-27 is 2026-09-04.
```

One sentence names three kinds of day word. The next gives a rule for one of them. `the next day
carrying that number, on or after it` resolves `the 4th`, and the worked example is an ordinal
too. `friday` carries no number, so the rule the sentence supplies cannot resolve the word the
same sentence introduces. `tomorrow` is in the list and is not covered either.

And the Capture is rendered without its weekday, at `memark/distillation.py:124`:

```python
return f"- ^{self.block_id} {self.day} {self.words}"
```

`self.day` is an ISO date, so the model is shown `- ^2b9c 2026-08-27 09:14 I'm cancelling the
broadband on Monday`. To find the Monday after that it must first know 27 August 2026 is a
Thursday. Nothing in the prompt says so. I checked the whole rendered system prompt and user
prompt of the L1 and L32 calls. No weekday name appears anywhere except `Saturday` inside the
unrelated pronoun example, and `friday` in the rule quoted above.

## Reproduction

`python -m harness.live.repeat L1 L32:date L33:date --runs 5 --also claude-opus-5`

| Row | Word | claude-haiku-4-5 | claude-opus-5 |
| --- | ---- | ---------------- | ------------- |
| L1 | `friday` | 3 of 5 wrong | 0 of 1 |
| L32 | `Monday` | 3 of 5 wrong | 0 of 1 |
| L33 | `Tuesday` | 1 of 5 wrong | 0 of 1 |

Seven of fifteen weekday words came back as the wrong day on the filing model. No single row
reaches five of five, and that is why this ticket is filed on the structural gap rather than on
the rate. The gap holds on every call. The prompt asks for a weekday and supplies neither a rule
that resolves one nor the weekday of the day it counts from. The rate is what that costs.

Opus got all three right. Per ADR 0003, which puts mechanical filing on the cheap tier, that
reading is that the prompt is too thin to carry the tier it runs on. It is not an argument for
changing the tier, and the comparison column is a diagnostic and never the fix.

## How to fix it

Give the model the weekday instead of making it derive one, and state the rule for a weekday the
way the ordinal rule is already stated. `docs/stack/dates.md` forbids inventing interval
arithmetic, and says ordinal weekdays are exactly where a small vocabulary gets it wrong, so the
fix belongs in the prompt and not in a new date parser. Nothing here needs `dateutil`, because
naming the weekday of a date already in hand is not interval arithmetic.

A wrong date is not silently written. It becomes a Proposed Date the person confirms, per
ADR 0012, so the failure shows up as the Digest offering to remind them on a Saturday about a
Friday. That is a wrong day presented as a real one, which is the shape of failure ADR 0012's
confirmation step exists to catch and not the shape it exists to permit.

## Done when

- [x] Every Capture is shown to the filing call with the weekday of the day it was sent, next to
      the ISO date.
- [x] The prompt states how a weekday name resolves, in the same shape and place as the ordinal
      rule, with a worked example against a stated day.
- [x] `tomorrow` either gets its own rule or comes out of the list of words the prompt says name a
      day, so the list and the rules cover the same words.
- [x] `python -m harness.live.repeat L1 L32:date L33:date --runs 5` reports 0 of 5 on all three.
- [x] `pytest`, `mypy`, `ruff check` and `ruff format --check` are green.

## Comments

Fixed. `Captured.render` now names the weekday beside the ISO date, so a Capture reaches the
model as `- ^d201 Thursday 2026-08-27 09:02 chase him friday`. The naming lives in `clock.py` as
`weekday_of_stored`, because that module already owns what a day is and a second table of day
names is a second answer to the same question. The names are a fixed tuple and not `strftime`,
whose output follows the process locale.

The one day rule became four bullets: what a number resolves to, what a weekday name resolves to,
and what `today` and `tomorrow` resolve to. Each carries a worked example. `today` was not on the
checklist and is there because the weekday rule says a Capture naming the day it was sent means a
week later, which only reads straight if the word for the day itself is also spoken for.

The weekday examples are worked against Tuesday 2026-03-10 and not against 2026-08-27, which is
the day the live fixture pins. An example naming the day L1 and L32 ask about would let the model
copy the answer out of the prompt, and the probe would score the copying instead of the rule.

`pytest` (953), `mypy`, `ruff check` and `ruff format --check` are green.

The live check ran in `claude-cli` mode on the local Claude Code login, the same door the
measurement in this ticket came through, with the filing tier on `claude-haiku-4-5`.

    python -m harness.live.repeat L1 L32:date L33:date --runs 5

| scenario | word | before | after |
| -------- | ---- | ------ | ----- |
| L1 | `friday` | 3 of 5 wrong | 0 of 5 |
| L32:date | `Monday` | 3 of 5 wrong | 0 of 5 |
| L33:date | `Tuesday` | 1 of 5 wrong | 0 of 5 |

Seven of fifteen weekday words were dated wrong. Now none is. Every run returned the day the
word names: 2026-08-28, 2026-08-31, 2026-09-01.
