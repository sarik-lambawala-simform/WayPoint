# 01 — The phase's Vault Settings, the Notice Schedule, and one-shot selection

**What to build:** the run works out what is due today and makes no model call doing it. Nothing is
sent yet. What this ticket produces is a list, and the proof it is right is which lines are in it.

Selection is plain code and costs the same whatever the Vault holds, per ADR 0002, which reserved the
choice of what a call sees to code, ADR 0011, which fixed selection as deterministic, and ADR 0016,
which made a Notice Schedule a list of days rather than a window. Code opens Date Files by name and
never scans: for each of the next 366 days it asks whether `dates/YYYY/MM/YYYY-MM-DD.md` exists, and
reads the line files it finds. The window is 366 days because a schedule may reach a full year back
from its date, so it is a constant and not a Setting, per the Setting rule in `CONTEXT.md`. No Card is
opened by this path at all, so a Dormant Card's date fires like any other.

`notice::` becomes a real schedule. It is a list of days-before with `..` as shorthand for a run of
consecutive days, as in `90d, 15d..0d`, and a line fires on every day its schedule names and on no
other day. The default for a confirmed one-shot is `5d..0d` and is a Vault Setting. A schedule that
does not parse is a lint failure and not a guess.

The Vault Settings this phase reads all arrive here rather than one at a time later, because they are
read and checked at start and a bad one stops the box rather than falling back: the Digest hour, which
defaults to 20:00 local, the default Notice Schedule and tier, the Digest's two caps, the backward
reach, and where the Health Canary is delivered. Later tickets in this phase use them and do not add
to the file.

Nothing here calls a model, so every test asserts zero model calls.

**Blocked by:** None, can start immediately.

**Status:** completed

**Completed at:** 2026-09-01T11:11:25Z

- [ ] `notice:: 90d, 15d..0d` parses to the days it names, and a schedule that does not parse fails the
      linter with the line number.
- [ ] A one-shot Review Date whose schedule names today is selected, and one naming tomorrow only is not.
- [ ] A `90d, 15d..0d` schedule is selected at 90 days out, not at 60, and again at 15.
- [ ] Selection reads Date Files by name across the 366-day forward window and opens no Card and no
      inbox file.
- [ ] A due date on a Dormant Card's subject is selected, because selection never reads the Card.
- [ ] Every Vault Setting this phase needs is read at start, and a bad value stops the run with a
      message naming the Setting rather than falling back to a default.
- [ ] Zero model calls in every test in this ticket.
- [ ] Fixtures added: an empty Vault, a schedule naming today, one naming tomorrow only, a multi-point
      schedule, a one-shot for a day already passed, and a Dormant Card with a due date.
