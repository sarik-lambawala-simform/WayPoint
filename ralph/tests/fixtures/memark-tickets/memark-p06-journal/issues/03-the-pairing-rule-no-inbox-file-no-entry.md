# 03 — The pairing rule: no inbox file, no entry, no call

**What to build:** the journal stops inventing days. A day has an entry exactly when it has an inbox
file, so a quiet day stays quiet and stays open.

This reads like a tidy-up and it is what makes Recovery possible at all. The old rule wrote an entry
for every calendar day, so a box off for sixty days would wake, journal sixty empty days it knew
nothing about, close every one of them, and lock out every recovery before one was attempted. ADR 0036,
which made a lost Capture something you restore by hand rather than something the box fetches, is what
that would have broken: the manual route writes into the day the Capture was sent on, and a closed day
refuses the write.

So a day with no inbox file gets no entry, no model call is made for it, and the day stays open
indefinitely. Nothing about the absence is written down, because the absence of the file is the record.

Any code that writes an entry for a day with no inbox file breaks phase 11 before it is built. Treat
that as the invariant this ticket defends.

**Blocked by:** 01 — Yesterday is written up as prose, and nothing is sent.

**Status:** completed

**Completed at:** 2026-09-07T22:03:01Z

- [ ] A day with no inbox file: no entry is written, no model call is made, and the day is still open
      afterwards.
- [ ] A box waking after a sixty-day gap with no inbox files for those days: no entries at all are
      written and every one of those sixty days is still open.
- [ ] A run over a stretch of empty days makes zero model calls and commits nothing on account of the
      journal.
