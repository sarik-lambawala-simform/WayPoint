# 13. The window is relativedelta fields and a grain

**Type:** task

**Status:** completed

**Completed at:** 2026-10-01T02:19:33Z

**Blocked by:** none

**What to build:** the model never writes a date for a window. It sends `relativedelta` fields and a
grain per end, and code turns them into days.

Spec: [../spec.md](../spec.md), "Strand 2: relative days in Recall". Decided in
[Who counts yesterday: code or the model?](05-who-counts-yesterday.md) and
[Which shapes beyond a day count does the model send?](08-which-shapes-beyond-a-day-count.md).
The rules are ADR 0052, code counts a day from today and the model never does, and ADR 0053, the
model sends relativedelta fields and a grain.

## What happens today

The Intent Read's window is `from`, `to`, `occasion`, `around`. The model writes the dates.
`window_said` in `memark/recall.py` checks the calendar holds them and nothing else.

## What to change

- Each end of the window is a set of fields plus a `grain`. Fields: `years`, `months`, `weeks`,
  `days`, `weekday` with an optional count like `MO(-1)`, and `day`. `grain` is `day`, `week`,
  `weekend`, `month` or `year`.
- Code applies the fields to today, grows the start to the first day of its grain and the end to the
  last day of its grain. One end only is used for both. A week is Monday to Sunday.
- Code refuses any other field and any value out of range. A refused window is marked as refused, so
  ticket 15 can tell it from no window.
- `occasion` and `around` stay. The start is still not after the end.
- Today is the day the message arrived, in the person's zone.
- The schema and instructions say the model never writes a date for a window. No example uses a live
  row's words.
- `relativedelta` comes from `python-dateutil`. No new package.
- `docs/stack/dates.md` gains the rule that the model's window is fields and a grain.

## Done when

- [ ] `{"start": {"weeks": -2, "grain": "week"}}` on Wed 30 Sep 2026 is Mon 14 to Sun 20 Sep.
- [ ] `{"start": {"weekday": "MO(-1)", "grain": "day"}, "end": {"grain": "day"}}` is Mon 28 to Wed 30 Sep.
- [ ] Each grain is tested. `weekend` on a Sunday is yesterday and today.
- [ ] A refused field and an out-of-range value are refused.
- [ ] The unit suite is green.
- [ ] It commits, with ADR 0052 and ADR 0053 if no earlier commit carried them.
