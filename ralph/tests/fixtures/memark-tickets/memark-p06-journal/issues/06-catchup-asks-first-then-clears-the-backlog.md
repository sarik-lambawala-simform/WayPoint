# 06 — `catchup` asks first, then clears the whole backlog

**What to build:** one word closes a gap you can see. Send `catchup`, get asked whether you mean it,
say yes, and the next run writes every past day that has an inbox file and no entry.

`catchup` is one of the three verbs that take no number, so ADR 0041's resolution rule does not reach
it and the ask test decides instead. `undo` and `unpark` fire on sight, because a misfired `undo` is
named in the reply and corrected by a sentence and `unpark` writes no permanent text. `catchup` writes
Journal Entries, and ADR 0027 freezes an entry once written, so a misfire cannot be taken back by the
agent. It confirms.

It is written as a Pending Instruction like every other Command and applied by the next run, per
ADR 0035, which kept the bot writing the inbox and never a Card. So the reply says "will" and no model
call happens on the receipt path. "Everything" is bounded by the inbox rather than by a number: every
past day that has an inbox file and no entry, which means the per-run bound of ticket 04 does not apply
to a run acting on a confirmed `catchup`.

The real cost is the lock rather than the money. Ninety days is ninety sequential strong-tier calls
holding the Vault lock, which is acceptable when you asked for it and is the whole reason the default
stays bounded.

The Canary reports how many entries the catch-up wrote.

**Blocked by:** 04 — Backfill: past days without an entry, oldest first.

**Status:** completed

**Completed at:** 2026-09-07T23:04:47Z

- [ ] `catchup` on its own is answered with a question and writes nothing: no entry, no Pending
      Instruction, no model call.
- [ ] Nothing is written until the confirmation arrives, and a confirmation that never comes leaves the
      backlog exactly as it was.
- [ ] Confirming writes a Pending Instruction on the block, and the reply says "will" rather than
      "did".
- [ ] The next run writes every past day that has an inbox file and no entry, oldest first, past the
      per-run bound.
- [ ] A day with no inbox file is still not written, even by a confirmed catch-up.
- [ ] The Canary reports how many entries the catch-up wrote.
