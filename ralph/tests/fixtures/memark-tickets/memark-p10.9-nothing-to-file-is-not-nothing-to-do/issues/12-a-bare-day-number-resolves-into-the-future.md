# 12 — A bare day number resolves into the future

**Type:** defect

**Status:** completed

**Completed at:** 2026-09-18T02:53:11Z

**Blocked by:** 01 — Three checks cannot see a citation whose block id is not hex

**What to build:** `the 20th` means the most recent 20th, not next month's, so a question about a day
that has happened is answered from the day that happened.

**Reproduces:** 3 windows of the 4 the regression resolved landed in the future. The same question
shape landed in the past on one row and the future on another in the same run, so it is the
instability rather than a constant.

## What happens

Every row runs on 27 August 2026. Three questions naming a bare day number were read as September.

| Row | Sent | The window the reading returned |
| --- | ---- | ------------------------------- |
| `L84` | `what was going on on the 20th?` | `2026-09-20` |
| `L87` | `what happened with the borewell between the 10th and the 15th?` | `2026-09-10` to `2026-09-15` |
| `L69` | `what happened with the skylight between the 10th and the 15th?` | `2026-08-10` to `2026-08-15` |

`L69` and `L87` are the same sentence with one noun changed and they went to different months.

The cost is a wrong answer that reads like a right one. September holds nothing, because it has not
happened, so the box reports a quiet stretch and widens into more of the future. August's notes,
which are what the person asked about, are never read. Nothing in the reply says which month it
looked at except the footnote, and a person who reads `Read all 0 notes from 10 Sep 2026` has
already been told the wrong thing by the paragraph above it.

## Why

Code has the rule and the reading goes around it.

`memark/recall.py:626`, `_latest_numbered`, works out the most recent day of the month carrying a
number, today included. That is what `window_in` uses when code reads the date out of the message
itself. It is right and it is not reached here.

The Intent Read returns an absolute day instead, per ADR 0032, and `recall.window_said` checks only
that both ends are days the calendar holds and that the start is not after the end. A day in the
future passes both. `_nearest_past` says why, in its own words:

> A date written whole is that date and is not moved, even when it is in the future.

That is right about a person who typed `2026-09-20`. It is wrong about a model that wrote
`2026-09-20` because the person typed `the 20th`. The rule cannot tell the two apart, because by the
time code sees it the reading has already turned a bare number into a date.

## What to change

Two ways and the ticket does not pick, because they sit in different places.

The reading is told the rule: a bare day number means the most recent day carrying it, today
included, and never a day ahead. One sentence in `memark/intent.py` beside what it already says
about windows.

Or code applies the rule it already has: where the reading returns a window entirely ahead of today
and the message named no year and no month, `window_said` moves it back the way `_latest_numbered`
would. That holds whatever any model does and it has to be careful not to move a window the person
really did mean, which is the case ticket 06 is about.

The second is the stronger fix and it collides with ticket 06, which is why this ticket is blocked
on nothing but 11 and named in 06's body instead.

## Done when

- [ ] `the 20th` asked on 27 August resolves to 20 August on five runs of five.
- [ ] A window the person wrote whole and in the future is still not moved.
- [ ] `L84`, `L87` and `L69` all resolve to August.
- [ ] A unit test covers a bare number, a number with a month, and a full date, so the three are
      told apart by something other than the model's mood.
- [ ] Ticket 06's answer and this fix do not contradict each other.
