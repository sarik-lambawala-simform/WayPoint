# 06 — Recall reads its window whole, and ranks nothing

**What to build:** Recall's prompt holds the window's date material, all of it, and no Cards.

Decided in
[ticket 11, what Recall does when nothing ranks](../../memark-p09.6-decisions-only-you-can-make/issues/11-what-recall-does-when-nothing-ranks.md),
parts 1 and 2, and carried as an amendment on ADR 0033. Do not re-argue it.

**The arithmetic nobody had done is what settled this.** ADR 0043 measured Captures at near 2.7 MB
after five years at ten messages a day. That is about 1.5 KB a day, near 375 tokens. A week is about
2,600 tokens. A month is about 11,000. A year is about 135,000. There was never anything to rank.

**The prompt holds date material only.** The Captures inside the window and the Date File lines it
covers. **No Cards.** ADR 0033 already says Recall is a second function beside Lookup rather than a
mode of it, and this is that sentence paid for in the prompt. A month of Captures on its own is about
11,000 tokens, so a Recall answer costs a fraction of a Lookup answer's 30 cents rather than slightly
more than it.

The cost of that split is accepted and named: a question half when and half what, like `what did I
decide about the flat that week`, gets the window and never `places/flat.md`. That is the Intent
Read's problem rather than Recall's, because a question about a topic is a Lookup and always was. It
is fog on the map and it is out of this phase.

**A range is read whole.** The date is the filter and nothing else cuts. The 40 block cut goes.
Ranking was rejected for ADR 0043's own reason: a picker in the one place ADR 0043 argued a picker is
always wrong. `that week in April` fails the way `Italian food` failed, because a day's Captures
rarely carry the words the question uses, and ADR 0033 wrote that down itself, in the sentence that
word matching does not degrade here but fails outright.

**So `ranking.py` gains no third caller.** Its one caller stays `tasks.the_task_said`.

**What did not change.** One named day is read whole. A window with no stated width is three days
either side. Date File lines stay out of the Lookup's material. An inert line is returned and stated
for what it is. The journal stays out.

**Blocked by:** 01 — Word matching leaves the Lookup.

**Status:** completed

**Completed at:** 2026-09-14T18:30:13Z

- [ ] Recall's prompt holds the window's Captures and its Date File lines, and no Cards.
- [ ] Every Capture in the window is in the prompt. Nothing is cut.
- [ ] The 40 block cut is removed.
- [ ] `ranking.py` gains no caller from Recall.
- [ ] One named day is still read whole.
- [ ] A window with no stated width is still three days either side.
- [ ] An inert dated line inside the window is returned and stated for what it is.
- [ ] The journal stays out.
