# 16 — A dated errand that belongs to nobody

**What to build:** "chase the plumber Thursday" lands somewhere sensible without you inventing a subject
for it.

Some reminders have no owner. The plumber is not a person you keep a Card about, and creating one would
fill the Registry with rows that exist only because a date needed somewhere to hang. Every such row then
costs tokens on every filing call, because the Registry ships whole.

So a dated errand with no resolving subject gets its Review Date on `areas/loose-ends.md`, and no Card is
created for the errand's subject. The date still lives in its date-indexed file, per ADR 0011, and
`areas/loose-ends.md` is what the line names as its home.

The reply names where it landed, so a date that went to loose ends is visible and can be moved by hand or
by another sentence.

This only applies when no subject resolved. A message that does name a Card the Registry knows goes to
that Card as usual.

**Blocked by:** 07 — A date you stated is not a date it inferred.

**Status:** completed

**Completed at:** 2026-09-10T20:39:23Z

- [ ] A dated errand naming no resolvable subject puts its Review Date on `areas/loose-ends.md`.
- [ ] No Card is created for the errand's subject and no Registry row is added.
- [ ] The reply names where the date landed.
- [ ] A dated errand that does name a known Card still lands on that Card.
- [ ] `areas/loose-ends.md` is created if it is missing, and reused if it is there.
