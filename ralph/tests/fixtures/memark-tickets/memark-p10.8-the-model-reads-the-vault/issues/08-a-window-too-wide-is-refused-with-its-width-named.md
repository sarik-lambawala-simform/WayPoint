# 08 — A window too wide is refused, with its width named

**What to build:** the guard that replaces the 40 block cut, and it is a refusal rather than a
smaller cut.

Decided in
[ticket 11](../../memark-p09.6-decisions-only-you-can-make/issues/11-what-recall-does-when-nothing-ranks.md),
parts 4 and 5, and carried as an amendment on ADR 0033. Do not re-argue it.

**The guard is measured bytes.** Code measures the text it has assembled and refuses past about
500,000 tokens, half the 1,000,000 token window. That is ADR 0043's own reopen condition reused
rather than a number invented here.

At 1.5 KB of Captures a day it is near four years of material, so ordinary use never meets it and
there is no cut on any real window.

**Days were rejected as the unit** because a quiet fortnight and a frantic one hold different
amounts, and code already holds the bytes.

**A refused window answers nothing.** It names the width it will not read and asks for a narrower
one. Reading part of it and staying quiet is the failure both ADR 0033 and ADR 0043 exist to refuse:
a cut you cannot see reads exactly like completeness.

**The widen step from issue 07 is checked against this same guard.** Where widening would cross it,
the box does not widen and reports the original window empty.

**Blocked by:** 07 — An empty window widens once, by its own width, and then stops.

**Status:** completed

**Completed at:** 2026-09-14T18:59:02Z

- [ ] Code measures the bytes it assembled, not a count of blocks or days.
- [ ] A window past about 500,000 tokens is refused.
- [ ] The refusal names the width and asks for a narrower window.
- [ ] A refused window answers nothing. No partial read reaches the person.
- [ ] The threshold lives in one named place.
- [ ] A widen step that would cross the guard does not happen, and the original window is reported
      empty.
