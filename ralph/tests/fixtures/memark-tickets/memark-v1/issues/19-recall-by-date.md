# Recall by date: retrieving a day, and reading the dates folder at all

Map: [map.md](../map.md)
Type: grilling
Status: resolved

## Question

The Lookup is one function that takes a message and returns Cards and Captures to answer from, ranked
by BM25 word matching over Card bodies and inbox Capture blocks (ADR 0028). It has no notion of time.
Every question it can answer is a question about a topic.

A whole class of question is about a day instead. *"What happened on 3 March?"* *"What was going on
around last Diwali?"* *"How was my mood that week in April?"* The material to answer all of these
exists: the inbox is permanent, append-only, and filed by date (ADR 0001), and it is already in the
retrieval corpus. What is missing is a way to ask for it by when rather than by what.

Word matching does not degrade gracefully here, it fails outright. A day's Captures rarely contain the
words the question uses. "How was my mood on 3 March" ranks on `mood` and `March`, and a Capture saying
"that meeting went badly, knackered" contains neither. This is not the semantic weakness ADR 0028
already accepted with a falsification date on it, which embeddings would eventually fix. A date is a
filter, not a search term, and no amount of better ranking turns one into the other.

The user's framing: *"if I need to recall anything that happened on a certain date, or what happened
during last Diwali, it should infer that and give me a proper answer."* Two cases, and the second is
strictly harder than the first.

## The `dates/` folder is not in the corpus, and nobody decided that

Found while walking a real multi-part question through the Lookup. It is a second blind spot with the
same shape as the one above, and it is arguably the more serious of the two, because it is not a missing
feature but a missing decision.

ADR 0028 fixes the corpus as **Card bodies and inbox Capture blocks**. It then names three things it
declined and argues each: the Registry (too thin), the journal (ADR 0027 says nothing reads it), and a
cheap-model pre-pass (ADR 0002 refuses it). **Date Files are not among the three.** They were not
declined. They were never considered.

The consequence is sharper than it first looks, because ADR 0011 deliberately moved dates *out* of
Cards. A Card holds no date, and learns its dates back only through Obsidian's backlinks, which are a UI
feature rather than text in the file. So for anything dated there is no copy anywhere the Lookup reads.

Worked case. "What did I do about my dentist appointment?"

- The appointment is a line in `dates/2026/09/2026-09-14.md`. Not in the corpus.
- The Dentist Card contains no date. Nothing to match.
- A Capture saying "dentist on the 14th" *is* in the corpus, so a partial answer comes back from the raw
  note.
- A Task, if one exists, is a line in a Card, so `- [x] book the dentist` is findable.
- Invisible in every case: whether the reminder fired, whether a `skip` wrote a `handled::` stamp,
  whether a proposal for it was rejected as an `x` line.

So the answer is assembled from the wrong material and sounds exactly as confident as a right one. That
is the failure mode this spec refuses everywhere else.

Decide:

- **Whether Date File lines join the corpus, and as what unit.** A Card is one unit and a Capture is one
  unit. A Date File is a handful of short lines, closer to a Registry row than to a Card, so it may rank
  badly for the same reason the Registry was declined. Check that before assuming inclusion fixes it.
- **Whether a `?`, `x` or `handled::` line should ever reach an answer.** These are inert, rejected and
  dealt-with respectively. Returning them unmarked would let the system tell you about a date it never
  intends to fire.
- **Whether the answer is retrieval at all.** "Is anything coming up for Priya" may be better served by
  code reading the forward window the Digest already reads, keyed off a resolved subject, than by word
  matching over date lines. That would make it a second function rather than a wider corpus, which is
  the same fork the first half of this ticket faces.
- **Whether ADR 0028 is amended to record the decision either way.** Even if the answer is "Date Files
  stay out", it should be written down with its reason, so it stops being an omission and becomes a
  choice. That alone is worth doing.

## The original question

Decide:

