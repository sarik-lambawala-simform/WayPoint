# 04. A range with a bare first number is read whole

**Type:** task

**Status:** completed

**What to build:** `between 27 and 29 sept` is 27 to 29 Sep, and never 29 Sep alone.

Spec: [../spec.md](../spec.md), structural finding 4.

## What happens today

`recall.window_in` reads a range only when both ends match `A_DATE`. A bare `27` with no month and
no `th` is not a date there. So only `29 sept` matches, and the window is one day. The question
asked about three.

`written_dates.py` already knows this shape for filing. `_A_DAY_JOINED_BEFORE` finds a bare day
number joined onto a date, as in `8-10 Oct` and `8 to 10 Oct`, and filing then reads no date at
all. Recall does not use it.

## Reproduction

`claude-cli` mode, `the-end-of-september`, Wednesday 30 Sep 2026 20:00.

    you   what did I do between 27 and 29 sept
    bot   Tuesday 29 Sep 2026

          For 29 Sept, your notes say you were in a great mood. There's nothing shown for 27 or
          28 Sept, so I can't tell you what you did on those two days.

The notes for 27 and 28 Sep exist. They were never read. `L358`: 1 of 1, and it is code.

`L377` is the same shape in Hinglish, `1 se 7 oct`, read as 7 Oct alone. Its year is ticket 10.

## What to change

- When a bare day number is joined onto a typed date by a joining word, Recall reads both as one
  range, with the month and year of the date.
- `se` joins a range in Hinglish the way `to` does in English. Add it to the joining words only if
  the unit tests show it reads no ordinary sentence as a range.
- A start after the end still reads no window, as now.

## Done when

- [ ] A unit test reads `between 27 and 29 sept`, `27 to 29 sept` and `27-29 sept` as 27 to 29 Sep
      on Wednesday 30 Sep 2026.
- [ ] `L358` opens on `Sunday 27 Sep 2026 to Tuesday 29 Sep 2026`.
- [ ] The unit suite, `mypy`, `ruff check` and `ruff format --check` are green.
