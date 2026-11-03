# 04 — A day named by its number alone is not proposed as a date

**Status:** completed

Status: resolved

**Completed at:** 2026-09-04T07:21:22Z

**Owned by:** phase 3. `INSTRUCTIONS` in `memark/distillation.py`.

**Found by:** the live-model pass, scenario L11, on `claude-haiku-4-5`.

## What happens

The Capture `cant remember if i told priya abt the deck deadline movin to the 4th` names a day. The
model returned a Task on `Priya (colleague)` reading `tell her about the deck deadline moving to the
4th`, with `date: null`.

So the words survive and the day does not. No Review Date is created, nothing is proposed, and
nothing will raise it on the 4th, which is the whole reason the day was mentioned.

## The prompt states the rule

> A date you propose is not recorded and reminds nobody of anything until the person confirms it, so
> propose one whenever a Capture names a day.

And it gives the model what it needs to work the day out:

> Each Capture below is shown with the day it was sent, so work the day out from that one and never
> from a guess about now.

The Capture was sent on 2026-08-27, so `the 4th` is 2026-09-04. Opus returns exactly that.

## How often it reproduces

Five runs on `claude-haiku-4-5`, one on `claude-opus-5`, same Capture, same baseline Vault.

| model | proposed a date | returned none |
| ----- | --------------- | ------------- |
| `claude-haiku-4-5` | 0 of 5 | 5 of 5 |
| `claude-opus-5` | 1 of 1, `2026-09-04` | 0 |

Five out of five. This is the most consistent of the six findings.

## What the model does get right, so the fix must not break it

The same model resolves a day when it is named more plainly. From the same pass:

| scenario | words | `date` returned |
| -------- | ----- | --------------- |
| L1 | `chase him friday if nothing by then` | `2026-08-29` |
| L8 | `a lift to the airport on the 12th` | `2026-09-12` |
| L14 | `birthday is the 19th of december` | `2026-12-19`, with `FREQ=YEARLY;BYMONTH=12;BYMONTHDAY=19` |

L8 is the awkward one for any simple explanation: `the 12th` is the same shape as `the 4th` and it
was proposed. The difference is that L11's day sits inside a Task about telling somebody something,
so the day belongs to the deadline rather than to the errand, and the model appears to file the
errand and drop the deadline. The wording of the fix has to reach that case without making every
number in a sentence a date.

## A related case that was investigated and is not a defect

`book the deep clean the week after next` returns no date from Haiku 3 runs in 5, and no date from
Opus. Both models mostly decline it.

That is defensible. The prompt says `date` is "the day a Capture is about", and a week is not a day.
Two models independently declining it, one of them the strongest available, is not the signature of a
defect. It is filed here as investigated rather than as a ticket, so nobody re-opens it later without
the evidence.

## Done when

- [ ] A Capture naming a day by its number alone, inside a Task about something else, comes back with
      that day as `date`, on `claude-haiku-4-5`, five runs out of five.
- [ ] The day is worked out from the day the Capture was sent, per ADR 0030, and not from a clock.
- [ ] The days that already resolve still resolve: a weekday name, a bare `the 12th`, and a full
      `19th of december` with its `RRULE`.
- [ ] A Capture naming a span rather than a day, `the week after next`, still proposes nothing. This
      ticket does not widen the rule to spans.
- [ ] A number in a sentence that is not a day, `the worktop is 3.2m`, still proposes nothing.
- [ ] A test at the filing seam with a scripted answer, pinning that a proposed date reaches
      `dates/` as a proposal and not as a claim, per ADR 0012.
