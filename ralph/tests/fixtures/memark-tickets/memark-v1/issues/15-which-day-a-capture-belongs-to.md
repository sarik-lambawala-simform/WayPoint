# Which day a Capture belongs to

Map: [map.md](../map.md)
Type: grilling
Status: resolved

## Question

Story 6 has Telegram hold Captures while the phone is offline, so a Capture sent at 23:50 on the 24th
can reach the box at 08:00 on the 25th. The spec shows a Capture appended to `inbox/2026-08-24.md` as
`- 21:14 <text> ^d4e1` but never says where that day and that time come from: the Telegram message
timestamp, or the moment the box received it.

Nothing depended on the answer until now. Ticket 03 makes it visible. A Journal Entry is the narrative
of one day built from that day's inbox file, so a late-delivered Capture filed under the wrong day is a
thought missing from the day you had it and appearing in a day you did not. ADR 0022 fixes what a day
*is* (one configured timezone, calendar dates only) but not which instant gets dated.

Decide:

- Which timestamp dates a Capture, and therefore which inbox file it is appended to.
- Whether the `21:14` prefix on the line is the send time or the receipt time, and what it shows when
  they differ.
- What happens to a Capture whose day already has a Journal Entry. Ticket 03 settled that an entry is
  **never regenerated**, so a late Capture for a closed day either misses its journal permanently, or
  forces an exception to that rule, or lands in the day it arrived. This is the real cost of the
  decision and the reason the ticket exists.
- Whether an inbox file is ever appended to after its day has passed at all, given ADR 0001 makes inbox
  files append-only and never relocated.

## Comments

**From ticket 04 (journal generation).** The third bullet is now a stated trade rather than an open
question. A Journal Entry is a snapshot of the inbox file as it stood when the entry was written, and a
later Capture never reopens it. So send time means a late Capture is permanently absent from the journal
of the day it belongs to, and this ticket has to argue that cost. Receipt time means no journal is ever
stale and the cost lands on the inbox instead. Ticket 04 does not pick between them.

**From ticket 07 (conversation turns).** A Thread is a reply chain nested in one inbox file, and nesting
cannot span two files. So a chat crossing midnight forces this ticket's hand in a new place: a turn sent
at 00:10 replies to a block in yesterday's file. Either the turn goes in yesterday's file, which appends
to a day that has passed and may already have a Journal Entry, or it starts a fresh top-level block in
today's file and the Thread is silently cut in half, which loses the one fact nesting exists to record
and makes filing treat five turns as two units. Send time versus receipt time is not the only axis here:
a Thread's day may need to be the day its **first** turn landed, whatever the clock says later. See
[ADR 0029](../../../docs/adr/0029-both-sides-of-a-conversation-are-written-only-yours-can-be-cited.md).

## Answer

**A Capture is dated by its Send Time while that day is still open, and by Receipt Time otherwise.**
Wrote [ADR 0030](../../../docs/adr/0030-a-capture-is-dated-by-when-it-was-sent.md).

**The vendor came out of the vocabulary first.** The ticket framed this as Telegram time against
receipt time, and naming a transport in a dating rule is what would make a future front end a rewrite
rather than an adapter. The domain has **Send Time** and **Receipt Time**; every transport returns both,
and one that cannot know Send Time returns Receipt Time for both. That degraded case is a normal path,
not a fault: the two times are equal, the open-day test always passes, and the system behaves as though
only the box clock existed. ADR 0006 is untouched, and ADR 0030 names no vendor.

**The ticket's own framing was half wrong, and saying so shrinks the problem.** There are three clocks,
not two: when you spoke, when the transport took the message, when the box pulled it. The first is not
available from any transport. A phone that is offline holds the message and the send is stamped on
reconnect. So the 23:50-to-08:00 case in the ticket mostly dissolves for a phone outage and belongs
almost entirely to a box outage, where the gap is hours or days rather than minutes. ADR 0030 says this
out loud, because "the time I had the thought" is the natural misreading of Send Time and would be
promised by accident otherwise.

**The open-day test costs no new state.** A day is open while `journal/` holds no entry for it. ADR 0027
already requires an entry for every past day, so the file that existed to be read by a human now also
gates a write, and ADR 0020's no-second-store rule is untouched. This is what lets the answer take the
honest filing without touching ADR 0027's never-regenerated rule: a closed day is simply never written
to, so nothing reopens. The snapshot rule survives for the case it was written for, and the new case,
a late Capture on a still-open day, is indistinguishable from an early one when the entry is finally
written, backfill included.

**The two windows had to be one number, and the reason is filing rather than tidiness.** The session
first settled on no cap for the open-day test and a 30-day scan for finding unfiled blocks, and those
disagree past 30 days: during a long journal outage a Capture could be written into day 40, which the
scan never reaches, leaving it unfiled forever with nothing reporting it. So the write side takes the
same 30-day bound, the figure ADR 0022 already uses for its backward reach. One number, used by both
sides. This also settles a question the spec had left open, that filing finds work by scanning the last
30 days of inbox files for blocks with no `filed::` field, rather than only today's file, which would
have lost every late Capture silently.

**On the second bullet.** The time on the line is Send Time, always, so the number you read is your time
rather than our plumbing. Where the two differ by more than a minute the block carries `received:: <ISO>`
as an ordinary ADR 0027 inbox field, which is already stripped before the journal and Lookup see the
text. The acknowledgement adds one line naming the day when it is not today, and stays silent otherwise:
that reply is the one moment a wrong day can be caught, and it is already edited later by filing, so
this is not a new mechanism.

**On the fourth bullet.** Yes, a past inbox file is appended to, and the cost is that lines are not in
time order. Sorting is a rewrite, which ADR 0001 forbids, and no reader depends on inbox order: the
journal reads the whole day and Lookup reads blocks. ADR 0001 gains a paragraph saying so, because
"append-only" was being read as "closed once the day ends" and it never meant that.

**The third bullet had already been answered elsewhere, and the comment from ticket 07 is now resolved
too.** ADR 0027's ticket 08 amendment says every chat turn is written into today's file whatever it
replies to, chained by stored message numbers rather than by nesting. That stands, so this decision is
deliberately a **second rule**, stated rather than left to be worked out: the chat rule protects a
Thread from being split across two files, this rule protects a day from being rewritten. A plain Capture
has no nesting to protect. The honest cost is that a reader of the spec meets two dating rules and has
to be told why, which ADR 0030 does in its closing paragraph.

Amended ADR 0027 and ADR 0001. New `CONTEXT.md` terms Send Time, Receipt Time and Closed Day.
