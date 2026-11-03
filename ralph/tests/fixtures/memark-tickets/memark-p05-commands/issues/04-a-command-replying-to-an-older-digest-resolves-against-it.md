# 04 — A Command replying to an older Digest resolves against that Digest

**What to build:** answering Tuesday's list on Thursday ticks Tuesday's box.

Numbers resolve against a specific Digest, per ADR 0021, which put the numbering in code so a number
is a lookup against a footer code wrote and never a parse of model-written prose. A Command sent as a
Telegram reply resolves against the Digest that message holds. A bare Command resolves against the
newest Digest. Telegram carries the reply target for free, so this costs a field read.

The consequence is that classification depends on Vault state: the same words are a Command on the day
their Digest is live and an ordinary message the day after. ADR 0041 recorded that as correct rather
than surprising, and it is written down here so it never reads as a bug.

**Blocked by:** 01 — The strict Command check, and `done N` becomes a Pending Instruction.

**Status:** completed

**Completed at:** 2026-09-04T11:23:21Z

- [ ] A Command sent as a reply to an older Digest message resolves against that Digest's footer and
      not the newest one, and the Task that Digest numbered is the one that closes.
- [ ] A bare Command with no reply target resolves against the newest Digest.
- [ ] The same words sent the day after their Digest was superseded are no longer a Command, and are
      saved and echoed instead.
- [ ] A reply to a Telegram message that is not a Digest is not a Command.
