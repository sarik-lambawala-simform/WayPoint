# 06 — `skip N` stamps the occurrence it dealt with

**What to build:** the gift is bought, so the reminder stops for this run-up and comes back next year.

`skip N` writes a `handled::` stamp naming the occurrence the Review Date is running up to. The line
then stops firing for the rest of that run-up and returns at the next occurrence its rule names. It
restarts no clock and it deletes nothing.

The stamp names an occurrence and not the day you spoke, per ADR 0042, which put a repeating rule on
the line it governs, and per ADR 0016, which fires a Review Date on the days its schedule names.
Selection already reads the stamp and skips a stamped occurrence. This ticket is the write.

The value of not deleting is the returning half: a birthday you skipped once is still a birthday. A
delete would be the quiet loss the whole design refuses.

**Blocked by:** 02 — The next run applies `close-task` with code alone.

**Status:** completed

**Completed at:** 2026-09-04T12:15:50Z

- [ ] A `skip` Command stamps the Date File line with the occurrence it dealt with, and the line stops
      appearing for the rest of that run-up.
- [ ] The same line fires again at the next occurrence its rule names, with the earlier stamp still on
      it.
- [ ] A `skip` against a monthly line stamps that occurrence only, and the next occurrence is
      unaffected.
- [ ] The same monthly line with no `skip` sent fires on every day of its run-up, which is what proves
      the previous case was the `skip` and not the calendar.
- [ ] A one-shot Review Date that is skipped goes quiet and is not deleted from its Date File.
