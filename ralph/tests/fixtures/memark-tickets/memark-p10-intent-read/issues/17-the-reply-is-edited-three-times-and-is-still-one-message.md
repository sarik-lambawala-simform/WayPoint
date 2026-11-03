# 17 — The reply is edited three times and is still one message

**What to build:** you send one message and you get one reply back, which fills in as the box learns
more. You never get a wall of four separate bot messages.

One message per Capture survives, per ADR 0006, which made Telegram the only conversational surface. The
reply is a single message edited in place.

Four states, in order. The instant echo first, with no model call, which is proof your words were saved
even if the call then dies. An edit at a second or two naming the changes. An edit at ten seconds adding
the answer, where the message carried a Question. The Filing Run edits it once more, hours later, when
the block is filed. The typing indicator fills the gaps so the pauses read as work rather than as
silence.

Each state is written only when there is something to add. A message with no changes and no question is
echoed once and never edited by this path.

An edit that fails, because Telegram refused it or the message is too old, leaves the previous state
standing. The reply is never left empty and a failed edit is never retried into a second message.

**Blocked by:** 01 — The receipt order, and the first change end to end; 14 — The wider question rule.

**Status:** completed

**Completed at:** 2026-09-11T03:09:08Z

- [x] The echo is sent before any model call and is the message every later state edits.
- [x] The changes edit lands on the same message, not a new one.
- [x] The answer edit lands on the same message where the message carried a Question.
- [x] The Filing Run's later edit still finds and edits the same message.
- [x] The typing indicator is shown while a model call is in flight.
- [x] A message with no changes and no question is echoed and never edited by this path.
- [x] A failed edit leaves the previous state standing and sends no second message.
