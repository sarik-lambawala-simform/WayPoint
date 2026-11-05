# 09 — The routing rule is written down

**Type:** task

**Status:** completed

**Completed at:** 2026-09-17T09:26:17Z

**Blocked by:** none

**What to build:** the documents that govern the answering path say that a window no longer decides
whether a Card is read, so the code in issue 10 is written against an authority rather than ahead of
one.

## Why the documents go first

[Ticket 03](03-a-question-that-names-a-festival-never-reaches-the-cards.md) is a decision, and in
this repo a decision lives in an ADR and the code cites it. An ADR amended after the code is a record
of what somebody built. Amended before it, it is the reason they built it. Ticket 02 makes the same
call for its own amendment and this issue follows it.

## What to change

**ADR 0033, a day is recalled from its Captures. Amended, not superseded.** Recall stays a second
function beside the Lookup, which is what the ADR decided and what stays true. What changes is that a
window no longer decides whether the Cards are read. Carry the one line rule and the three branches:

> The Cards go in the prompt unless the message names a time and nobody.

- The Intent Read named a subject: every Card goes in the prompt, and where code also resolved a
  window, that window's Captures and Date File lines go in beside them, answered by one call.
- The Intent Read named no subject and code resolved a real window: Recall as it is today, the
  window's material and no Cards.
- There was no reading at all, which is `subjects is None` and not an empty list: the Cards go in.
  Where nothing is known about the message the box reads more rather than less.

State the last row of ticket 03's table in the amendment, because it is the one nobody had seen: an
occasion **on record** hid the Cards the same way a missing one did, and a fix written for the
missing date alone would have left it.

**ADR 0043, the model reads the whole Vault.** Its rules never covered a question that carries both a
window and a subject. Add that case: such a question reads every Card too, and the window's material
joins the prompt rather than replacing it.

**Say why the window stays code's.** Both amendments record that the days are never the model's to
choose. A model picking its own days has nothing to place Diwali with except its own memory of when
Diwali falls, which is what ADR 0012, a date the agent found is confirmed by the human, refuses and
what [ticket 04](04-a-festival-date-is-never-the-models-to-know.md) is filed against. Ticket 04 stays
fixable only while the window belongs to code.

**`CONTEXT.md` line 395.** The Recall entry says its prompt holds the date material and no Cards.
That is no longer true for a question that also names a subject. No term is renamed and no new term
is added.

**`docs/stack/dates.md` and `docs/stack/search.md`** carry the routing path, because those are the
files a session working on dates or on the Lookup reads before it writes.

## Done when

- [x] ADR 0033 carries the amendment, marked as an amendment and not a supersession.
- [x] ADR 0043 carries the case of a question with both a window and a subject.
- [x] Both name ADR 0012 as the reason the days stay code's.
- [x] `CONTEXT.md` line 395 no longer says Recall's prompt holds no Cards in every case.
- [x] `docs/stack/dates.md` and `docs/stack/search.md` describe the three branches.
- [x] The p09.6 map's fog patch **How a question that is half when and half what gets routed** is
      cleared with a pointer to ticket 03.
- [x] No ADR is superseded and no new ADR is written.
