# 05 — A day with an entry is closed to new Captures

**What to build:** an entry is never a lie about the day it describes. A thought that lands late on a
day already written up goes into today, with the true time it was sent still on it.

This activates the branch phase 2 built and could not exercise. A Capture is dated by its Send Time
while that day is open, per ADR 0030, and falls back to the day the box took it in when the day is
closed. The closed-day test is the Journal Entry file and nothing else, so until this phase there were
no entries and every past day was open. The test for the closed branch belongs here.

An entry is a snapshot of the inbox as it stood when it was written. A Capture arriving for a day
already journaled does not reopen it, does not amend it, and does not queue a regeneration.

The reply still names the day the Capture landed on, so nothing about this is silent.

**Blocked by:** 01 — Yesterday is written up as prose, and nothing is sent.

**Status:** completed

**Completed at:** 2026-09-07T22:39:01Z

- [ ] A Capture whose Send Time falls on a day that already has an entry: it lands in today's inbox
      file, carrying its true Send Time on the line.
- [ ] The entry for that day is unchanged, byte for byte, and no model call is made about it.
- [ ] The same Capture where that day has no entry: it lands on the past day, as before.
- [ ] The reply names the day it landed on when that is not today.
