# 06 — Recurrence: a rule on the line, matched against a day

**What to build:** rent on the 1st, medication three days a week, and a birthday that returns next year
with nothing edited in between.

Everything that repeats is one line in `dates/recurring.md` carrying its rule, per ADR 0042, which
chose an iCalendar recurrence rule expanded by a library over a home-made vocabulary. The rule is
matched against a day rather than calculated ahead: no next-occurrence date is written into any file, so
nothing precomputed can later be wrong. Selection reads that one file and expands each line's rule
across the 366-day forward window. `python-dateutil` is the library, and it is the dependency this
ticket adds.

Everything the standard offers is accepted except sub-daily frequencies. Four rules come with it:

- `since::` carries the date an `INTERVAL` anchors to, because "every three months on the 1st" does not
  say which months.
- A line whose `UNTIL` has passed fires on no day and raises nothing.
- A recurring 29 February fires on 28 February in a common year. It is the only special case in this
  area and it gets its own test.
- A time of day is kept as text and printed in the Digest. Nothing schedules on it, because a ping at
  8am would be a second speaking channel.

The default Notice Schedule for a repeating line is `0d`, because there is nothing to prepare for "take
your medication today".

A missed occurrence is collapsed like any other overdue item, and carries a count of how many times it
came round while the box was off, because with a repeating line the count is the part that informs.

Every test moves a frozen clock forward a day at a time through the scheduled run, and asserts which
Digests an item appeared in. None asserts on a computed next date, because that is the shape of bug
this design exists to avoid.

**Blocked by:** 05 — A day that passed unread is still caught up.

**Status:** completed

**Completed at:** 2026-09-02T06:21:12Z

- [ ] A monthly line on the 1st with `notice:: 0d`, run across two calendar months, appears in exactly
      two Digests and on the right two days.
- [ ] The same line with `notice:: 3d..0d` gives four days of run-up per occurrence and silence between.
- [ ] A weekly line fires on its weekday and no other.
- [ ] `FREQ=MONTHLY;BYDAY=1MO` moves with the calendar rather than sitting on a fixed date.
- [ ] `INTERVAL=3` with a `since::` date fires in months counted from `since::` and not from January.
- [ ] A recurring 29 February fires on 28 February in a common year.
- [ ] A line whose `UNTIL` has passed never fires and raises no error.
- [ ] A yearly line fires again in a second year with no edit between.
- [ ] A time of day on a line is printed in the Digest and schedules nothing.
- [ ] A repeating line with no `notice::` defaults to `0d`.
- [ ] A monthly occurrence that fell while the box was off gets one collapsed overdue mention carrying a
      count, not one line per missed day.
- [ ] `python-dateutil` is pinned in `pyproject.toml`, and no recurrence maths is written by hand.
- [ ] Fixtures added: `dates/recurring.md` holding monthly, weekly, ordinal-weekday and interval lines,
      and a recurring 29 February.
