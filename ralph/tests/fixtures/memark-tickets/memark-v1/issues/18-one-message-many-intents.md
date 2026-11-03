# One message, several intents: classification without a syntax

Map: [map.md](../map.md)
Type: grilling
Status: resolved

## The constraint that reframes this ticket

Stated by the user while this ticket was being written, and it changes the destination rather than
adding a requirement:

> "Opening Obsidian or doing anything manually is optional and not required. I want the system to be
> conversational via Telegram. If I ask it anything, it should be able to do it."

Every decision below is now measured against that. A design that works but needs you to remember a verb,
send three messages instead of one, or open the Vault by hand to finish the job has failed the test even
if nothing was lost. The spec's current answer to several of these is "edit the line in Obsidian", and
that answer is now withdrawn.

The user's proposed mechanism is a model call per message at receipt, classifying intent and acting
immediately, replacing today's rule that all understanding happens in the three-hourly Filing Run. That
mechanism is [ticket 21](21-intent-at-receipt.md), which is blocked by this one. **This ticket decides
what has to be understood. Ticket 21 decides where the understanding happens and what it costs.** Keep
them apart, because the first list is still the requirement even if the second answer changes.

## Question

Classification today is whole-message and three-way: a strict `verb + digits` Command, a question mark
at either end, or Capture as the unconditional default (spec, "Message classification is three-way",
ADR 0013, ADR 0018). Every part of that was argued for. What was never argued is what happens to a
message carrying more than one intent, because the spec quietly assumes a message has one.

The case that broke it: *"I might be in a hurry and just blabber in the chat box. It should be smart
enough to identify if among all of the message text there was a question, reply to that question
immediately, and mention that all the other things are filed properly in the inbox."*

Today that message is one Capture. If the question mark is mid-paragraph, no answer comes back. If it
contains `done 2` in prose, the Task stays open and the sentence is filed as a Card line instead.

Decide:

- **Whether a message can hold more than one intent at all.** The cheap answer is several Commands on
  separate lines, each still strict. That takes the multi-Command friction and loosens nothing. It does
  nothing for prose, and under the constraint above it is no longer sufficient on its own. Settle it
  anyway, because it may still be the right thing to keep underneath whatever else is built.

- **Whether a question mid-message is answered.** ADR 0018 made loose recognition safe by making a
  Question also a Capture. That argument covers "answer more things", so extending recognition inward
  costs an unnecessary answer, not a lost thought. What it does not cover is what the answer is *about*
  when the surrounding paragraph is unrelated, and whether the answer quotes the fragment it read so a
  wrong read is visible.

- **Whether prose may ever cause a state change.** The hard one. "I'm done with the plumber" closing a
  Task means something read intent, and ADR 0021 exists because a state change made on model-written
  prose ticks the wrong box. Options worth putting against each other: never; a confirmation turn in the
  chat; or a Proposed state change the next Digest asks about, reusing ADR 0012's mechanism. Note the
  third is *slower* than typing `done 2`, so it may fail the very test that opened this ticket, and the
  first is now ruled out by the constraint above unless something else closes the gap.

- **What an acknowledgement says when one message did three things.** The quote-back is one message per
  Capture and self-fills with where the thought landed. Ticket 16 settled that every message gets exactly
  one reply. A message that was answered *and* filed *and* closed a Task has to say all of that in one
  reply without becoming a report.

- **What a misread now costs.** Story 52 promises the worst case is a stray Capture. Segmenting adds
  failure modes it never contemplated: a paragraph split at the wrong point, a fragment filed without the
  context that made it mean anything, one intent noticed and another silently dropped. Restate the
  guarantee in a form that survives segmentation, or say plainly what it now costs.

- **Whether ADR 0002 survives, and in what form.** "Deterministic code selects what the model sees" is
  load-bearing across the spec. Say whether it is amended, narrowed to the write path, or held. Ticket 21
  cannot start until this has an answer.

## The confirming-correction gap

Folded in from a separate question, because it is the same problem in its smallest and most tractable
form. It is worth settling early even if the rest of this ticket runs long.

The spec states: *"Confirmation is where the tier and any non-default Notice Schedule are set,
defaulting to tier 2 and `5d..0d`."* The Command grammar is `verb + digits`. **There is no syntax that
carries a tier or a schedule.** So confirmation is named as the place they are set, and there is no way
to set them there. Every confirmed date is tier 2 with a five-day run-up unless the human opens Obsidian,
which the constraint above no longer permits.

