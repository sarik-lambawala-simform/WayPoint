# 02 — The next run applies `close-task` with code alone

**What to build:** the tick lands. Within five minutes of the reply the Task is closed in the Vault,
and it cost nothing.

This is the five-minute run and not the Filing Run, per ADR 0024 as amended, which split the frequent
cheap clock from the daily speaking one. A run whose only work is a Pending Instruction makes no model
call at all. That is what pays down the cost of a reply that could only promise: the promise is kept in
minutes, for free.

Applying is pure code. The instruction names an action and a target, the target is read, the write is
checked against the state the instruction was written against per ADR 0009, which requires a write to
be applied against recorded expected state, and the run commits once per pass per ADR 0004, which made
git the sync and the audit log.

Closing ticks the checkbox, writes `done:: YYYY-MM-DD` on the line, and moves the line under a `## Done`
heading in the same Card, creating that heading when the Card has none. The block id and the `from::`
link stay on the line. Nothing is moved to an archive file, per ADR 0034, which kept a closed Task in
its own Card so the Capture behind it stays reachable from the Card, and which already hides closed
lines from every model read.

**Blocked by:** 01 — The strict Command check, and `done N` becomes a Pending Instruction.

**Status:** completed

**Completed at:** 2026-09-04T10:48:19Z

- [ ] Send `done 2`, run the run, read the file: the line is ticked, carries `done::` with today's
      date, and sits under `## Done` in the same Card.
- [ ] The closed line keeps its block id and its `from::` link.
- [ ] A Card with no `## Done` heading gains one, and the heading is never on an allowed-headings list.
- [ ] A run whose only outstanding work is a Pending Instruction commits and makes zero model calls.
- [ ] The applied Pending Instruction is not applied twice by the run after it.
