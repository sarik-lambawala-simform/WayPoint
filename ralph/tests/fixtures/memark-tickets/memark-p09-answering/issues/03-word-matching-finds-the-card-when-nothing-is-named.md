# 03 — Word matching finds the Card when nothing is named

**What to build:** "what did I say about the flat in Camden" finds the right notes without naming
anybody. Where a message names no subject, word matching over the Vault ranks what to read.

Ranking is BM25 through SQLite's FTS5 with the porter tokenizer, per ADR 0028, which decided that
conversation finds Cards by matching words. FTS5 rather than a third-party package, because it ships
with Python and this system has to survive years of neglect.

The unit is one Card and one Capture. The Card unit is the Card body with its closed Task lines
stripped, by the same function the filing call already uses, in `memark/vault/view.py`, per ADR 0034,
which hid a closed Task from every model call. `areas/loose-ends.md` is the reason it matters here: it
is the one Card guaranteed to be a grab bag of unrelated vocabulary, it can never shrink, and left
whole it becomes a permanent noise floor that outranks the Card holding the answer.

The inbox must be in the corpus. For a large class of questions the raw Capture is the only place the
answer exists.

Three things are deliberately not in the corpus. The Registry, because a row is about twenty tokens
built to stop duplicates and is too thin to match a message that names nothing. The journal, per
ADR 0027, which made the journal written and never read. And Date Files, because a line is a name, a
few words, a schedule and a tier, too thin to rank and noisy when it does. Dated lines are reached by
two exact paths instead, by subject name and by date, which are tickets 08 and 10.

No index is stored, so there is no refresh question. It is built inside the call, held in memory and
discarded on return. Measured at 400 Cards it is about 27 ms in total. Nothing can go stale because
nothing persists, so ADR 0020, which derived state from files the system already writes, is untouched.
A Card I edited by hand ten seconds ago is in the next search.

**Blocked by:** 01 — A Question about a named subject is answered, and still saved.

**Status:** completed

**Completed at:** 2026-09-08T19:03:38Z

- [ ] A message naming nothing but sharing distinctive words with one Card is answered from that
      Card, and that Card's Captures are cited.
- [ ] A Card carrying closed Tasks has those lines nowhere in the Lookup's corpus, while the lines are
      still in the file.
- [ ] A Card edited on disk between two messages is matched on its new words by the second message,
      with no refresh step of any kind.
- [ ] An inbox Capture that shares words with the message is a matchable unit in its own right.
- [ ] No Registry row, Journal Entry or Date File line is in the word-matching corpus.
- [ ] No index file is written anywhere in the Vault or on the box.
