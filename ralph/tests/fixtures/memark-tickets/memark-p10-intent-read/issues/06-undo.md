# 06 — `undo`

**What to build:** one word takes back everything the last message did. Acting on your words is safe
because it is reversible.

This is the third of ADR 0032's three guards, and the three only work together: exact match or nothing,
nothing happens silently, one word takes it back. Weaken any one and the other two stop being enough.

`undo` is deliberately not a `pending::` action code, per ADR 0026, which holds the closed list. It is
not an instruction to apply later. Code looks for an unapplied Pending Instruction on the last message
and deletes it, and reverts the last commit when there is none. Making it wait on the same clock as
everything else would be the opposite of what it is for.

Because the bot writes the inbox and never a Card, per ADR 0035, an `undo` sent within the run interval
almost always lands before anything reached disk. The reply says which it did, so you know whether the
Vault ever changed.

The unit of reversing is the message, not the change. `undo` takes back everything the last message
did, including the parts that landed while another part was refused. Anything narrower is an ordinary
sentence and goes through the Intent Read like everything else.

`undo` fires on sight and takes no number, per ADR 0041, which decided a typed Command is recognised by
what it resolves against. `undo 4` is not a Command, because `undo` takes nothing, so it goes to the
Intent Read.

**Blocked by:** 01 — The receipt order, and the first change end to end; 05 — Many intents in one
message.

**Status:** completed

**Completed at:** 2026-09-09T22:29:13Z

- [ ] `undo` sent after a Pending Instruction is written but before a run applies it deletes the
      instruction, and a test asserts nothing ever reached a Card.
- [ ] `undo` sent after a run applied the change reverts the last commit.
- [ ] `undo` after a message that made several changes takes back all of them.
- [ ] The reply says whether the change was caught before it reached a file or reverted after.
- [ ] `undo 4` is not read as a Command and goes to the Intent Read.
