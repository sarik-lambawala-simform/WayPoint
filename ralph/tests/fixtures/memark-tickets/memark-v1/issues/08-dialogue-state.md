# Dialogue state: how much, and where it lives

Map: [map.md](../map.md)
Type: grilling
Status: resolved

## Question

The spec rules out conversation partly on this ground: *"there is no dialogue state... a conversation
log would be a second store of truth."* Casual conversation cannot honour that literally — "and what
about her sister?" is meaningless without the previous turn. This is a direct conflict with a stated
decision and must be resolved rather than quietly relaxed.

Decide:

- How much history a turn carries: the last N turns, the current session, or the day.
- Where it lives. If turns are Captures (ticket 07), the inbox may already *be* the log, which would
  satisfy ADR 0020's rule that state is derived from files the system already writes rather than stored
  separately. Test that idea properly — reconstructing a conversation from inbox blocks may be exact,
  or may be a reconstruction that quietly differs from what was said.
- When a conversation ends. A time gap, an explicit signal, or never — and what "never" costs when
  every turn carries the last N.
- Whether the agent's own replies are part of the carried history. They must be for coherence, and they
  must not be stored as truth (ticket 07). Where does that leave them — held in memory for the session
  and never written?
- Whether the box being restarted mid-conversation loses it, and whether that is acceptable.
- Whether dialogue state can ever influence what gets *written* to the Vault, or is strictly read-side.
  Read-side-only is the safe answer; confirm it is affordable.

Likely amends the spec's Out of Scope entry on Conversation and may need an ADR.

## Comments

**From ticket 06 (the retrieval seam).** Lookup queries the conversation so far rather than the last
message alone. That is the answer to word matching's central weakness, so how much of a conversation
survives between turns is now load-bearing for *retrieval quality*, not only for resolving "and what
about her sister?". A dialogue-state answer that keeps nothing also removes Lookup's best signal and
makes an opening subject-less message the common case rather than the rare one. See
[ADR 0028](../../../docs/adr/0028-conversation-finds-cards-by-matching-words.md).

**From ticket 07 (conversation turns).** Three of this ticket's bullets now have their answer or their
constraint.

- **Where history lives.** The inbox *is* the log, and the speculation in the second bullet holds up
  exactly rather than approximately. Your turns are Captures stored verbatim, and the bot's turns are
  Agent Turns stored with no block id, so both halves of a conversation are in the file and the
  reconstruction is the transcript rather than a version of it. ADR 0020 is satisfied without a store.
- **The agent's replies.** Settled: written, uncitable, ignored by filing and Lookup, read only by the
  journal. So "held in memory and never written" is *not* the answer, and coherence does not depend on
  the box staying up.
- **Read-side only.** Held, and it was close. Nesting a Thread by a time window would have put dialogue
  state on the write path. Nesting by Telegram's reply target keeps the write path stateless, so this
  ticket is free to be read-side only.
- **What is left for this ticket.** How far back along the chain to read, which is now purely a read-side
  question, and what "the conversation so far" means for ADR 0028's query when a chain is fifty turns
  long. "When a conversation ends" no longer needs a write-side answer, because nothing is remembered
  between messages: a reply target either exists or it does not.

See [ADR 0029](../../../docs/adr/0029-both-sides-of-a-conversation-are-written-only-yours-can-be-cited.md).

## Answer

**A turn carries the last 20 messages of its Thread, read back out of the inbox by Telegram message
number, and the search sees only your last three.**

Tickets 06 and 07 had already taken most of this ticket apart. The inbox is the log and the
reconstruction is exact, both sides of a chat are written, and nesting by reply target keeps the write
path stateless. What was left was one read-side question with a number missing from it, and one hole
that turned out to have been in the spec all along.

**How the history is found.** Telegram hands over one step back, the message you replied to, and
nothing before it. Nothing in the spec or the ADRs said which Telegram message goes with which inbox
block, so there was no way to take the second step. That gap was not created here. The spec already has
a Filing Run edit the bot's acknowledgement in place three hours later from a different process, which
is impossible unless the number is written down. So a block now carries the number of the bot message
belonging to it, and a chat turn also carries the number of the message it replied to. Reading walks
those numbers backwards.

**Why two numbers and not one.** The first plan was one number plus the Thread nesting, which is
simpler and wrong. Nesting stops at the file, and a chat that crosses midnight has its earlier turns in
yesterday's file. The other way out was to nest the new turn into the older day's file, and that writes
a thought into a day whose Journal Entry may already be written, which ADR 0027 refuses. So every turn
is written into today's file whatever it replies to, and the parent number is what carries the chain
across the boundary.

**Where the numbers live.** As ADR 0026 `key:: value` fields on the inbox block, which is a real bend in
ADR 0027's rule that the inbox is prose. It was bent already: the filed marker has always had to sit on
an inbox block and never had a shape. So both use one notation, and the ADR says so rather than leaving
it to be discovered. The alternative was a sidecar mapping file, which is a second store of truth. The
load-bearing part is that these are **fields, not block ids**. ADR 0029 keeps model prose out of the
provenance chain by giving a bot turn no id, and warned that the failure would be silent. No link syntax
can point at a field, so a bot turn carrying a message number is still uncitable by construction. The
fields are stripped before the journal or Lookup sees the text.

**The window.** 20 messages, both sides counted, roughly ten exchanges, oldest dropped, and the bot
never says it dropped anything. Sent verbatim. Summarising a long chat would make model prose the input
to more model prose, which is the second-version-of-what-was-said problem this ticket opened with. The
number is a constant, not a decision, and moves if real chats run long. Prompt caching helps here for
once, because turns are seconds apart, which is exactly the case ticket 05's research found it useful
for.

**The query is narrower than the window.** Your last three turns, never the bot's. ADR 0028 said "the
conversation so far" before there was a number attached, and a query glued from ten of your messages
drags in Cards matching something you said eight turns ago about somebody else. History is in the query
so that a subject-less turn three has turns one and two to match on. Turn nine does not do that job.
The bot's prose is excluded for a different reason: it is vocabulary the model chose, and searching on
it makes the retrieval chase itself.

**No time limit anywhere.** A reply target exists or it does not. A reply to a bot message from three
weeks ago works, and the old words are the context you meant by replying to it. A message that is not a
reply carries no history at all, even if you were chatting an hour ago, because "recent enough" is the
time window ADR 0029 threw off the write side arriving back through the read side. A reply target that
cannot be found is treated as a fresh message, which is a soft failure landing on a hard stop: ADR
0028 already says a message matching nothing gets told so and asked about.

**The original bullets, closed.** When a conversation ends: never, and nothing is remembered between
messages. Whether the bot's replies are carried: yes for answering, no for searching, and they are
written rather than held in memory, so "held in memory for the session" was the wrong shape. Whether a
restart mid-conversation loses it: it loses nothing, because there is nothing in memory to lose.

**The one honest cost.** This ticket was meant to be read-side only and is not quite. It puts two
numbers on the write path. It earns them by making explicit a dependency the spec already had and never
wrote down, and the write path stays stateless in the sense that mattered: no time window, nothing
remembered between messages, and no state that can be quietly wrong.

Amended ADR 0027 with the inbox notation paragraph and ADR 0028 with the query window. No new ADR and
no new term. Ticket 13 carries the read rule into the spec and amends the Out of Scope entry on
Conversation.
