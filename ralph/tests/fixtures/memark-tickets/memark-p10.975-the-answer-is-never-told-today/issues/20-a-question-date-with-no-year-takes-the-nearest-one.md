# 20. A question date with no year takes the nearest one

**Type:** task

**Status:** completed

**Completed at:** 2026-10-08T04:35:55Z

**What to build:** `1 se 7 oct tak kya kya hai?` on Wednesday 30 Sep 2026 is answered about 01 Oct
2026 to 07 Oct 2026, and the answer ends with `I took 1 Oct to 7 Oct as 01 Oct 2026 to 07 Oct 2026.
For another year, ask again with it, like "1 oct 2025 to 7 oct 2025".`

Spec: [../spec.md](../spec.md), "Strand 3". Decided in
[Which year does a typed date with no year name in a question?](10-which-year-does-a-typed-date-in-a-question-name.md).
The rule is ADR 0058, a question date with no year takes the nearest one, and the reply says so.

## What happens today

`_nearest_past` and `_latest_numbered` in `memark/recall.py` look back only. `L377` read 7 Oct 2025,
3 of 3. Ticket 04 already reads `1 se 7 oct` as a range.

## What to change

In `memark/recall.py`:

- `_nearest_past` takes the closer of the last such day on or before today and the next one after.
  A tie goes back. A date with its year is unchanged. Rename it to say what it does now.
- `_latest_numbered` gets a forward twin. A month too short for the number is stepped over both ways.
- The range branch of `window_in` places the range as one block: start and end in one year, the end
  moved on a year if it falls before the start, then the closer of that block and the same block a
  year the other way.
- `window_in` reports whether code filled in a year. Pick a flag or a small wrapper type, and name
  the choice in the docstring.

In `memark/handler.py`, where the answer is put together, add the year line from the spec's
"Strand 3". Write days with `clock.display_day`. The example year is the one on the other side of
today. A date typed with its year adds no line.

Change the module docstring of `memark/written_dates.py` and the comment above `A_DATE`, which still
say Recall reads backwards. `the_day_named` does not change.

## Done when

- [ ] Each row of ADR 0058's table gives its day, on 30 Sep 2026 and on 7 Oct 2026.
- [ ] A tie across a leap year goes back, and today is today.
- [ ] `20 mar se 10 apr` on 7 Oct is 20 Mar 2026 to 10 Apr 2026.
- [ ] `1 se 7 oct tak kya kya hai?` on 30 Sep is answered about 1 to 7 Oct 2026 with the year line.
- [ ] `the 4th` gets its own year line. `7 oct 2025` gets none.
- [ ] The unit suite, `mypy`, `ruff check` and `ruff format --check` are green.
