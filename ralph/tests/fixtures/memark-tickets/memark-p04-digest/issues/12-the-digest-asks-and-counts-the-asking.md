# 12 — The Digest asks phase 3's held-back questions, and counts the asking

**What to build:** the questions phase 3 raised and could not answer finally get asked, and the asking is
what eventually parks a block.

Phase 3 holds a Capture back when its subject is ambiguous or its claim contradicts one already in the
Vault, per ADR 0015, which forbids guessing between two Registry rows, and ADR 0010, which forbids
picking a winner between two claims. Both write nothing and wait for the Digest to ask. This ticket is
the asking.

Every unfiled block the Digest asks about gains one on its `shown::` field, and so does every Task shown.
That counter is the one phase 3's parking rule reads: at fourteen, code writes `filed:: parked` and the
block leaves the queue for good, with its words untouched and still searchable. Phase 3 wrote that rule
and honours it. This ticket is what makes the count move.

**Blocked by:** 04 — The caps, the Tasks, and what the Digest did not show.

**Status:** completed

**Completed at:** 2026-09-02T09:14:53Z

- [ ] An Ambiguous Subject held back by filing is asked about in the Digest as a numbered item.
- [ ] A Contradiction held back by filing is asked about the same way.
- [ ] Every unfiled block the Digest asks about has its `shown::` incremented by one, and no block it did
      not ask about is touched.
- [ ] Every Task shown has its `shown::` incremented by one.
- [ ] A block reaching fourteen asks carries phase 3's `filed:: parked` mark on the next run, and the
      Canary counts it.
- [ ] Two Digests on two days move a block's count by exactly two.