The same hole, one step wider. Against the Digest item *"I think Priya's birthday is 19 Dec. Track it
yearly?"*, the honest reply is often neither `yes` nor `no`:

> "No, it's on 21 December, and yes please track it yearly."

Today that is a Capture and nothing happens. The `?` line stays at 19 Dec. Doing it properly costs five
steps across two days, and step one is `no 2`, which permanently records a rejection so the same
inference is never offered again.

What is missing is a **correcting confirmation**: a third outcome sitting between `yes` (accept as
proposed) and `no` (reject and remember). Something of the shape `yes 2 on 21 Dec, tier 1`.

Decide:

- Whether a Command may carry arguments beyond a number, and whether that is still "strict" in the sense
  story 51 means.
- Whether a correcting confirmation records a rejection of the original guess or simply replaces it. The
  distinction matters: `no N` writes an `x` line kept forever so the inference is never repeated, and
  that is the wrong outcome when the guess was nearly right.
- What sets the tier and the Notice Schedule if not this. There is currently no answer at all.
- Whether this is worth solving in strict code independently of the larger intent question. It has a
  cheap answer that needs no model and no segmentation, and it stops being urgent only if ticket 21's
  answer arrives first and covers it.

## The Digest asks questions the Command grammar cannot answer

Found by walking a real ambiguity through the system, and it is the sharpest instance of this ticket's
problem rather than a separate one. Two Cards exist, `Priya Nayar` and `Priya Sharma`, both rows carrying
`aka:: Priya` from the seeding interview.

You send **"i hate priya"**. Receipt is fine: Capture, echoed, appended. The next Filing Run finds "Priya"
matching two Registry rows, and ADR 0015 stops the write: no edit applied, the Capture stays undrained,
the Canary counts it, and the Digest asks which subject was meant.

> 3. "i hate priya" — which Priya? Nayar or Sharma?

**And there is no way to answer.** The Command set is `done`, `skip`, `yes`, `no` and `catchup`, each
taking digits. None of them expresses "the second one". `yes 3` is meaningless against a two-way choice.
This is a question the system is designed to ask, asked through the one surface the human has, with no
designed reply. The escape today is opening Obsidian and editing the Card by hand, and the constraint at
the top of this ticket withdraws that escape.

The stall is total, not partial. Send **"priya's birthday is on 21 December"** and no `?` line is written
either, because a Proposed Date is an edit derived from the Capture and no edit derived from an ambiguous
Capture is applied. The date does not even reach the inert, awaiting-confirmation state. It exists only
as your raw words in the inbox.

Decide:

- **Whether a Command may select one of N.** ADR 0015 is not the only asker: ADR 0010 routes
  Contradictions the same way, and the two share a shape that `yes`/`no` does not fit. A verb taking an
  item number and a choice would serve both.
- **Whether the choice can be named rather than numbered.** "the cousin" or "sharma" is what a person
  would actually type, and it resolves exactly against Registry rows, so it needs no model and stays
  strict code. Check that against story 51's exactness.
- **Whether Ambiguous Subjects should have been in the First Loop at all** given no answer verb exists.
  Ticket 11 pulled them in because seeding makes a first-name collision a week-one event. That argument
  holds and makes the missing verb worse, not better.
- **What else the Digest can ask that nothing can answer.** Audit the ask paths as a set — Ambiguous
  Subject, Contradiction, Proposed Heading, Merge Proposal, Date Request — and check each has a reply
  that exists.

The abandonment half of this failure is [ticket 22](22-backlog-and-the-offline-horizon.md): a Capture
held back this way falls out of filing's 30-day scan window on day 31, unmarked and unreported.

## A stated date is treated as an inferred one

Third instance of the same gap between what you said and what the grammar can carry.

ADR 0012 governs a date **the agent inferred**, and its amendment carves out the seeding interview on
the explicit ground that there *"you state the date, in words you typed, with the agent in front of
you."* A Telegram Capture saying "her birthday is 21 December" is the same act and gets none of the
benefit. It becomes a `?` line, and that evening the Digest asks you to confirm a fact you stated in
plain words hours earlier.

The ADR's reasoning still has force: the unreliable step is *noticing* a date in a rambling message, not
your knowledge of it, and the model can mis-parse a date or attach it to the wrong person. So this is not
obviously wrong. It is simply a case the ADR never considered, and under the no-manual-work constraint it
costs a round trip on every date you volunteer.

