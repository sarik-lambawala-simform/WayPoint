# 07 — The Canary counts the days the journal and the inbox disagree

**What to build:** a silent generation failure becomes a number you read every evening. Two years on
you can tell a day you said nothing on from a day the system was broken.

The pairing rule can disagree in two directions and the Canary reports both: an inbox file with no
entry, which is a day still owed a write-up, and an entry with no inbox file, which should be
impossible and is worth saying so out loud. Both are derived by walking the two folders rather than
stored, per ADR 0020, which keeps state derived from files the system already writes.

The count is what a failed composition is reported as, per ADR 0027. Nothing is said in the chat at the
time it fails, because a count still says something a week later and an event does not.

An entry deleted by hand is the same disagreement read from the other side. The Canary counts it and the
next run's backfill writes it again, which is the loop closing without anybody being asked anything.

**Blocked by:** 04 — Backfill: past days without an entry, oldest first.

**Status:** completed

**Completed at:** 2026-09-07T23:17:48Z

- [ ] The Canary carries a count of days with an inbox file and no entry, shown when it is not zero.
- [ ] It carries the other direction too: an entry whose day has no inbox file.
- [ ] A Vault where an inbox file exists and its entry was deleted by hand: the Canary counts the
      disagreement and the next run backfills the entry.
- [ ] A run whose composition failed shows up as one more outstanding day rather than as a message.
- [ ] Both numbers are derived from the two folders. Nothing is stored by one run for a later run to
      read.
