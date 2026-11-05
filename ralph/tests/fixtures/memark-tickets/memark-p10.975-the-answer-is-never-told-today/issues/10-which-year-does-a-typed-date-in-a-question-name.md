# 10. Which year does a typed date with no year name in a question?

**Type:** grilling

**Status:** resolved

## Question

`recall._nearest_past` reads a typed date with no year as the most recent one already passed. Its
docstring says Recall is a question about the past. ADR 0045, Recall reads forward, later made a
window ahead of today a real question, with open Tasks in its material.

The two rules now disagree on a question about next week:

    you   1 se 7 oct tak kya kya hai?
    bot   You sent me nothing on 07 Oct 2025. I widened to the 7 days from 04 Oct 2025 to
          10 Oct 2025 and you sent me nothing in those either, so I have nothing from them.

Clock: Wednesday 30 Sep 2026. The person meant 1 to 7 Oct 2026. `L377`: 3 of 3, and it is code.
(That only `7 oct` was read is ticket 04.)

Filing goes the other way: `written_dates.the_day_named` reads a year-less date forward.

Which of these?

- **Forward when the Intent Read reads the question as about days ahead**, and back otherwise.
- **The nearest such day either way**, so 7 Oct on 30 Sep is next week and 25 Sep is last week.
- **Back, as now.** A forward question names its year, or says `next`.

Settle also whether `on the 4th`, a bare day number, follows the same rule.

## Answer

Grilled on 2026-10-07. Written down as ADR 0058, a question date with no year takes the nearest one:
[../../../docs/adr/0058-a-question-date-with-no-year-takes-the-nearest-one.md](../../../docs/adr/0058-a-question-date-with-no-year-takes-the-nearest-one.md).

- **The nearest one, back or forward.** Code counts the days each way and takes the shorter. On 30
  Sep, `7 oct` is 07 Oct 2026 and `25 sep` is 25 Sep 2026. No model is asked.
- **`the 4th` follows the same rule.** On 30 Sep it is 04 Oct 2026.
- **A range is placed as one block** at its nearest spot. `20 mar se 10 apr`, asked on 7 Oct, is
  20 Mar 2026 to 10 Apr 2026. Each end never picks its own year.
- A tie, only across a leap year, goes back. Today counts as back. A date with its year is unchanged.
- **The reply names the year.** When code filled in a year, code adds one line: `I took 7 Oct as
  07 Oct 2026. For another year, ask again with it, like "7 oct 2025".` A date typed with its year
  gets no line. A bare `2025` reply is not read; the person asks again with a full date.
- Filing is unchanged: `written_dates.the_day_named` still reads forward.
- `CONTEXT.md`: the Recall entry says a year-less date is the nearest one and the answer names the
  year it took.

Build: `_nearest_past`, `_latest_numbered` and `_day` in `memark/recall.py`, and the range branch of
`window_in`, which must place both ends as one block. The comment above `A_DATE` in
`memark/written_dates.py` still says Recall reads backwards. The year line goes into the answer in
`memark/handler.py`, so `window_in` must report whether it filled in a year. Ticket 04, a range with a
bare first number, is still needed for `1 se 7 oct`. The `harness/live/` bar for `L377` expects 1 to
7 Oct 2026 and the year line.
