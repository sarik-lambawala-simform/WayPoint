# 07 — `yes N` and `no N` on a Proposed Date

**What to build:** the date the agent found is confirmed or killed with one word, and the reply says in
days what you just agreed to.

A Proposed Date is inert until a human confirms it, per ADR 0012, which put the confirmation on the
person because no code can guarantee a date read out of a sentence. `yes N` promotes the line: the `?`
goes, and the confirmation writes the tier and the Notice Schedule. The typed form carries neither, so
this phase writes the defaults, tier 2 and `5d..0d` for a one-shot, and the reply states the resulting
notice days as a number. Saying them in words arrives with the Intent Read in phase 10. The reply must
not imply the Digest sorts by tier, because it does not.

`no N` writes an `x` line, which records the rejection so the same inference is never offered twice.
The read side of that already exists: a line marked `x` in a Date File is read as something you already
answered, so nothing has to remember the rejection anywhere else.

**Blocked by:** 02 — The next run applies `close-task` with code alone.

**Status:** completed

**Completed at:** 2026-09-04T12:43:30Z

- [ ] `yes N` on a Proposed Date removes the `?`, writes tier 2 and the `5d..0d` default schedule, and
      a later run fires the date on the days that schedule names.
- [ ] The reply states the notice days as a number, and says nothing about ordering.
- [ ] `no N` on a Proposed Date writes an `x` line and the date never fires.
- [ ] A second identical inference from filing is not proposed again after a `no`.
- [ ] `yes N` where item N is a Task rather than a proposal is not a Command.
