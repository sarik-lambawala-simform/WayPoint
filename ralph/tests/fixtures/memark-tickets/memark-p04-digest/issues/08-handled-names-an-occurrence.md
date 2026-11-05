# 08 — `handled::` names an occurrence, not the day you spoke

**What to build:** a fortnight of gift reminders that ends the day the gift is bought, with the line
left in place and nothing deleted.

A `handled::` stamp names the occurrence it dealt with rather than the day you spoke. A line is muted
when the occurrence it is running up to carries a matching stamp, so the rest of that run-up is silent
and the next occurrence fires normally with the old stamp still on the line. Nothing is ever cleared,
because "cleared at the next recurrence" only made sense while yearly was the only interval. Stamps are
trimmed to the occurrence in view when the line is rewritten, which is what keeps a weekly line from
growing a stamp a week forever.

Stopping a repeating line sets `UNTIL` to yesterday rather than deleting the line, so the record of what
was once true survives and ticket 07's expansion already knows that a spent line fires on no day.

Phase 5 owns the `skip` Command that writes a stamp. This ticket owns what a stamp means, so a stamp
written by hand behaves exactly as one written by a Command will.

**Blocked by:** 07 — A rule that fires on no day, and `reads::` as the thing you check.

**Status:** completed

**Completed at:** 2026-09-02T07:41:05Z

- [ ] A line whose current occurrence carries a matching `handled::` stamp is silent for the rest of that
      run-up.
- [ ] The same line fires again at the next occurrence its rule names, with the earlier stamp still on it.
- [ ] A stamp naming a different occurrence mutes nothing.
- [ ] When the line is rewritten, its stamps are trimmed to the occurrence in view, and no stamp for the
      occurrence in view is lost.
- [ ] Stopping a repeating line sets `UNTIL` to yesterday, leaves the line in the file, and the line then
      fires on no day.