Decide:

- Whether a date stated plainly by the human is confirmed differently from one inferred from context, and
  whether that distinction can be drawn in code rather than by the model judging its own confidence.
- Whether the confirmation collapses into the acknowledgement instead of waiting for the Digest, since
  the quote-back already reaches you within seconds and already self-fills hours later.
- Whether this is simply absorbed by the correcting confirmation above, which would let one reply both
  confirm and set the tier.

Likely amends the spec's classification section, story 51 and story 52, and ADR 0013, ADR 0018, ADR 0021
and ADR 0012. May need a new ADR. Blocks [ticket 21](21-intent-at-receipt.md). Feeds a re-run of
[ticket 13](13-amend-the-spec.md).

## Answer

The ticket asked what has to be understood. The answer turned out to be smaller than the question,
because one decision made most of the others fall out: **the strict grammar stops being something you
type and becomes the format a model hands to the script.** That is ADR 0032, and everything below is
either a consequence of it or a hole it exposed.

### The one decision

You talk. A model call at receipt turns what you said into a structured set of changes, in the shape
ADR 0014 already defines. Code checks every part and applies it. The model never writes and never
chooses what it reads.

This gives away story 51 on purpose. That story protected you by making the front door too dumb to
misread you, and the price was Obsidian. Three things replace it, and they only work together:

- **Exact match or nothing.** Loose about reading you, exact about what it hands the script. A near
  miss is refused, not rounded off.
- **Nothing happens silently.** The reply names every change in full, spelling out the Card name and
  the date rather than echoing your shorthand.
- **`undo` takes it back.** One word, the whole of the last message. Nothing has reached disk yet
  anyway, because a Filing Run is still the only writer.

### Whether a message can hold more than one intent

Yes, and it is never cut up. The whole raw message is saved first, unchanged, exactly as today. Reading
it for intent is a second pass that only ever *adds* actions. Segmentation as such was rejected: a
paragraph split at the wrong point and a fragment filed without the sentence that gave it meaning are
failure modes that do not need to exist. Several Commands on separate lines still works underneath, and
is now a shortcut rather than the mechanism.

### Whether a question mid-message is answered

Yes, and the quote is the scope. The reply quotes back the exact words it read as the question and
answers those and nothing else. If a neighbouring sentence mattered it quotes that too, so there is no
hidden context rule and a wrong read is visible rather than buried. Amends ADR 0018, which already had
the argument for it.

### Whether prose may cause a state change

Yes, for reversible things, with the reply as the confirmation surface rather than the Digest. The test:
**if the reply names it and `undo` reverses it, do it; if reversing it later would mean noticing it
happened at all, ask first.**

- **Happens:** ticking a Task, skipping a Review Date, editing a tier, filing, answering.
- **Asks:** creating a date the model inferred, merging two Cards, recording a permanent rejection.

The ticket listed "a Proposed state change the next Digest asks about" as an option and noted it is
slower than typing `done 2`. It is, which is why it lost. The reply-plus-undo path is faster than the
Command it replaces, which is the test that opened this ticket.

### What the acknowledgement says when one message did three things

Still one reply, per ticket 16. Answer first, because that is what you are waiting for. Everything else
is one line at the bottom.

> "what did i say about her last week"
>
> You said your mum only brings up the house when she's worried about money.
>
> Also: ticked off *call plumber about the boiler*, saved the rest. `undo` to take that back.

The instant echo survives as the first version of that message and is edited into the real reply when
the Intent Read finishes, with Telegram's typing indicator filling the gap. One message, so ticket 16's
rule holds, and the echo landing is proof your words were saved even if the call then dies.

### What a misread now costs

Story 52 is rewritten. The old promise was cheap because the system did nothing:

> Whatever the system gets wrong, your words are saved whole, every change it made is named in the
> reply, and one word takes it back.

Weaker than the old one, and it should be. Saved-whole holds absolutely, because saving happens first
and never depends on understanding.

### Whether ADR 0002 survives

Amended, not narrowed:

> Code selects what the model sees. The model may ask for more, from a fixed list, and code decides
> whether to serve it.

The list is closed: a Registry name lookup, a named Card, a numbered Digest's items, the Review Dates
for a subject, recent Captures for a subject or date range, and the changes named in an earlier reply.
No general search entry, because that is a search tool wearing a costume. When the model needs something
the list cannot express it changes nothing and the bot asks you plainly, which is how a missing entry
gets noticed.

