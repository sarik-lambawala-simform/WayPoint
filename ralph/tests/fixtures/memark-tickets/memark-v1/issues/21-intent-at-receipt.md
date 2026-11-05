# Intent at receipt: a model call per message, and what it breaks

Map: [map.md](../map.md)
Type: grilling
Status: resolved
Blocked by: 18 (answered)

> **This ticket is now load-bearing, not a follow-up.** Ticket 18 answered by making the strict Command
> grammar the format a *model* hands to the script rather than something you type, which is ADR 0032.
> Without a model at receipt there is nobody to do the translating, so 18's answer does not work on its
> own. The two ship together or not at all.
>
> Read ADR 0032 before this ticket. Several questions below are already settled by it: ADR 0002 is
> amended rather than narrowed (the model may ask, from a closed list, and code decides whether to
> serve it); ADR 0012 and ADR 0021 both survive intact; a failed call must still leave the raw text
> written down, and the instant echo survives as a first message edited into the reply. Classification
> gets its own limit, separate from the answering cap, and passing it drops the system back to saving
> and echoing rather than breaking.
>
> What is still yours to answer: whether the bot writes the Vault or still only proposes, what happens
> to the Filing Run's model call, and the real cost number at 5, 20 and 50 messages a day.

## Question

[Ticket 18](18-one-message-many-intents.md) decides what a message has to be understood as. This one
decides where that understanding happens, and it is where the architecture actually changes.

The user's proposal, stated directly:

> "I think we need an AI call just to understand the intent of the message sent via Telegram, and then
> what is required to be done. So instead of the filing call every three hours where the AI is sent the
> whole chunk of messages, we will have to involve AI for each message just to classify the intent and
> take appropriate actions right away."

This is a real answer to a real problem and it is not being relitigated here. What it needs is the same
treatment every other decision in this effort got: the consequences named, priced, and either accepted
or bounded. Six things in the current spec rest on the property this removes, and none of them fails
loudly.

Today the split is clean. Receipt is dumb, free and instant: echo the text, append a block, stop. All
understanding happens in a scheduled run holding the Vault lock. The one exception already carved out is
answering a Question, and ADR 0013 named that exception's cost out loud rather than hiding it.

Decide:

- **Whether the bot writes the Vault, or still only proposes.** The spec's flat statement is *"The bot
  never writes the Vault"*, and the Run Lock, ADR 0009's expected-state check and ADR 0004's
  single-commit atomicity all rest on there being exactly one writer. "Act right away" reads as the bot
  writing. There is a middle path worth pricing: the intent call runs at receipt and *reports* what it
  will do, the write still lands on the next run. That keeps one writer and gives you the immediate,
  correct-sounding reply, at the cost of a reply that describes a future rather than a fact. Say which,
  and if the bot does write, say what replaces the single-writer property.

- **What happens to the Filing Run.** If intent is understood at receipt, is the three-hourly run still
  a model call at all, or does it become code applying decisions already made? ADR 0024 split filing from
  speaking on the argument that filing is frequent and cheap. That argument changes shape if the
  expensive part has moved to receipt.

- **Cost, honestly, against the Checkpoint.** Today distillation is one cheap-tier call per batch and the
  Checkpoint measures a habit against a flat per-day cost. Per-message intent makes cost linear in how
  much you talk, which is the same regression ADR 0013 accepted for Questions and is now the main path
  rather than the exception. Work out the real number at 5, 20 and 50 messages a day. Decide whether the
  intent call is cheap-tier, and whether a schema-constrained classify-only call is cheap enough that the
  argument is about latency rather than money.

- **Latency, and what the human sees while it thinks.** The echo is currently instant because it is a
  copy of your own text with no model in the path. A model call at receipt puts seconds between sending
  and any acknowledgement at all. Ticket 16 settled that a chat answer fills the gap with the typing
  indicator, but that was for an answer you were waiting for. Decide whether the instant echo survives as
  a first message with the intent report arriving as an edit, which would reuse the self-filling
  acknowledgement already built.

- **What happens when the call fails or the box is offline.** Today a Capture is never lost, because
  receipt does no thinking: Telegram holds the message and the block gets appended whenever the box
  wakes. If understanding happens at receipt, a failed call must still leave the raw text written down.
  State that as an invariant, because it is the one thing in the current design that has never had an
  exception.

- **How this interacts with the daily cap.** Ticket 16 set a cap of roughly forty answering calls a day,
  counted on attempt and reset at local midnight, and the bot says so once on reaching it. If every
  message now carries a call, the cap is reached by ordinary use rather than by heavy questioning.
  Decide whether classification counts against the same cap, a separate one, or none.

- **Whether ADR 0002 is amended or narrowed.** Ticket 18 must answer this first, which is why this
  ticket is blocked. Record the consequence here either way: if a model decides what happens to a
  message, code no longer selects what the model sees at the front door.

- **What is still decided by code afterwards.** ADR 0021 and ADR 0012 are not about understanding, they
  are about not making a state change on a guess. Digest numbers resolve through a footer written by
  code, and an inferred date is inert until a human confirms it. Say explicitly which of those survive
  intact under an intent call, because they are the parts most likely to be quietly eroded by "it
  understood, so it acted".

- **How a misread is caught.** The current answer is the quote-back: you see your own words seconds
  later and correct them. Under intent-at-receipt you would see an interpretation instead. Decide whether
  both are shown, and what the cheapest way to reverse a wrong action is, given that reversal must also
  happen in Telegram.

