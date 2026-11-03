# 02 — The Intent Read's own daily limit

**What to build:** the cost of talking has a ceiling, and hitting it makes the system quieter rather
than broken.

The Intent Read runs on every message that is not a Command, so cost is now linear in how much you
talk. ADR 0032 accepted that on purpose and gave it a limit of its own, separate from the answering
limit ticket 07 of phase 9 built. 150 a day, a Vault Setting per ADR 0031, which decided settings have
three homes and put a number the Vault's owner tunes in the Vault.

It is counted on attempt rather than on success, because a call that failed still cost the read. It
resets at local midnight. It is said once on the day it is reached, not on every message after, because
a warning repeated twenty times is a warning nobody reads.

Past the limit the system drops back to what it did before this phase: it saves the message whole and
echoes it. Nothing is refused and nothing is lost. A typed `done 2` still ticks a box, because the
Command check runs before the limit is consulted and costs no model call. A limit that turned the
system off would be worse than the cost it saves.

Reuse the counting the answering budget already does rather than writing a second one. Two counts, one
mechanism.

**Blocked by:** 01 — The receipt order, and the first change end to end.

**Status:** completed

**Completed at:** 2026-09-09T21:19:25Z

- [ ] The cap is a Vault Setting with a default of 150.
- [ ] The count rises on attempt, including on a call that raises, and resets at local midnight.
- [ ] The message that says the cap is reached is sent once on that day and not repeated.
- [ ] Past the cap a message is saved whole and echoed, and no Intent Read call is made.
- [ ] Past the cap a typed `done 2` still resolves and still ticks a box.
- [ ] The answering budget and the Intent Read budget are counted separately and neither spends the
      other.
