# What does a follow-up without a reply get?

Type: grilling
Status: resolved
Blocked by: 02

## Question

`CONTEXT.md` says a Thread is built from Telegram's reply target only, and "nothing is remembered
between messages". Finding B in [../finding.md](../finding.md) shows what that costs:
`How about day before yesterday?`, sent seconds after a question about mood, reached the model alone
and got an answer about the whole day.

Two ways:

- **Keep the rule.** When a question reads as a follow-up and carries no subject of its own, the
  reply says it read the words alone and tells the person to use reply. The box never guesses what
  came before.
- **Change the rule.** A message sent soon after the bot's last answer, with no reply target, gets
  that last exchange in its prompt. This goes against the Thread definition. It needs an ADR, and
  the time limit is a new Vault Setting.

Argue the cost of each wrong guess. Keeping the rule costs a vague answer the person can see.
Changing it can join two messages that were not about the same thing, and the answer then reads a
question the person never asked.

Ticket 02's answer decides how much the first way costs: if the reply path works, "use reply" is a
fix the person can act on.

Ticket 02 found the reply path works, 6 of 6. But only the Intent Read gets the Thread. The answer
model does not, and the mood question reached it only because a widened window happened to read
it back as a Capture. See
[Does a follow-up sent as a reply keep its question?](02-does-a-follow-up-sent-as-a-reply-keep-its-question.md).
So "use reply" is a fix only while the window widens. Whichever way this ticket goes, say whether
the answer call gets the Thread too, or rule that out of scope as v1.1 conversation work.

## Answer

**Change the rule.** Every message carries its Recent Exchange: the last 8 exchanges before it, both
sides, with no time limit. The model reads them and works out what the person means. Grilled with the
person on 2026-09-29. The decision is ADR 0051, a message carries its Recent Exchange.

### Why not keep the rule

The person's reason: a box that forgets the last message feels robotic. People do not press reply to
ask "and the day before?". Ticket 02 showed reply works, but only for the Intent Read, so "use reply"
was never a full fix.

### Why no `follows_on` field

The first proposal had the model return the one turn a message follows on from. The person rejected
it with this chain:

    Me:    Give me a list of things that Wife likes
    Agent: <list>
    Me:    Now give me a list of things that I like
    Agent: <list>
    Me:    Now can you merge both the lists and find common things that we both like?

The last message leans on two turns at once and names no subject of its own. One turn number cannot
hold that. So code does not pick turns. It sends all of them, and the model reads them as a person
would.

### What was decided

1. **One exchange** is one message from the person and the bot's reply to it. A plain note counts,
   so "tell me more about that" after a note works.
2. **8 exchanges by default**, as a Vault Setting. That is 16 messages, inside the 20 that the
   amendment to ADR 0028 (conversation finds Cards by matching words) already allowed a turn. No time
   limit: a follow-up can come hours later.
3. **Both calls get it.** The Intent Read and the answer call. Today `_prompt` at
   `memark/answering.py:937` takes no Thread at all. That changes too.
4. **Both sides.** The person's Captures and the bot's Agent Turns. "Merge both the lists" needs the
   lists, and only the bot's turns hold them.
5. **A subject may come from any turn in the Recent Exchange.** The Intent Read's `subjects` rule
   today allows only words the message wrote. It widens to words written in the message or in any turn
   of its Recent Exchange. Code still checks each subject letter for letter, against that wider text.
   The `question` field is unchanged: copied out of the new message only.
6. **The reply names what it carried over.** A subject that is not in the new message came from an
   earlier turn, and code can see that. The reply names it: "Things you and Wife both like: ...".
   This is what makes a wrong join visible, now that nothing limits how old a turn can be.
7. **No "reply to my message" hint.** The answer model sees the chat. When a message is still unclear,
   it can ask "Tuesday for what?" itself.
8. **A Telegram reply gets both.** Its Thread and its Recent Exchange. A turn in both is sent once. A
   reply to yesterday's Digest says which message is meant, and the Recent Exchange says what the
   person was just talking about.
9. **Filing does not change.** A Filing Run still drains a Thread built by reply only. If filing joined
   by recency, two unrelated notes sent close together would become one Card line, and that is hard to
   see and hard to undo.

### Words

**Recent Exchange** is a new term in `CONTEXT.md`. **Thread** keeps its meaning, the reply chain, and
loses "nothing is remembered between messages". **Agent Turn** is now read back to the model. It is
still not a Capture, and nothing may cite it.

### Out of this ticket

Finding B is fixed by this. Ticket 05 still decides who counts `yesterday`. The Recent Exchange does
not help with that.
