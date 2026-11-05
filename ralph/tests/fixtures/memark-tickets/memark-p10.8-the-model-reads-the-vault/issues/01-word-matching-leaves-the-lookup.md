# 01 — Word matching leaves the Lookup

**What to build:** the picker is removed from the Lookup's path, and nothing replaces it.

Decided in
[ticket 07, the question that counts the whole Vault](../../memark-p09.6-decisions-only-you-can-make/issues/07-the-question-that-counts-the-whole-vault.md),
rule 1, and written down as **ADR 0043, the model reads the whole Vault**. Do not re-argue it.

Word matching is not kept as a cheap first try. A first try needs code to judge whether the match
found enough, and that judgement is the invisible wrong pick this phase exists to remove. `pasta`
scores as a clean miss against `Italian food`, so the cheap path would read everything anyway and the
only thing the first try buys is a second place to be wrong.

**`ranking.py` is not deleted.** ADR 0043's rule 1 says no word matching *on the Lookup*.
`tasks.the_task_said` is a second caller with a corpus of its own, open Task lines, which is exactly
the corpus needed to close a Task by prose. Deleting the module would break phase 10 issue 04.

**The exact path stays.** Named Cards, Registry rows matched exactly and by `aka::` alias, the
Ambiguous Subject question and the misheard-name check are all unchanged. What goes is the ranked
half that runs after them.

**The miss line keeps its check and builds no index.** Asking whether any unit of the corpus carries
a word is a boolean, and code already holds the text. Ticket 09 found this and it is the reason the
miss line survives the deletion.

This issue is the removal only. Issue 02 is what takes its place.

**Blocked by:** none.

**Status:** completed

**Completed at:** 2026-09-14T16:35:23Z

- [x] Nothing on the Lookup's path calls `ranking.py`.
- [x] The per-call search index is no longer built for a Lookup.
- [x] `ranking.py` still exists and `tasks.the_task_said` still calls it.
- [x] Closing a Task by prose still works, per phase 10 issue 04.
- [x] The exact path is unchanged: named Cards, aliases, Ambiguous Subject, misheard name.
- [x] The miss line still fires on a name nothing in the Vault carries, with no index built.
- [x] No new code cites ADR 0028. It is superseded.
