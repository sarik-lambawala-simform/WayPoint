# Do conversation turns become Captures?

Map: [map.md](../map.md)
Type: grilling
Status: resolved

## Question

ADR 0018 makes a Question *also* a Capture, and that is what licenses recognising a Question as loosely
as a question mark: a false positive costs one unnecessary answer instead of a destroyed thought.
Casual conversation needs the same protection or a deliberate replacement — mid-conversation you will
say things that are genuinely new knowledge ("she's dreading the operation"), and losing them because
they arrived inside a chat rather than as a standalone message would be the worst failure this system
has.

Decide:

- Does every human turn in a conversation land in the inbox as a Capture? Prior instinct: yes, by
  direct extension of ADR 0018.
- Do the agent's turns land anywhere? Strong instinct: no — a model-written sentence must never enter
  the provenance chain. Confirm.
- If every turn is a Capture, what stops a ten-turn conversation producing ten near-duplicate Captures
  that filing then distils into ten near-duplicate Card lines? (Compaction can merge them afterwards,
  which is an answer, but check it is the right one rather than the convenient one.)
- How a turn is distinguished from a Capture *in the inbox file* — does it need marking, and does the
  grammar from ticket 01 extend to inbox blocks or only to Cards?
- Message classification is currently three-way and only Commands are strict. Does conversation become
  a fourth class, or is it simply what a Capture already is? A fourth class is new surface for a misread
  state change, which the spec is deliberately hostile to.
- Whether a Command can be issued mid-conversation, and what happens if it is misread there.

Likely amends ADR 0018.

## Answer

**Wrote [ADR 0029](../../docs/adr/0029-both-sides-of-a-conversation-are-written-only-yours-can-be-cited.md);
amended [ADR 0018](../../docs/adr/0018-a-question-is-also-a-capture.md); new `CONTEXT.md` terms Thread
and Agent Turn.**

**Every human turn is an ordinary Capture.** Block id and all, indistinguishable in kind from a message
sent on its own. This is ADR 0018 extended, not copied. The extension buys more than loss protection:
ADR 0027 makes the inbox the journal's only input and ADR 0028 puts inbox Capture blocks in the
retrieval corpus, so a turn that is not a Capture is invisible to both. "She's dreading the operation"
said in turn four would otherwise be missing from that day's journal and unfindable by Lookup.

**The bot's turns are written too, and a missing block id is what keeps them out of provenance.** The
instinct to write nothing was tested and lost on one fact: the journal reads that day's inbox and
nothing else, so storing only your half leaves it writing up half a conversation, with "yes, exactly,
that's it" sitting in the file meaning nothing. So an Agent Turn is appended with **no `^id`**. The id
exists so a Card can cite the block, and a model-written sentence may never be a source, so it has
nothing to cite. That makes the rule and its reason the same fact, checkable by code instead of promised
by a prompt: a bug that tried to link to an Agent Turn could not write the link. Filing skips id-less
blocks, Lookup never returns them because ADR 0028's corpus is Captures, and the journal is the only
reader. Precedent noted: Digests are already agent prose in the Vault that nothing cites.

**A nightly summary block in the inbox was proposed and declined, because it is the Journal Entry with
its one safety rule removed.** A generated per-day block over that day's Captures already exists as the
Journal Entry, and ADR 0027's defining property is that nothing reads it. The proposal's three possible
readers each fail differently: the journal reading it makes it the journal, paid for twice; filing
reading it instead of the raw blocks points every `from::` link at model prose, cutting the chain ADR
0001 requires and ADR 0019 checks as arithmetic, and cannot work on timing anyway because filing runs
every three hours while a day's summary does not exist until the day closes; chat and search reading it
loses the exact words ADR 0027 says are the only place the answer lives. A block "at the top" is also a
rewrite of an append-only file. The real problem it was aimed at, the half-transcript journal, is solved
by writing the Agent Turn instead.

**Conversation is not a fourth message class, and a Telegram reply is what closes the gap.** "Am I being
unfair about this?" already ends in a question mark, so it is already a Question. Conversation adds
history, not a class. The genuine gap is the mid-chat statement with no question mark, which today gets a
silent "Recorded:" and reads as being ignored. Requiring a question mark to stay in a chat is syntax to
remember, which is the friction ADR 0018 refuses. A time-windowed chat mode is the fourth class plus a
hidden state change. So: a reply to the bot's message in Telegram is answered, using the reply target the
spec already reads to resolve Command numbers. Nothing is remembered and no window can be quietly open.

**The reply chain is also the Thread, which keeps dialogue state off the write path.** Turns nest as
sub-bullets under the block their reply target points at, in prose, so ADR 0027's no-fields rule is
untouched and a chat reads as a chat in Obsidian. This nearly went wrong: nesting by a time window would
have put dialogue state on the **write** side, which is exactly what ticket 08 wants to avoid, and the
reply target avoids it for free. Ticket 08 stays a read-side question.

**Filing's unit is the Thread; the marker's unit stays the Capture.** Ten turns become one Card line
carrying several sources, rather than ten near-identical lines waiting for compaction to merge them.
Letting compaction clean up afterwards was the convenient answer and was declined: the Card is wrong in
the meantime, and ADR 0019's floor means ten turns keep ten link-backs on that Card forever either way.
But the filed marker stays per block, so turn six arriving an hour after the Thread was filed is simply
unfiled, drains next run, and joins the same line as another source. Two different units for two
different jobs, and ADR 0009's per-Capture granularity is untouched. ADR 0019 already said the pressure
lands on how compactly a line carries several sources.

**Small settled things.** An answered turn gets no separate "Recorded:" echo, because the answer is the
receipt; a saved-but-unanswered message gets it exactly as today, so nothing changes for ordinary use.
A Command works mid-chat and is still checked first with its strict pattern, so "yes" alone is not a
Command for want of digits and the obvious accident cannot happen. A Command replying to a bot chat
message resolves against the newest Digest, the same as a bare Command, because a chat message has no
footer and the reply target tells us nothing there.

**Cost accepted, stated so it is not discovered later.** Model prose now lives permanently in an
append-only archive, and the one thing keeping it out of the provenance chain is an absent id, so a later
change that gives every inbox block an id breaks this silently. The inbox grows faster, and ADR 0028's
~40 answered messages a day are spent quicker now that a reply in the thread counts.
