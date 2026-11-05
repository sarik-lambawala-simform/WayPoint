# 07 — The question that counts the whole Vault

**Type:** grilling

**Status:** resolved

**Blocked by:** none. Related to ticket 06 and not blocked by it: 06 asks who picks what is read, and
this asks what happens when the right answer is everything.

**Raised by:** the human, during ticket 05's session, 2026-09-10.

**Ticket 06 is resolved and this is what it expects of this one.** Agentic read is now ADR 0028's middle
rung, between link-graph reordering and embeddings, and its amendment says plainly that the rung does not
answer an aggregate question and hands the class here. So this ticket cannot answer with "wait for a
better picker": every picker on that ladder is now argued and none of them counts. Ticket 06 also left
the sources line for a roaming read unsolved on purpose, and question 4 below is the same question, so
whatever this ticket decides about the line for a whole-Vault pass is the first word written on it.

## The question that broke

> How many people have ever gifted me something throughout my life, and who are they?

Nothing in the box answers this, and the human's own diagnosis was that BM25 has no way to search it.
That is half of it. The other half is what the reply looks like when it fails.

## Why it fails, precisely

**The words are not there.** `gifted` is not what a Capture says. A Capture says `Mummy brought me a
saree`, `Nikhil gave me a watch for my birthday`, `Priya got me that book`. ADR 0028, conversation
finds Cards by matching words, writes this weakness down itself and dates it: word matching cannot
match on meaning, and its own example is that `am I being unfair about this?` shares no word with a
Card about arguing with your mother. This is the same failure with a countable answer attached.

**And the reply carries no warning, because nothing was cut.** This was checked in session and it
inverts the obvious worry. `ranking.py` cuts nothing: every unit that matched at all comes back,
ranked, and there is no top-k. So a `Cut` never appears in the sources line here, and a `Cut` is the
one thing in the reply that says "there was more than I read". The box therefore returns the complete
set of what the *words* reached, states its sources honestly, and says **two people**, when the true
answer was nine. Completeness over the matched set reads exactly like completeness over the answer.

That is the failure this spec refuses everywhere else, in ADR 0028's own words about the rejected
cheap-model pre-pass: when it picks wrong the answer still reads fine. Here it does not merely read
fine. It reads sourced.

**No rung on the ladder fixes it.** ADR 0028's escalation path is kind filtering, then shorter
descriptions, then BM25 expansion order, then link-graph reordering, then embeddings. Every rung is a
better **picker**. An aggregate question has no picker answer, because its correct material is *every
Card, checked*. Embeddings would find the saree and the watch and would still be ranking rather than
counting, and would still have no way to say what it missed. Ticket 06's agentic read has the same
shape: it reaches more by meaning and still cannot promise it saw everything, so it buys a wrong count
at a higher price.

## What is not in dispute

**The data is there.** A gift line is on the giver's Card with a `from::` link to the Capture, per
ADR 0026, a Card line has a fixed grammar. Nothing was lost. The Vault holds the answer and the
Lookup cannot assemble it.

**This is a class, not one question.** `who have I not spoken to in a year`, `how many times have I
said I would start running`, `which people do I only ever contact when I need something`. Each needs
every Card considered and a number returned. The Reflection is the only step that reads a whole window
today, and it reads seven days, not a lifetime, and it reports rather than answers.

## Question

1. **Does the Intent Read learn to recognise an aggregate question,** and what happens then. ADR 0032,
   intent is read by a model and applied by code, already reads the question's meaning, so the
   classification has a home. The four routes costed so far:

   - **Refuse and say what it did.** The box says it cannot count across the whole Vault, then answers
     with what the words reached and states plainly that this is a word match and not a count. Costs
     nothing, ships now, and is the only route that never returns a confident wrong number.
   - **A whole-Vault pass.** Code streams every Card past the model in chunks and code sums the
     result. ADR 0002, deterministic code selects what the model sees, is satisfied rather than bent:
     code still selects, and what it selects is everything. Total coverage, stated cost, cost grows
     with the Vault.
   - **Structured fields at filing time.** A gift becomes a Line Field, `gift::`, so code counts it by
     grep. Needs the categories a person will one day want to count to be guessed years earlier, and a
     category chosen wrongly at filing time is the invisible wrong pick moved upstream, where it is
     harder to see.
   - **Leave it.** Record that the class exists and that the box does not answer it.

2. **Whether refusal is a separate reply shape,** and what it says. It cannot be the miss line: nothing
   was missing, the words simply did not reach the lines. Ticket 01 put one plain sentence on the answer
   rather than on the echo for the same kind of case, so there is a precedent to follow or to depart
   from on purpose.

3. **If a whole-Vault pass is adopted, what stops it running by accident.** A misread aggregate on an
   ordinary question would read the whole Vault to answer `what did Priya say about the flat`. A cap, a
   confirmation, or a Digest report of how often it fired.

4. **What replaces the sources line for it.** ADR 0028 requires one short line naming what was read,
   and it is short because the pick is short. `read all 412 Cards` is short and says nothing about
   which two carried the answer. Ticket 06 has the same open question about a roaming read, so the two
   should be answered together or one should defer to the other.

5. **Whether the twenty-message test covers it.** ADR 0028's named falsification is twenty real
   messages with the notes each should find. An aggregate question has no notes it should find, it has
   a number it should return, so it may need a second list with expected answers rather than expected
   sources.

Invoke `/mattpocock-skills:domain-modeling` alongside the grilling. If the aggregate question becomes
a thing the box recognises, `CONTEXT.md` needs a word for it, beside `Lookup`, `Recall` and
`Reflection`, none of which is this.

