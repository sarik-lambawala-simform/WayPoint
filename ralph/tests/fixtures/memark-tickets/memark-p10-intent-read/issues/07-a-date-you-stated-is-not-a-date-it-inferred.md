# 07 — A date you stated is not a date it inferred

**What to build:** a date you typed in words stops waiting for tomorrow's Digest, while a date the
model worked out still asks.

The test is one code can run and does not need a model: does the message literally contain a date? If
it does, you stated it. The Review Date is confirmed at once, the reply names the exact date in full
rather than echoing your shorthand, and `undo` reverses it. If it does not, the model inferred it, so it
becomes a Proposed Date and the Digest asks, per ADR 0012, which decided proposed dates are confirmed by
the human. ADR 0012 survives intact for the case it was written about.

This is ADR 0032's one test for what asks first, applied to dates. If the reply names it and `undo`
reverses it, it happens. If reversing it later would mean noticing it happened at all, it asks. A date
you never mentioned is exactly that second case.

A date lands in a date-indexed file, per ADR 0011, and a stated correction replaces the old line rather
than marking it `x`, because the old line was never true and a struck line would read as a thing that
happened and then did not.

**Blocked by:** 01 — The receipt order, and the first change end to end.

**Status:** completed

**Completed at:** 2026-09-09T22:58:33Z

- [ ] A message containing a literal date confirms the Review Date at once and the reply names the
      exact date in full.
- [ ] A message implying a date without containing one raises a Proposed Date, applies nothing, and the
      Digest asks about it.
- [ ] The literal-date test is code and makes no model call.
- [ ] A correcting confirmation replaces the old Review Date line rather than marking it `x`.
- [ ] `undo` reverses a date that was applied at once.
