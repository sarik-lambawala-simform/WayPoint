# 11 — `pick N <name>`

**What to build:** the Digest asks which Priya you meant and you can now answer it. The Capture drains
instead of sitting undrained while the same line repeats until you stop reading the Digest.

`pick N <name>` selects one of several, named rather than numbered. The name resolves exactly against
Registry rows by the same rule ticket 03 built. A name matching nothing, or matching two rows, changes
nothing and says so.

It serves both an Ambiguous Subject, per ADR 0015, and a Contradiction, per ADR 0010, which decided
contradictions surface rather than resolve. They are the same question wearing two labels, so one verb
answers both and writes `pick-subject` or `resolve-contradiction` as the case needs. Both codes are on
ADR 0026's closed list.

You never have to type it. "The Priya I meant was my cousin" is read by the Intent Read and becomes the
same change, which is the whole point of the phase.

The typed form is a Command only when every part of it resolves, per ADR 0041. `pick 2 apples from
market tomorrow` names no Registry row, so it was never a Command. It goes to the Intent Read, and the
errand and the date are acted on. That loss is the reason ADR 0041 exists, and this ticket is where it
is closed in behaviour rather than only in classification.

**Blocked by:** 03 — A name is matched by code, never by the model.

**Status:** completed

**Completed at:** 2026-09-10T01:18:46Z

- [ ] `pick 3 cousin` answering an Ambiguous Subject resolves the row and the Capture drains on the
      next run.
- [ ] The same verb answers a Contradiction.
- [ ] A name matching no row changes nothing and the reply says so.
- [ ] A name matching two rows changes nothing and names both.
- [ ] "The Priya I meant was my cousin" produces the same change through the Intent Read.
- [ ] `pick 2 apples from market tomorrow` is not refused. The Intent Read runs and the errand and the
      date are acted on.