- **Whether the Lookup gains a time dimension, or a second function sits beside it.** ADR 0028 made a
  point of there being one retrieval seam and the spec built v1's Question path through it rather than
  around it. Adding a date filter to that seam keeps one seam. Adding a second function is honest about
  these being different operations. Say which, and whether "one seam" was about the function or about
  the corpus.

- **How a date is extracted from a message, given ADR 0002.** "Deterministic code selects what the
  model sees" means a model must not be the thing that decides which files are read. A date parser is
  ordinary code and fits. "Last Diwali" does not. Decide whether date extraction is code-only with
  everything else falling back to today's word matching, or whether resolving a phrase to a date is a
  narrow, bounded model call whose output is a date that code then uses.

- **How a named event resolves to a past date.** This is the Diwali half and it is where the answer
  probably already exists. Date Files are named after the date and past one-shot files are kept rather
  than pruned (ADR 0011), so a confirmed Diwali line for last year is on disk at a known path. Decide
  whether recall by event name is simply a lookup over Date Files, and what happens when the year in
  question predates the Vault or the Date Request for it was never answered.

- **What a range is.** "That week in April" and "around Diwali" are windows, not days. Decide whether
  ranges are supported, whether a window around an event has a fixed width, and what happens when a
  range covers more Captures than one answer can hold.

- **What the answer is composed from, and whether the journal is still excluded.** ADR 0027 keeps the
  journal out of every corpus because model-written prose is lossier than its source and cannot be
  cited. That reasoning is untouched by this ticket and the answer should be built from the day's
  Captures. But note the irony plainly: the Journal Entry is the one artefact in the Vault that is
  *already* a narrative of a day, and this is the first feature that would obviously want it. If the
  answer is still no, say why in a way that survives being asked a third time. ADR 0027 named Reflection
  as its pressure point and this is a second one it did not anticipate.

- **What an empty day says.** Every day has a Journal Entry, including days you sent nothing (ADR
  0027). So the system always knows the difference between a quiet day and a broken run, and a recall
  answer should be able to say "you sent nothing that day" as a fact rather than as a failure to find.
  Decide whether the entry's existence is read as a signal even though its contents are not, and whether
  that counts as reading the journal.

- **What it costs and where it runs.** A Question is one call on the stronger tier in the hot path,
  about two cents (ADR 0013, ADR 0028). A date-scoped answer may feed a whole day of Captures into that
  call rather than a handful of ranked hits. Check the cap of roughly forty answered messages a day
  still holds, and whether a range makes the input unbounded.

- **Whether an intent call at receipt subsumes the date-extraction question.** [Ticket 21](21-intent-at-receipt.md)
  proposes a model call per message that classifies intent and decides what to do. If that lands, "extract
  a date or an event name from this message" is one of the things it already does, and this ticket's
  second and third bullets become its output rather than a separate mechanism. What does not move is the
  retrieval side: something still has to take a resolved date and return that day's Captures, and no such
  function exists. Settle this ticket's *retrieval* half regardless of how 21 lands.

Likely amends ADR 0028 twice over, and touches ADR 0011 and ADR 0027 at least to restate why the journal stays out. May need a
new ADR. Feeds the same spec amendment as [ticket 18](18-one-message-many-intents.md).

## Answer

**A day is recalled from its Captures, never from a summary of it.** That one sentence carries both
halves of this ticket and both refusals inside it.

**The seam.** Recall is a second function beside the Lookup. It takes a date or a pair of dates and
returns what the Vault holds for that window: the Captures sent in it and the Date File lines it
covers. The ticket asked whether "one seam" was about the function or the corpus, and it is about the
corpus. ADR 0028's rule exists to stop conversation's ranking being pointed at what filing sees,
because that would trade a hard no-duplicate guarantee for a top-k that can miss. Reading files by date
touches no corpus and forfeits no guarantee, so the second function costs nothing the first one was
protecting. Lookup answers what, Recall answers when, selection stays what a Filing Run does with dates
with no message involved.

