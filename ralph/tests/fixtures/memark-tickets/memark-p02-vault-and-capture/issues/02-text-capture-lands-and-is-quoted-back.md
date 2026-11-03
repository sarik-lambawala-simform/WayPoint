# 02 — A text Capture lands in today's inbox and is quoted back

**What to build:** I send a text message and it is permanently recorded, then quoted straight back to
me. The message handler appends the whole message to `inbox/YYYY/MM/YYYY-MM-DD.md` as one block
carrying its Send Time, the text verbatim, an `ack::` field holding the number of the bot's reply, and
a block id. The block is never cut into pieces. The reply is one message reading `Recorded:` followed
by my own words, with no model call, sent as a reply to the original so it sits where I would look.

`/start` gets a fixed greeting, writes nothing to the inbox and makes no model call. It is neither a
Command nor a Capture.

This ticket also builds the one writer the whole system uses. It records a SHA-256 for every file it
reads and re-checks that hash immediately before applying, per ADR 0009, and writes atomically by
writing a temp file beside the target and replacing it. The inbox is appended to and never rewritten.
Top-level folders are fixed at ADR 0001 and nothing may invent one; date-keyed folders nest
`YYYY/MM/YYYY-MM-DD.md` and are created on demand. `areas/loose-ends.md` is reserved by name and
created on first use.

Everything here is tested through the message handler with a recording transport that captures
outbound messages instead of sending them, a temp-directory Vault, and a frozen clock.

**Blocked by:** 01 — Box Settings and the day module.

**Status:** completed

**Completed at:** 2026-08-30T21:59:46Z

- [ ] A text Capture creates the inbox file at the dated path and the block carries the Send Time, the
      text verbatim, an `ack::` and a block id.
- [ ] The reply quotes the message back after `Recorded:` and is a reply to the original message.
- [ ] A message containing markdown, brackets and a `::` is stored verbatim and the reply is not
      mangled.
- [ ] A multi-paragraph message is one block and is never cut into pieces.
- [ ] Two Captures in the same minute both appear, with distinct block ids.
- [ ] A Capture into an existing inbox file appends at the end and leaves earlier lines byte for byte
      unchanged.
- [ ] `/start` sends the fixed greeting, writes no inbox file, and makes no model call.
- [ ] The writer records a hash for every file it reads. A file changed on disk between the read and
      the write fails the write and reports, rather than overwriting.
- [ ] A write is atomic: a half-written file is never left behind.
- [ ] A Capture into an empty Vault works, creating the folders it needs and nothing else.
