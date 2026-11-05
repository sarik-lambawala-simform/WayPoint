# 09 — Recall's sources line says what was read, not what was used

**What to build:** one line under a Recall answer naming the material it read.

Decided in
[ticket 11](../../memark-p09.6-decisions-only-you-can-make/issues/11-what-recall-does-when-nothing-ranks.md),
part 5, and carried as an amendment on ADR 0033. Do not re-argue it.

One line, like this:

```
read all 37 notes and 2 dated lines from 1 to 7 April
```

**It says what was read, because nothing is cut.** Completeness is the true statement here and there
is nothing to hide behind.

**ADR 0043's shape does not transfer.** That one names the exact Card lines the answer used. A Recall
answer has no Card lines at all, and naming Capture anchors like `inbox/2026-04-03#^c118` puts a
dozen ids that mean nothing by eye into a Telegram reply.

**Code writes the line and the model never does.** That is ADR 0028's rule, kept by ADR 0043 and kept
here.

Notes and dated lines are counted separately, because they are different things: nobody sent a dated
line.

**Blocked by:** 06 — Recall reads its window whole, and ranks nothing.

**Status:** completed

**Completed at:** 2026-09-14T19:13:43Z

- [ ] Every Recall answer carries a sources line.
- [ ] It names what was read, with the window's dates.
- [ ] It counts notes and dated lines separately.
- [ ] Code writes the line. The model's own prose never becomes it.
- [ ] A widened answer's line reflects the window actually read, and issue 07's widening statement is
      still made.
