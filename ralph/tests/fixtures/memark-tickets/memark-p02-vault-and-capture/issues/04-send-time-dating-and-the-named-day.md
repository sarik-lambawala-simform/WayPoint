# 04 — Send Time dating and the day named in the acknowledgement

**What to build:** a Capture lands in the day I had the thought, not the day the box collected it. Per
ADR 0030 a Capture is dated by its Send Time while that day is still open. A day is open while
`journal/` holds no entry for it, and until phase 6 writes journal entries every past day is open.
So a message sent at 23:58 that the box takes in at 00:03 is appended to the earlier day's inbox file.

A past file gains lines at its end, so a 23:50 line can sit after a 23:55 one. That is accepted:
sorting would be a rewrite, which ADR 0001 forbids, and no reader depends on inbox order.

Send Time is when the message left the sender's side as reported by the transport. Receipt Time is
when the box took it in, from the box clock. A transport that cannot know Send Time returns Receipt
Time for both, which is a normal path and not a fault. Where the two differ by more than a minute the
block also carries `received::`. The time printed on the line is always Send Time.

Because I cannot check a file from my phone, the acknowledgement adds one line naming the day when the
day is not today, and says nothing about the day when it is today. That line is the one moment I could
say otherwise.

**Blocked by:** 02 — A text Capture lands in today's inbox and is quoted back.

**Status:** completed

**Completed at:** 2026-08-30T22:18:39Z

- [ ] A Capture whose Send Time falls on yesterday is appended to yesterday's inbox file.
- [ ] The acknowledgement for a Capture filed under a past day names that day, in the configured date
      display format.
- [ ] The acknowledgement for a Capture filed under today names no day.
- [ ] Send Time and Receipt Time differing by more than a minute writes `received::` on the block;
      differing by seconds does not.
- [ ] A transport reporting no Send Time uses Receipt Time for both and nothing fails or warns.
- [ ] The time printed on the block line is always Send Time.
- [ ] The open-day test reads `journal/` for an entry, so it is the same test phase 6 will narrow, not
      a stub to be replaced.
- [ ] Appending to a past file adds at the end and never re-sorts or rewrites the file.
