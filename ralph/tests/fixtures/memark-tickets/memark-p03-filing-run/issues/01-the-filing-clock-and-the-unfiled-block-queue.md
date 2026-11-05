# 01 — The filing clock, the unfiled-block queue, and the Parked bound

**What to build:** the run learns when to file and what to file, and makes no model call at all doing
it. Two Box Settings per ADR 0031, which puts a per-box number in the environment rather than in the
Vault: the run interval stays five minutes and a filing interval of three hours joins it. The run takes
the lock every five minutes as it already does, and reaches for filing only when the filing clock says
so. One entry point, one lock, one code path, which is what ADR 0024 protects and what the whole test
seam rests on.

The queue is a file read and nothing more. Filing scans the whole inbox for blocks carrying no `filed::`
field, per ADR 0037, which decided that an unanswered question is parked and never abandoned, so there
is no time bound on the scan at all. A thought from a year ago that never got filed is still in the
queue this afternoon. Blocks come back in file order, because ADR 0023 was amended to require it: the
seeding interview writes all of one subject's Captures together, and that only lands them in the same
batch if batching follows the file.

The bound is on asking rather than on time. An unfiled block carries `shown:: N`, counting the Digests
that have asked about it. At fourteen, code writes `filed:: parked` and the block leaves the queue for
good. Nothing is deleted and nothing moves: the words stay in the block, stay in the Lookup corpus and
stay reachable by date. Phase 4 increments the count and reports how many blocks are parked. This ticket
writes the mark and honours it.

No model client is called anywhere in this ticket, so every test here asserts zero calls, which is the
one call-count assertion the testing rules allow.

**Blocked by:** None, can start immediately.

**Status:** completed

**Completed at:** 2026-09-01T07:56:44Z

- [ ] A run inside the five-minute run interval but outside the three-hour filing interval makes no
      model call.
- [ ] A run with no undrained Captures makes no model call and no commit.
- [ ] Both intervals are Box Settings read from the environment, with the five-minute and three-hour
      defaults, and a bad value fails at startup rather than at the first run.
- [ ] An inbox file from a year ago carrying an unfiled block is found by the scan, which is the whole
      of ADR 0037.
- [ ] A block already carrying a `filed::` field is never in the queue.
- [ ] The queue is returned in file order, and the order is asserted on a single inbox file holding more
      blocks than one batch.
- [ ] A block reaching fourteen asks has `filed:: parked` written by code, and its text, its position
      and its `shown::` count are otherwise untouched.
- [ ] A block carrying `filed:: parked` is not in the queue on the next run.
- [ ] Two fixtures are added: an inbox block sitting at `shown:: 14`, and a backlog spanning several
      batches inside one inbox file.
