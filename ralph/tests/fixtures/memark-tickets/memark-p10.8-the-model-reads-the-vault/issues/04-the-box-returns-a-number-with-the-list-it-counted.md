# 04 — The box returns a number, with the list it counted

**What to build:** a counting question gets a number, and the number shows its working.

Decided in
[ticket 07](../../memark-p09.6-decisions-only-you-can-make/issues/07-the-question-that-counts-the-whole-vault.md),
rule 5, and written down in ADR 0043. Do not re-argue it.

The box used to answer no to `how many people have ever gifted me something, and who?` and it was
right to, because it read a slice. It now reads everything, so a count is a claim it can keep.

**The list stays beside the number.** Counting across 150,000 tokens is the one job a model reading
long context is weakest at. A number with its working shown is checkable by eye. A bare number is
not, and a wrong bare number reads exactly like a right one.

`CONTEXT.md` gains no word for this. The expectation was a term for the aggregate class beside
Lookup, Recall and Reflection, and there is no class left to name: a box that reads everything
answers these as ordinary questions.

**Blocked by:** 03 — Plus every Capture nothing links to.

**Status:** completed

**Completed at:** 2026-09-14T17:53:07Z

- [ ] A counting question returns a number.
- [ ] The list it counted comes back with the number.
- [ ] The list is as long as the number says.
- [ ] The old refusal to answer a counting question is removed.
- [ ] No new term is added to `CONTEXT.md` for this.
