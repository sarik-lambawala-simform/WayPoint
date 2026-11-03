# 05 — A day that passed unread is still caught up

**What to build:** a box that was off for a week does not lose the days it missed. The next Digest
carries them, marked for what they are.

The window is read from the last successful Digest rather than from today, per ADR 0022, which decided
that a missed day is caught up rather than skipped. The last successful Digest is derived from the
newest file in the Digests folder, as ticket 02 established, so nothing is stored that could disagree
with it. Missed items are mentioned once, collapsed, and labelled overdue rather than presented as
timely.

The backward reach is capped at thirty days and is the Vault Setting ticket 01 added. A gap longer than
that is not silently swallowed: the Digest states how many older days it skipped.

Local time is what decides a day, not UTC. A run late in the evening in a timezone ahead of UTC fires a
date due that local day exactly once, and the next run after midnight UTC does not fire it again.

**Blocked by:** 02 — One Digest a day: code assigns the numbers, the model writes the words.

**Status:** completed

**Completed at:** 2026-09-02T05:59:16Z

- [ ] A run whose last successful predecessor was ten days ago: a day inside the gap still fires and is
      labelled overdue.
- [ ] An overdue item is mentioned once and collapsed, not repeated per day it was missed.
- [ ] A gap of six months: the thirty-day cap holds, and the Digest states how many older days were
      skipped.
- [ ] The reach is read from its Vault Setting.
- [ ] A run at 23:30 in a timezone ahead of UTC fires a date due that local day exactly once, and the
      next run after midnight UTC does not repeat it.