Searching stops when it stops finding things: two dry rounds in a row, with a wall-clock budget
underneath. The limit is about not wasting your time, not about safety. Code serves every request, so
more searching is not more risk.

## The confirming-correction gap

Closed, and not the way the ticket proposed. `yes 2 on 21 Dec, tier 1` was designed in full and
rejected, because it is syntax and syntax is the friction the system exists to remove. The tail survives
as the model's output format. You say "priya's birthday is actually on the 21st, remind me a fortnight
before" and the model writes the tail.

- **A correcting confirmation replaces, it does not reject.** `no` stays the only thing that records a
  permanent rejection. The guess was nearly right, and filing it as wrong forever is a lie about what
  happened.
- **Tier and Notice Schedule are set in words**, at confirmation, which is what the spec always claimed
  and never provided. Defaults unchanged when you say nothing. Changing them later is also just talking:
  "priya's birthday matters more than i said" edits the tier on the existing line, and that is a
  reversible edit so it happens without asking.
- **One honesty rule.** Priority tiers are out of the First Loop, so in v1 the number is written and the
  Digest does not sort by it yet. The reply says what it wrote and must not imply the Digest will now
  behave differently.
- **Not worth solving separately.** It has a cheap strict-code answer, but that answer is the syntax you
  rejected. It ships with ADR 0032.

## The Digest asks questions the Command grammar cannot answer

Closed by the same decision, plus one new verb.

- **A Command may select one of N.** `pick 3 sharma`. Named, not numbered, because a name is what a
  person would type and it resolves exactly against Registry rows, so it stays code. A name matching
  nothing or two rows changes nothing and says so. This is a sixth verb and it was accepted on purpose:
  the system currently asks a question it gave you no way to answer.
- You never have to type it. "the priya i meant was priya sharma" is turned into it.
- **Ambiguous Subjects stay in the First Loop.** Ticket 11's argument was always right and the missing
  verb was the only thing wrong with it.
- **Audit of the ask paths.** Proposed Date, Proposed Heading, Merge Proposal, Date Request, Ambiguous
  Subject, Contradiction. All six now have a reply, because the reply is talking. Only two needed a new
  shape, and Ambiguous Subject and Contradiction are the same "pick one of these" question, so `pick`
  serves both. ADR 0010's routing and ADR 0015's are answerable for the first time.

## A stated date is treated as an inferred one

Closed with a test code can run, rather than the model judging its own confidence: **does the message
literally contain a date?**

- **Yes** ("priya's birthday is 21 December"): you stated it. Applied at once, named in the reply,
  reversed by `undo`.
- **No** ("i should get her something before her birthday"): the model worked it out. Proposed Date, the
  Digest asks, ADR 0012 unchanged.

Confirmation collapses into the acknowledgement, which reaches you in seconds. This is ADR 0012's own
seeding-interview reasoning applied generally, and it is absorbed by the correcting confirmation above,
so one reply both confirms the date and sets the tier.

## One contradiction found and closed

The spec says *"Voice notes are never Commands, because transcription confidence is the wrong thing to
hang a state change on."* That does not survive. Under this design it would make everything you say out
loud incapable of doing anything, which fails the constraint at the top of this ticket outright. The
worry it encoded was transcription, not state change, and ticket 16 already answers it better: a spoken
turn is quoted back on the first line of the reply, which is where a mangled name is caught. Voice is
treated exactly like text, with the quote-back compulsory.

## What this produced

**New:** ADR 0032, intent is read by a model and applied by code.

**Amended:** ADR 0002 (the model may ask, from a fixed list), ADR 0012 (a date you stated is not a date
inferred), ADR 0018 (recognition moves inward, the quote is the scope), ADR 0021 (unchanged in mechanism,
now also resolving undo targets).

**New terms:** Intent Read, Undo. Command and Question amended in place.

**Spec changes for [ticket 13](13-amend-the-spec.md):** rewrite the classification section; rewrite
stories 51 and 52; delete the voice-note Command rule; fix "confirmation is where the tier is set" so it
is true; add the `pick` verb; add the separate limit for Intent Reads and the soft landing when it is
reached.

**Ticket 21 is now load-bearing**, not a follow-up. Without a model at receipt there is nobody to do the
translating, so the two ship together or not at all. Its own questions about cost, latency and the
single-writer property are unanswered and still its to answer.
