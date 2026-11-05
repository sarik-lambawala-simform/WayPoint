# 05 — Filing is batched, and a bad batch costs only its own Captures

**What to build:** I come back from a week away, the backlog files itself, and one bad model response
costs me a handful of Captures rather than the whole week.

Captures are filed in fixed batches within one run, each batch its own call, per ADR 0023, which decided
filing is chunked for failure isolation rather than for context. The window was never the problem: two
hundred Captures is an order of magnitude inside the cheap tier's. The problem is that one malformed
response drops the whole backlog back to undrained, where the next run makes the same call and fails the
same way, which is a permanent stuck state wearing the costume of a self-healing retry. So a failed
batch costs its own Captures and no others, and the run still ends in the single commit ADR 0004
requires.

Batches are taken in file order, which ticket 01 built the queue for. Two batches cannot see each other,
so both may propose the same new subject. The Registry check ticket 03 put in code is what saves them:
the second proposal extends the Card the first one created. On an ordinary day that collision is rare,
and on seeding day every subject is new, so it is the main path on the first day the code runs in anger
rather than an edge case.

A model call that fails outright is quiet and self-healing. It says nothing at the time, does no work,
leaves its Captures undrained, and the next filing run three hours later retries them. A failed batch is
not a stage failure. Turning the API key off for an afternoon and back on should cost nothing but time.

**Blocked by:** 03 — Code resolves the subject: extending a Card, and Loose Ends; 04 — Every refusal on
the write path.

**Status:** completed

**Completed at:** 2026-09-01T09:16:52Z

- [ ] A backlog spanning several batches where one batch returns malformed output commits the other
      batches, and only the failed batch's Captures remain undrained.
- [ ] Two batches drawn from a single inbox file are taken in file order.
- [ ] Two batches in one run each proposing the same new subject produce one Card and one Registry row.
- [ ] A model call that fails outright commits nothing, leaves every Capture undrained, and sends no
      message.
- [ ] A second run over that Vault files the Captures the failed run left, with no code path that
      remembers the failure.
- [ ] The batch size is a setting rather than a literal at the call site.
- [ ] The whole multi-batch run still ends in exactly one commit.
