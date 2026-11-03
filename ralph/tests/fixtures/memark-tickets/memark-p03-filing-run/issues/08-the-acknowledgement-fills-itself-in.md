# 08 — The acknowledgement fills itself in

**What to build:** I send a thought, get the instant quote-back that phase 2 built, and a few hours
later that same message in Telegram has grown a line saying where the thought landed. I catch a
mis-filing or a misheard name while I still remember sending it, which is the entire reason filing runs
every three hours instead of nightly, per ADR 0024.

When a run files a Capture it edits that Capture's original reply in place, adding where it went, for
example `→ Priya (colleague): wants a santoku knife`. The block already carries the `ack::` field with
the message id, so nothing new is stored to make this possible. The edit raises no notification, which
is what keeps the daily Digest the only thing that ever interrupts me.

A fresh message is never sent, because one message per Capture is the rule the acknowledgement design
rests on and a second message breaks it. So a refused edit takes the Stale Target path: drop it, count
it, send nothing. Telegram refuses an edit on a message that is too old or was deleted, and the honest
answer there is silence and a number in the log rather than a stray message.

**Blocked by:** 02 — The edit schema, the filing call, and a Capture becoming a new Card.

**Status:** completed

**Completed at:** 2026-09-01T10:10:43Z

- [ ] A Capture filed by a run has its acknowledgement message edited in place, and the test asserts the
      recording transport saw an edit and no second send.
- [ ] The edited text names where the Capture landed, including the Card's distinguishing name.
- [ ] A refused edit is counted and nothing else is sent, and the run still commits.
- [ ] A Capture held back by ambiguity or contradiction gets no acknowledgement edit, because it landed
      nowhere.
- [ ] The message id comes from the `ack::` field on the block, and no new file or field is written to
      support this.
