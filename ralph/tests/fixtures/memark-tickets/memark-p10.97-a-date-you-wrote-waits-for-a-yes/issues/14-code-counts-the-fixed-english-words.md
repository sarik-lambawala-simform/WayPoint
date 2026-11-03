# 14. Code counts the fixed English words

**Type:** task

**Status:** completed

**Completed at:** 2026-10-01T03:12:58Z

**Blocked by:** 13

**What to build:** `yesterday` on Wednesday 30 Sep is Tuesday 29 Sep every time, with or without a
model.

Spec: [../spec.md](../spec.md), "Code reads the English words first". Decided in
[Who counts yesterday: code or the model?](05-who-counts-yesterday.md) and
[Which shapes beyond a day count does the model send?](08-which-shapes-beyond-a-day-count.md).

## What happens today

`window_in` in `memark/recall.py` reads typed dates only. Its module docstring says a relative word
like `yesterday` is read by the model and never by the patterns there.

## What to change

- `window_in` reads the words in the spec's fixed-words table and makes the same fields ticket 13
  applies: `today`, `yesterday`, `day before yesterday`, `N days ago` with N as digits or `one` to
  `ten`, `last/this/next <weekday>`, `last week`, `N weeks ago`, `this weekend`, `last weekend`.
- `last Monday` is the most recent Monday before today, 7 days back on a Monday. `this Monday` is
  Monday of this week. `next Monday` is the first Monday after today.
- A typed date is still read first.
- Where code read a word, the model's window is not used. When the model's fields differ, one log line
  names both, per `docs/stack/tests-and-logging.md`. The box does not ask.
- The `recall.py` module docstring names ADR 0052 and ADR 0053 in place of the old line.
- `docs/stack/dates.md` gains the rule that code counts a relative day and the model never writes one.

## Done when

- [ ] Each word in the table is right on Wed 30 Sep 2026, on a Monday and on a Sunday.
- [ ] `yesterday` with a `FailingModel` still gets its day.
- [ ] A clash uses code's day and writes one log line.
- [ ] The unit suite is green.