**Half of this was already decided and the ticket did not know it.** Ticket 18 resolved into ADR 0032
(intent read by a model, applied by code), which amended ADR 0002's closed list with "load recent
Captures for a named subject or date range" and "load the Review Dates for a named subject". Those are
this ticket's two entries. So the shape existed and the code behind it did not, which turned the
question from "should there be a time dimension" into "name it, build it, and write down the corpus
rule". A date written plainly is parsed by code, the same way a typed `done 2` survives with no model
in the path; anything looser is the Intent Read returning a date that code checks before any file is
opened, so ADR 0002 is untouched.

**Date Files stay out of the ranked corpus, and that is now a decision.** A Date File line is a name, a
few words, a Notice Schedule and a tier. That is the shape that ruled the Registry out, and it fails
the same way. Dated lines are reachable by two exact paths instead, by subject name and by date, and an
exact path cannot miss the way a top-k can. All three inert markings are readable and each is stated
for what it is: `handled::` reads as something you dealt with, which is the real answer to the dentist
question and would be lost by hiding it; `?` reads as unconfirmed; `x` reads as something you turned
down. The rule is that Recall never presents an inert line as one that will fire.

**The session's real work was declining a good idea.** The user proposed a per-day index of search
terms, written when the journal is written, so the model could tell from the index which day to read.
It was declined for four reasons that only work together: it duplicates a fact the Vault already
writes, since a confirmed event is already a line in a file named after its day (ADR 0011 keeps past
one-shot files, ADR 0012 makes the human confirm the date); it is a second store of a derived fact,
which ADR 0020 refuses; matching model-written tags is word matching over model prose, which fails soft
in exactly the way ADR 0002 refuses, because a missed day still produces an answer that reads fine; and
it is not needed, because **narrowing then ranking** does the same job with the words the human
actually wrote. A range narrows the corpus to the inbox blocks inside it and ADR 0028's existing word
matching ranks inside that range, at no new state and no new call. The cost of refusing is stated
rather than implied: a day whose Captures share no word with your question is unfindable by feeling.

**The journal stays out for the third time, and the empty day does not need it.** ADR 0027's ground is
unchanged: an answer built from a summary cannot name a source, and naming sources is the whole of
conversation's observability. Recall is the second pressure point that ADR did not anticipate, and it
is recorded there rather than left to be rediscovered. The obvious shortcut was available and not
taken: every day has a Journal Entry, so the folder could have been read as the signal for a quiet day
without reading any prose. Instead the absence of an **inbox** file is the whole of the evidence, so
"you sent nothing that day" is a fact from a file the system already writes and ADR 0027 needs no
exception with edges to defend later.

**Ranges and money.** A range is any pair of real dates, start not after end, refused on a near miss.
A window with no stated width, as in "around Diwali", is three days either side and the answer says so,
because one number is easier to correct than an invisible rule. The material is capped rather than the
range: one named day is read whole, since the day is the question and there is nothing to rank by; a
range is cut at 40 Capture blocks after ranking, roughly a busy week. Where the cut bit, ADR 0028's
compulsory sources line also says so, because a cut that is not stated reads exactly like completeness.
A Recall answer counts against the same ~40 answered messages a day, not a second budget nobody can
reason about.

**A named event that is not on record.** Where the year predates the Vault or the Date Request was
never answered, the bot says it has no Diwali on record for that year rather than guessing. That is ADR
0015's posture (never guess an ambiguous name, ask) and ADR 0028's rule that finding nothing is an
absolute rather than a tuned threshold.

**Build timing, and the honest cost.** Recall ships with the Lookup, inside the First Loop, answering a
literal date or range on the code path alone; event names and loose windows switch on when ticket 21's
Intent Read lands. That is ADR 0028's own argument for settling retrieval before conversation ships.
The cost is that the First Loop gains a part, so ticket 11's build order and `CONTEXT.md`'s First Loop
entry both carry it.

Wrote ADR 0033; amended ADR 0028 (Date Files out of the corpus, "one seam" restated as a corpus rule),
ADR 0027 (the second pressure point) and ADR 0011 (keeping past one-shot files is now load-bearing);
new `CONTEXT.md` term Recall, with Lookup and First Loop amended in place. Feeds ticket 23.