## Answer

Yes, the box answers it, and the reason is that the question it was built on has gone. The Lookup
stops matching words. Code puts the whole Vault in the prompt and the model reads it.

**The picker was a workaround for a window that no longer binds.** ADR 0028 chose BM25 when the
material had to be cut down before a model could see it. Today `claude-sonnet-5` holds 1,000,000
tokens at $2 per million, and `memark/answering.py:201` already runs on that tier. A Vault of a few
hundred Cards is about 600 KB after five years, near 150,000 tokens, which is 15% of the window at
about 30 cents a question. Cards grow near 120 KB a year, so filling the window takes about 30
years. Every rung on ADR 0028's ladder exists to pick well. Nothing needs picking.

**This is not the counting question, it is the whole weakness.** The session opened on
`how many people have ever gifted me something` and moved to `when was the last time I had Italian
food`, which fails before any counting starts: `pasta` and `Italian food` share no word and no stem.
ADR 0028 wrote that weakness down itself. So the fault was never the aggregate class. It was word
matching, and the aggregate question is only where the wrong answer reads as a sourced one.

**The decisions, in the order they were taken.**

1. **Word matching goes from the Lookup.** Not kept as a cheap first try. A first try needs code to
   judge whether the match found enough, and that judgement is the invisible wrong pick this ticket
   is about. `pasta` scores as a clean miss, so the cheap path would read everything anyway.

2. **One full read, no tool loop.** Code assembles the prompt and the model answers in one call. A
   grep loop cannot fix the meaning gap, because the model must guess the word before it greps:
   `pasta`, maybe `pizza`, never `that place on Linking Road`. It is also many round trips, and the
   box has no tool loop anywhere, so it is a new class of machinery bought for a picker that was
   just deleted. ADR 0002, deterministic code selects what the model sees, is satisfied rather than
   bent: code still selects, and what it selects is everything.

3. **All Cards always, Captures by link.** Captures are the part that never stops growing, near
   2.7 MB against 600 KB of Cards after five years at ten messages a day. A Card is the distilled
   Capture, so reading every Card already sees every fact worth keeping. A Capture is pulled only
   when a Card line the answer used points at it, and code follows the `from::` link. That is not a
   picker: the link is already written in the file and there is nothing to guess wrong.

4. **Plus every Capture no Card line points at.** This closes the hole rule 3 opens. A Parked block
   per ADR 0037, an unanswered question is parked never abandoned, a claim refused per ticket 02, a
   Part Drained leftover per tickets 03 and 08, and everything filed since the last run all share one
   property: nothing links to them. One rule covers all four, with no window and no setting. The
   reader already exists, because ticket 08 decided to read every `from::` link in the Vault on every
   run. The set is small, maybe 75 KB after five years.

5. **The box returns a number, with the list it counted.** This amends question 2 of this session,
   which had answered no while the box still read a slice. It now reads everything, so a count is a
   claim it can keep. The list stays beside the number because counting across 150,000 tokens is the
   one job a model reading long context is weakest at, and a number with its working shown is
   checkable while a bare number is not.

6. **The sources line names the Card lines the answer used, and code writes it.** This is ADR 0028's
   open question for a roaming read, which ticket 06 deferred here, and it is answered for both.
   `read all 412 Cards` is short and says nothing. Rule 3 already makes the model name the lines it
   used, so code takes those names, confirms each exists in the Vault, drops any it invented, and
   writes the line. ADR 0028's rule that code writes the line and the model never does is kept, and
   the shape is ADR 0032's, intent is read by a model and applied by code. Dropping the line was
   rejected: an answer with no sources line reads as more confident, not less.

7. **Cost is paid, not capped.** Near 30 cents a question, so ten a day is about $90 a month before
   caching. A cap was rejected because it is a second code path that fires on the worst day and falls
   back to the thing this ticket deletes. The lever if the bill hurts is reading fewer Captures, not
   guessing again.

**What this costs and what is not solved.** Caching is the open cost question and it is a design, not
a hope. Cached tokens cost a tenth but a write costs 1.25x, and filing runs eight times a day, so a
naive cache is more expensive than paying. It works only if the prompt is ordered stable first with a
breakpoint, old Cards ahead of today's inbox, so a filing run changes only the tail and the prefix
survives. Cards get edited in the middle, so the ordering is real work. `docs/stack/anthropic-api.md:22`
says caching does not help at v1 size, and that line is now wrong.

The accuracy question is real and is measurable rather than argued. A model reading 150,000 tokens is
weaker at finding one small fact in the middle. The Vault is named Cards with headings rather than a
blob, which helps, and ADR 0028's twenty-message test is already the named falsification, so it
becomes the gate on this. The condition written down rather than built: if the read ever passes about
half the window, this decision is reopened.

**What happens to ADR 0028.** It is superseded, not deleted. 55 files reference it, 16 of them in
`memark/` and 10 of them other ADRs, and deleting it would leave the next person to re-argue BM25 with
no record that it was tried. Status becomes superseded, body untouched. Ticket 06 is reopened and its
ladder amendment reverted: its answer put agentic read on a ladder as a rung nobody climbs, and the
finding here is that there is no ladder. Ticket 09 carries the new ADR.

**`CONTEXT.md` gains no word.** The ticket expected one for the aggregate class, beside Lookup, Recall
and Reflection. A box that reads everything answers these as ordinary questions, so there is no class
left to name. The Lookup's own entry changes instead, because it no longer ranks.
