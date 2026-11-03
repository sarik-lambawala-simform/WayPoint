# 06 — The answer arrives whole and in plain text

**What to build:** an answer that is never half an answer. It appears complete or not at all, the chat
does not look frozen while it is being written, and Telegram never refuses to show it.

Telegram has no real streaming, and a faked one is worse than none: a finished-looking message that
stops mid-sentence when a call dies. So the answer arrives whole. The gap is filled by the typing
indicator, re-sent every four seconds, because Telegram expires it.

Chat answers are plain text with no parse mode, and the model is told not to use markdown. One
unescaped character makes Telegram reject the whole message, which turns a good answer into no answer.
This follows ADR 0006, which made Telegram the only conversational surface and so made its limits the
system's limits.

Text over the 4,096 character cap is split at paragraph breaks, with the sources line on the last
part. The order matters: the first thing truncation eats is the sources line, and an answer without
its sources is an answer I cannot check.

**Blocked by:** 01 — A Question about a named subject is answered, and still saved.

**Status:** completed

**Completed at:** 2026-09-08T20:47:23Z

- [ ] While an answering call is in flight, the typing indicator is sent and re-sent about every four
      seconds, and it stops when the reply lands.
- [ ] The reply is sent with no parse mode.
- [ ] An answer longer than 4,096 characters is split at paragraph breaks, and no part exceeds the cap.
- [ ] The sources line is on the last part.
- [ ] A call that fails mid-answer leaves no partial answer in the chat, and the acknowledgement is
      still there.
