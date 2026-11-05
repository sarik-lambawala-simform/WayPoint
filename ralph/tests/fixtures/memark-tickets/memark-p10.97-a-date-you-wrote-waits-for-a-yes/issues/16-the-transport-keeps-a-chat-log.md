# 16. The Transport keeps a Chat Log

**Type:** task

**Status:** completed

**Completed at:** 2026-10-01T02:19:33Z

**Blocked by:** none

**What to build:** every message in the chat, both ways, is kept in a SQLite file on the laptop,
outside the Vault.

Spec: [../spec.md](../spec.md), "The Chat Log". Decided in
[Where does the bot's side of a Recent Exchange come from?](09-where-the-bots-side-of-a-recent-exchange-comes-from.md).
The rule is ADR 0054, the chat is kept in a local Chat Log.

## What happens today

The bot's replies exist only in Telegram. No code writes a bot turn anywhere.

## What to change

- A new module holds the Chat Log: `chat-log.sqlite` in `STATE_DIR` from `memark/box.py`, next to
  `telegram-offset`. Standard library `sqlite3`, WAL mode, a busy timeout, because `bot.py` and
  `run.py` both write it.
- One table, one row per message: message id, which way it went, text, the id it replied to, when it
  was sent, when it was last edited. An edit overwrites the text and sets the edit time.
- A message the box cannot take is kept with its kind and no text.
- A wrapper around any `Transport` writes the log on `receive`, `send` and `edit`, then hands the call
  on. `transport_for` in `memark/box.py` wraps the Telegram transport. The harness session in
  `harness/session.py` wraps `HarnessTransport`, with the log in the harness's own state directory.
- A long message sent in parts is one row per part.
- A failed log write is logged and does not stop the send.
- The docstrings in `memark/vault/inbox.py` that call a block with no id an Agent Turn now call it a
  block with no id, which is not a Capture. The fixture's hand-written `Noted. I will change it.`
  stays. See the spec's build section.

## Done when

- [ ] A received, a sent and an edited message each land with the right fields.
- [ ] An edit keeps one row with the latest text.
- [ ] A failing log write does not stop the send.
- [ ] Nothing under the Vault root changes when the log is written.
- [ ] The unit suite is green.
- [ ] It commits, with ADR 0054, the amendment to ADR 0029, and the `docs/stack/git-and-files.md` rule
      if no earlier commit carried them.
