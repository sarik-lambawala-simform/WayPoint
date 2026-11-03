# 03 — Several Commands travel one per line, all or nothing

**What to build:** a batch you type one-handed either lands whole or does not land at all.

Every line of the message must be a fully resolving Command. If one line is not, the whole message
takes the other path, per ADR 0041, which refused to cut a message into a Command half and a prose
half. Same-line batching is not accepted, because a verb carrying an open name tail cannot be split
without guessing where the name ends.

The point of all or nothing is that a mistyped line can never leave half a message applied. A half
applied batch is the worst outcome available here: you would have to work out which half, and the
system's whole claim is that you never have to.

**Blocked by:** 01 — The strict Command check, and `done N` becomes a Pending Instruction.

**Status:** completed

**Completed at:** 2026-09-04T10:57:58Z

- [ ] A two-line message where both lines fully resolve writes both Pending Instructions, and the next
      run applies both.
- [ ] A two-line message where one line does not resolve writes no Pending Instruction at all, and the
      message is saved and echoed like any other sentence.
- [ ] Two Commands on one line are not a Command.
- [ ] A blank line between two good lines does not stop the message being a batch.
