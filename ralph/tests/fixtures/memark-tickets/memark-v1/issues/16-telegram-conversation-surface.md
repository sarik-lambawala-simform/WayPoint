# The conversation surface in Telegram

Map: [map.md](../map.md)
Type: grilling
Status: resolved

## Question

Graduated from the map's fog once ticket 08 removed the last thing it was waiting on. Everything
mechanical about conversation is now settled: a reply in the thread is what makes a message a turn
(ADR 0029), both sides are written, and a turn carries the last 20 messages of its Thread with the
search seeing your last three (ticket 08). What is left is presentation, and it is the part you
actually touch.

Decide:

- What a chat reply looks like next to a Digest and next to a "Recorded:" acknowledgement. Three
  message kinds now arrive in one Telegram chat, and only one of them is the once-a-day promise.
- Whether a reply streams or arrives whole. A two-cent call takes seconds, and a silent gap in a chat
  reads as a failure in a way it does not for a Digest.
- What the bot sends while it is thinking, if anything, given ADR 0029 removed the "Recorded:" echo
  from an answered turn on the grounds that the answer is the receipt.
- How the roughly forty answered messages a day cap is communicated when you hit it mid-chat, which
  ADR 0028 says is said out loud rather than absorbed by a weaker model.
- Whether naming sources in a weak-match answer (ADR 0028's whole observability story) has a shape
  that is readable on a phone, or becomes noise at the bottom of every reply.
- Telegram's own limits: message length, edit windows, and what happens to an answer longer than one
  message.

Presentation only. Nothing here may reopen a mechanism decision.

## Answer

Presentation only, as the ticket asked. Nothing below reopens a mechanism. Two ADRs are amended
because two of these answers contradict a sentence already written down.

### The rule the whole surface reduces to

**Every message you send gets exactly one reply, and an answer is one kind of reply.** Three of the
decisions below are just this rule applied in a place where it was about to break.

### Telling the three kinds apart

Three things now land in one chat and none of them needs a label. The echo starts with the word
`Recorded:`. The Digest has bold headings and an italic footer. A chat answer is plain prose sent as a
reply to your message, which is the only one that reads like a person talking. Labelling the message
meant to feel like talking is the wrong one to label, and Telegram already shows a reply against what
it replies to.

The Digest keeps its fixed time even if it lands mid-chat. Holding it until the chat goes quiet breaks
the daily rhythm that makes it a habit, and threading it into the conversation is worse: ADR 0021
resolves a number against a specific Digest by reply target, so burying the Digest inside a chat thread
makes replying to the right thing harder rather than easier.

### The answer arrives whole, with the typing indicator filling the gap

No streaming. Telegram has no real streaming, only repeated edits, and a chat is throttled to about one
action a second, so a faked stream comes out jerky and a call that dies halfway leaves a finished-looking
message stopping mid-sentence. That is a worse failure than a few seconds of quiet.

The quiet is filled by Telegram's own typing indicator, re-sent every four seconds until the answer
lands. It leaves nothing in the chat history, it clears itself when the message arrives, and it leaves no
litter when the call fails. A real "thinking..." message would be a bot message that is not an Agent Turn,
sits in no inbox block, and has to be cleaned up on failure.

### Sources on every answer, not only weak ones

**This is the amendment to ADR 0028.** That ADR says a weak match names the notes it used, and in the
same breath refuses a confidence threshold. Both cannot stand: with no threshold there is no test in code
for "weak", so nothing can branch on it.

So every answer ends with one short line. Cards by name, Captures by date, two Captures from one day
collapsed into one entry: `From: Priya (colleague), your note from 12 Aug`. No links, because Telegram
cannot open a note in the Vault. Always beats sometimes for a second reason too: a line that appears only
sometimes teaches you that its absence means "trust me", which hides the sources exactly when the answer
sounds most confident.

An answer that found nothing carries no line and says so in words. A name it has nothing on goes at the
**top** of the answer, not into the sources line. Two different jobs: the miss is a warning about the
answer you are about to read, the sources are a footnote for after.

### Plain text, and short

Chat answers are sent with no parse mode at all, and the model is told not to use markdown. The Digest
keeps its formatting and uses `HTML`, where three characters need escaping and the text is written by
code anyway. The split is the honest one: `MarkdownV2` needs about eighteen characters escaped and one
miss makes Telegram reject the whole message, and a model writing free prose produces dashes, dots and
brackets constantly. A chat reply is someone talking to you, and talking has no bold.

Length is handled the same way round. The real fix is telling the model to answer in a screen or two,
because a reply longer than that is a bad reply on a phone whatever Telegram allows. Under it sits a
backstop: over Telegram's 4,096 character cap the whole send is rejected and you get nothing, so text
still over the cap is split at paragraph breaks and sent in order, sources line on the last part.
Splitting rather than truncating, because the first thing truncation eats is the sources line at the end.

### The two carve-outs to "the answer is the receipt"

**This is the amendment to ADR 0029.** That ADR dropped the echo from an answered turn on the ground that
the answer is the receipt. Two places leave you with no receipt at all, and both are fixed inside the
answer rather than by sending a second message.

A **spoken** turn is quoted back on the first line of the answer. Transcription is a transport concern, so
a voice note is an ordinary chat turn, but the quote-back is where a mangled proper noun is caught and the
spec calls it load-bearing rather than a courtesy. Removing the echo removed the only place "Prya" was
ever visible for a spoken turn. Typed turns get nothing extra.

A **failed** answer falls back to the ordinary echo plus one line saying it could not answer this one.
Otherwise you get no answer and no receipt while the Capture has already been written, and silence reads
as the whole system being dead. The block goes on to filing and the journal unchanged.

### The cap

It counts every answering call **attempted**, not every answer that arrived, because a call failing
partway can still be paid for and the cap exists to protect money. It resets at local midnight, the
boundary ADR 0030 already draws to close a day, rather than on a rolling window you cannot reason about.
On reaching it the bot says so once, plainly, then goes quiet. Every later message still gets its ordinary
echo, so nothing looks broken, and repeating the line would turn a limit into nagging. No early warning at
thirty-five, because that spends a message on a wall you may never reach.

### Editing old messages, and what a refused edit does

Telegram's documented position: a text message caps at 4,096 UTF-8 characters; the typing indicator lasts
five seconds and clears when a message arrives; a chat allows about one action a second, shared across
sending, editing and typing; and there is **no documented time limit** on a bot editing a message it sent
itself. The 48-hour figure that circulates is about deletion.

So the system leans on editing its own old messages, which it already does: the echo is edited when filing
lands, ticket 08 stores the bot message number on the inbox block for that, and ticket 15 allows a Capture
to be written into a day up to thirty days back. Leaning on it is accepted, and a refused edit takes the
Stale Target path: drop the edit, count it on the Health Canary, send nothing. A fresh message would break
one-message-per-Capture and one-notification-a-day at once. In normal running the gap is hours, so this
should never fire.

### The worked example

A spoken chat turn, answered. Typing shows for a few seconds, then one message:

> "am i being unfair about this"
>
> You have mentioned three arguments with your mum since June, and each one started with her asking about
> the house. You called yourself unfair the last time too.
>
> From: Mum, your note from 12 Aug

Nothing matched:

> I do not know what you are referring to. Nothing in your notes shares a word with that. Who is it about?

A name it has nothing on:

> I have nothing on Dev.
>
> On Priya, you noted last week that her mum's hip operation is in March and she is dreading it.
>
> From: Priya (colleague)

The cap, said once:

> That is about forty answers today, which is the daily limit. I am still saving everything you send.
> Answers start again after midnight.

The answer failed:

> Recorded: "am i being unfair about this"
> I could not answer that one. It is saved.

### One thing checked and found already settled

Whether `done 2` sent mid-chat is a Command or a chat turn looked like a gap during the session. It is
not: ADR 0029 already states that a Command is checked first with its strict pattern unchanged, and that
a Command sent as a reply to a bot chat message resolves against the newest Digest, because a chat message
carries no footer and its reply target tells us nothing. Nothing to carry to ticket 13.

Amended ADR 0028 and ADR 0029. No new ADR and no new term.
