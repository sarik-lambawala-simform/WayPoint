# 03 — The real Telegram transport and the long-polling bot

**What to build:** the bot process runs against a real Telegram chat. I send a message from my phone
and the quoted reply arrives in under a second. While the box is off, Telegram holds my messages, and
they land when it comes back, inside the one-day horizon Telegram keeps them for.

The transport can do four things and they are all correctness rather than polish: send a message,
receive one, edit a message it has already sent, and carry a reply chain. No Telegram type reaches the
Vault module, which is handed plain values only. Everything Telegram-shaped lives in the transport, so
no other module knows what a chat id is.

The bot long-polls with `getUpdates`. There is no webhook, no port and no public address, so the box
needs no inbound network access at all. The update offset is persisted only after the write to the
inbox has succeeded, because acknowledging an update that is not yet stored loses it.

A voice note is answered with an "unsupported for now" reply rather than being dropped silently.

**Blocked by:** 02 — A text Capture lands in today's inbox and is quoted back.

**Status:** completed

**Completed at:** 2026-08-30T22:10:19Z

- [ ] The transport implements send, receive, edit and reply chain against the real Telegram API.
- [ ] A real message sent from a phone is appended and quoted back, and the round trip is under a
      second.
- [ ] The bot long-polls. No webhook, no listening port, every connection outbound.
- [ ] The update offset advances only after the inbox write succeeds. A crash between receiving and
      writing re-delivers the update rather than losing it.
- [ ] The message id of every reply is kept and written as `ack::` on the block, so a later run in a
      different process can edit that reply in place.
- [ ] Editing a message already sent works against the real API, and a refused edit is counted and
      logged rather than crashing or passing silently.
- [ ] A voice note gets an "unsupported" reply and nothing is written to the inbox.
- [ ] No Telegram-shaped type or chat id appears outside the transport module.
