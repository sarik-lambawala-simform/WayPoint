# Where does the bot's side of a Recent Exchange come from?

Type: grilling
Status: resolved

## Question

[What does a follow-up without a reply get?](03-what-does-a-follow-up-without-a-reply-get.md)
decided that a Recent Exchange holds both sides: the person's Captures and the bot's Agent Turns.
"Merge both the lists" needs the lists, and only the bot's turns hold them. ADR 0051 (a message
carries its Recent Exchange) says Agent Turns "existed only for the Journal Entry" and are now read
back to the model.

**The box never writes an Agent Turn.** Found while writing the spec, on 2026-09-30:

- ADR 0029 (both sides of a conversation are written, only yours can be cited) says a bot turn is
  appended to the inbox with no block id. That half was never built.
- `append_capture` in `memark/vault/apply.py:440` is the only code that adds a block to the inbox.
  It writes the person's message only. No code writes a block with no id.
- `memark/journal.py` reads no bot turn. The one Agent Turn on disk is hand-written in
  `tests/fixtures/baseline/inbox/2026/08/2026-08-24.md`.
- The bot's reply exists only in Telegram. The Bot API gives no chat history, so the box cannot
  read it back from there.

So the Recent Exchange has no bot side to read. Ticket 03's "merge both the lists" example fails.

Two facts make this more than "write the reply down":

- **A reply changes after it is sent.** A note's reply is `Recorded: ...` at first. The filing run
  edits it later with `transport.edit` at `memark/filing.py:561`, to add lines like
  `✅ Loose Ends: order hand blender, on 08 Oct 2026`. A question's answer is also an edit of the
  acknowledgement. Which text is the Agent Turn: the first, the last, or each one?
- **The inbox is append-only.** `docs/stack/git-and-files.md` allows an append and five named field
  writes, and nothing else. ADR 0029 nests a later turn as a sub-bullet under its Capture. A turn
  written by a later filing run lands after other Captures, not under its own.

Settle:

- Where the bot's text is kept: as an Agent Turn in the inbox, as ADR 0029 says, or somewhere else.
- Which text of an edited reply it holds, and who writes it: the handler, the filing run, or the
  transport.
- Whether this needs an amendment to ADR 0029 or a new ADR, and a change to
  `docs/stack/git-and-files.md`.

## Answer

**A local Chat Log, not the inbox.** The Transport writes every message, both ways, to a SQLite file
in `~/.memark/`, next to `telegram-offset`. It is outside the Vault and never committed. Grilled with
the person on 2026-09-30. The decision is ADR 0054, the chat is kept in a local Chat Log. ADR 0029
and ADR 0051 each get an amendment.

### Why not the inbox

The person wants a whole copy of the chat for two later uses: a backup of the Telegram chat, and a
restore into another messenger if the box moves off Telegram. The inbox cannot hold an edited reply,
because it is append-only. And an Agent Turn in the inbox puts the bot's prose in the Vault for good.

### What was decided

1. **Where:** a SQLite Chat Log at `~/.memark/`. The inbox stays the only home of a Capture. Losing
   the log costs the next message its Recent Exchange and nothing else.
2. **Who writes it:** the Transport, on each receive, send and edit. So Digests, Canary pings, Command
   replies and filing edits from `run.py` are logged too. The handler alone would miss them.
3. **Which text:** only the latest, plus the time of the last edit. The filing run's
   `✅ Loose Ends: ...` line is in it, because it is in the chat. No version history.
4. **What it holds:** each message, which message it replied to, when it was sent. A voice note is
   its transcript. No audio.
5. **Who reads it:** the Recent Exchange, both sides, as one list in order. A Command and its reply
   count as an exchange. Filing, Lookup, the Digest and the Journal Entry read the inbox as before.
6. **The Journal Entry** still reads your side only. ADR 0027 is unchanged. ADR 0029's reason for
   writing bot turns, the journal, is given up.
7. **No git.** The raw `.sqlite` file never goes into git: git stores binary badly, a commit can
   catch it mid-write, and the Vault stages only markdown. A backup is later work, as a text export.

### Files changed in this session

- `docs/adr/0054-the-chat-is-kept-in-a-local-chat-log.md`, new.
- Amendments at the end of ADR 0029 and ADR 0051.
- `CONTEXT.md`: new **Chat Log** term. **Agent Turn** is now a Chat Log row, never an inbox block.
  **Recent Exchange** reads both sides from the Chat Log.
- `docs/stack/git-and-files.md`: one rule, the inbox holds your side only and the Chat Log is never
  staged.

### For the spec

- The hand-written Agent Turn in `tests/fixtures/baseline/inbox/2026/08/2026-08-24.md` no longer
  matches the model. The spec says whether the fixture drops it.
- The Chat Log's table layout, and the `Transport` change in `memark/transport/__init__.py`, are
  spec detail.