Likely amends ADR 0002, ADR 0013, ADR 0024 and the spec's Cost section, and rewrites the classification
section outright. Almost certainly needs a new ADR of its own. Feeds a re-run of
[ticket 13](13-amend-the-spec.md).

## Answer

**The bot writes the inbox and never a Card.** The single-writer property is not given up, because the
Vault is not one thing. The inbox is append-only and dated by day; a Card is rewritten in place.
Appending races nothing, so receipt writes the raw Capture as it always did, and the Intent Read's
checked output is appended beside it as a **Pending Instruction**. The Filing Run applies it and stays
the only writer of a Card. ADR 0004 (git is the sync and audit log, one commit per run) and ADR 0009
(writes applied against recorded expected state) therefore stand unamended rather than being replaced,
which was the whole reason to look for this shape. The cost is a reply that says "will close" rather
than "closed", and it is smaller than it looks: `undo` reaches a Pending Instruction before it has
become a file, so the window this creates is the window where a mistake is cheapest to reverse.

**The Filing Run keeps its model call, and the split moves inside the run.** The Intent Read reads
Commands out of prose. Turning a Capture into a Card line still needs the Registry and the target Card
body, and pulling those into receipt would cost the flat-price property below and slow every message.
So ADR 0024 (filing is frequent, speaking is daily) is amended rather than reversed: a run takes the
Run Lock every few minutes, applies Pending Instructions with pure code, and reaches for the model only
when the filing clock says so. One entry point, one lock, one code path, so the single test seam does
not divide. A ticked Task lands within minutes for zero tokens. Shortening the whole interval instead
was costed and rejected: every run with work pays the filing prompt with the Registry inside it, so at
one run per message filing goes linear in talking too, roughly $1.50 to $4 a month at twenty messages
a day.

**The cost, and the finding that changed it.** The Registry does not belong in the Intent Read's
packet. ADR 0032 requires a name to resolve exactly against a Registry row; it does not require the
model to do the resolving, and code is better at it. The model returns the name it read as a string and
code matches it against Card names and `aka::` aliases, with ADR 0015 (Ambiguous Subjects are asked
about, never guessed) already covering two matches. That makes the call **flat in the size of the
Vault**, which only the journal otherwise manages.

Assumptions: ~1,500 tokens of change grammar, ~300 of Digest items, ~60 for the message, ~200 out.
Prompt caching does not help, because Haiku will not cache a prefix under 4,096 tokens and ordinary
messages are more than an hour apart.

| Intent Read, per month | 5 msg/day | 20 msg/day | 50 msg/day |
|---|---|---|---|
| Cheap tier, any year | ~$0.43 | ~$1.74 | ~$4.35 |
| Strong tier, any year | ~$1.29 | ~$5.16 | ~$12.90 |
| Cheap tier, with the Registry in the packet, year 5 | ~$1.64 | ~$6.54 | ~$16.35 |

Against a year-one bill of about $4.25 a month. The cheap tier is the default and the **model id for
each tier becomes a Box Setting**, per ADR 0031 (settings have three homes), so switching tiers is an
environment change and a restart. Safety comes from exact-match-or-nothing, the reply naming every
change, and `undo`, and those work identically at either tier.

**The limit is 150 Intent Reads a day**, a Vault Setting joining the caps already there. Counted on
attempt, reset at local midnight, said once on reaching it. It sits far above any real day because it
is reached by talking rather than by asking. Past it the system saves and echoes, exactly as today, and
`done 2` still works because it costs no model call.

**Four things the walk-through exposed that this ticket had not named.**

- **A Task has no exact key.** The model never saw a Card body, so it cannot return a block id. Code
  searches open Task lines with the word matching ADR 0028 (conversation finds Cards by matching words)
  already builds, and ADR 0034 (a closed Task is hidden from the model and never reopened) already
  strips closed Tasks from that corpus, which is the exact rule needed here. One match closes it.
  Several match and nothing closes; the reply lists them. This is the one place the front door guesses
  and it is built to fail by asking.
- **A word that names no number is refused.** "remind me early" sets no Notice Schedule; "make it
  important" sets no tier. The default applies, the reply states the days as a number, and the phrase
  appears under what could not be matched. A closed vocabulary of vague words was designed and
  rejected: it is a second grammar to remember, hidden inside a system whose reason for existing is
  that you should not have to remember one.
- **Applying is per change; reversing is per message.** One refused change does not drop the others,
  because a mistyped name should not cost you the Task close in the same sentence. `undo` still takes
  back everything the last message did. The two units are deliberately different.
- **A reply is edited up to three times.** Echo, then the changes at a second or two, then the answer at
  ten seconds when the message carried a Question, then the Filing Run saying where each thought landed.
  Still one reply per message, per ticket 16. The spec already accepts that scroll-back shows the final
  state and git holds the history.

**The new silent failure, stated rather than discovered.** A Pending Instruction written and never
applied is invisible in the chat, because the reply already said "will". The Health Canary gains a count
of unapplied Pending Instructions.

Wrote ADR 0035; amended ADR 0024 and ADR 0032; new `CONTEXT.md` term Pending Instruction and a tightened
Intent Read entry. The Cost table, the Checkpoint and the classification section land on
[ticket 23](23-amend-the-spec-again.md).
