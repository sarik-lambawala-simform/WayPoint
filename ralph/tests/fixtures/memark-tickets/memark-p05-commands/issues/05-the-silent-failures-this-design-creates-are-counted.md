# 05 — The silent failures this design creates are counted

**What to build:** the one new way this phase can fail quietly is a number you read every evening.

A Pending Instruction that is written and never applied is invisible in the chat, because the reply
already said "will". ADR 0035, which kept the bot writing the inbox and never a Card, named that as the
cost of the shape and asked for it on the Health Canary. This is the deferred number from phase 4.

An action code the run does not recognise is left alone rather than guessed at, and counted. ADR 0026
holds the closed list of `pending::` values, and leaving an unknown one alone is what makes an old build
meeting a new code fail loudly instead of quietly doing nothing.

A Pending Instruction whose target line changed on disk is dropped rather than forced, per ADR 0009,
which requires every write to be applied against recorded expected state. The run still commits the
rest, and the path is named, the same way a Stale Target is handled today.

**Blocked by:** 02 — The next run applies `close-task` with code alone.

**Status:** completed

**Completed at:** 2026-09-04T11:39:17Z

- [ ] A Pending Instruction written and never applied is reported on the Health Canary as a count.
- [ ] A block carrying an action code the run does not recognise is left alone, the block is not
      marked applied, and the Canary counts it.
- [ ] A Pending Instruction whose target line changed on disk is dropped, the run commits the rest of
      the pass, and the count the Canary already carries for a stale target moves.
- [ ] The count is zero on a run that applied everything, and the Canary shows no line for it.
