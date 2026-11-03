# 07 — An empty window widens once, by its own width, and then stops

**What to build:** a day that holds nothing gets one wider look, and the answer says so.

Decided in
[ticket 11](../../memark-p09.6-decisions-only-you-can-make/issues/11-what-recall-does-when-nothing-ranks.md),
part 3, and carried as an amendment on ADR 0033. Do not re-argue it.

**The window always triples**, so it is predictable without being read.

- A named day becomes three days either side, which is the width ADR 0033 already uses for a window
  with no stated width.
- A seven day range becomes twenty one days.
- A month becomes three months.

**At most two reads, both chosen by code.** So ADR 0002, deterministic code selects what the model
sees, holds unchanged and no tool loop is built. The model asking for more days was rejected on ADR
0043's three grounds, unchanged by swapping words for dates: round trips while a person waits in
Telegram, a first tool loop bought for one path, and a guess made before the ask.

**If the widened window is still empty the box says so and stops.** It names the window it read and
the widening it did. Widening until something turns up was rejected: an answer about the wrong week
reads exactly like an answer about the right one, which is ADR 0028's rule that finding nothing is an
absolute, and ADR 0033's own rule that an empty day is a fact read from the absence of an inbox file.

**A widened answer always says it widened, and by how much.** A quiet act that is not stated reads
exactly like completeness.

**This interlocks with issue 08.** The widen step is checked against that issue's byte guard: where
widening would cross it, the box does not widen and reports the original window empty. Build them
together.

**Whether one step is enough, and whether tripling is the right width, is reasoned and not
measured.** It is fog on the map and belongs to the measuring pass. Do not change the number here.

**Blocked by:** 06 — Recall reads its window whole, and ranks nothing.

**Status:** completed

**Completed at:** 2026-09-14T18:42:58Z

- [ ] A named day holding nothing is read again as three days either side.
- [ ] A seven day range holding nothing becomes twenty one days.
- [ ] A month holding nothing becomes three months.
- [ ] There are at most two reads, and code chooses both.
- [ ] The answer says it widened and by how much.
- [ ] A widened window still holding nothing makes the box say so, name the window it read and the
      widening it did, and stop.
- [ ] No third read and no tool loop.
