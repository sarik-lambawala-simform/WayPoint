# What happens if the First Loop fails the Checkpoint

Map: [map.md](../map.md)
Type: grilling
Status: resolved
Blocked by: 11

## Question

Ticket 11 set the pass condition and reframed the gate: the Checkpoint no longer decides what gets
built, it decides whether you keep spending. That leaves the other branch unwritten, and the spec's new
section cannot state one branch and stay quiet on the other.

- **What "stop and look at the capture path" actually means.** Ticket 11 used the phrase and did not
  cash it out. Name the moves available: change how Capture is triggered, change the acknowledgement,
  change the Digest's time of day, cut the Digest to something shorter, or stop.
- **Which of the three numbers failing means what.** They fail for different reasons. Capture days
  failing is the habit. Digest replies failing may only be the proxy undercounting, since ticket 11
  accepted that a quiet Digest is read and gets no reply. Retrieval failing is already handled by ADR
  0028's escalation ladder and is not a habit signal at all. So a single pass/fail verdict is probably
  wrong, and each number needs its own branch.
- **Whether the fortnight can be extended or re-run**, and what stops that becoming an endless
  "one more week" that never returns a verdict.
- **What is kept if you stop.** The Vault is git-backed markdown and readable in Obsidian without any
  of this, which is a real answer rather than a consolation.

## Answer

### The Checkpoint reads two numbers, not three

Retrieval comes out of the Checkpoint's verdict. It was never a habit signal. It measures whether word
matching works against a real Vault, and ADR 0028 already owns that test end to end: the same twenty
messages, the same trigger of missing more than about a quarter, the same fix ladder of reordering by
the link graph first and embeddings only after, and a second run at roughly 200 Cards. The Checkpoint
was borrowing a number another decision already knew what to do about.

The timing does not move. The twenty messages are still written right after seeding and before the clock
starts, and the test is still run on Checkpoint day, because that is the first day a real Vault exists.
It just reads as ADR 0028's scheduled test rather than as a Checkpoint number.

The reason this matters is the failure it prevents. A combined verdict lets a retrieval problem, which
is a code problem with a known fix, read as "you did not form the habit" and kill the project. That is
the worst mistake this gate can make, and one verdict over three numbers makes it available.

So the Checkpoint is Capture days and Digest replies. `CONTEXT.md`'s Checkpoint entry is amended to say
two numbers.

### Each number gets its own reading and its own branch

They fail for different reasons, so a single pass/fail is wrong.

**Capture days.** Pass is a Capture on 5 of week two's 7 days, unchanged. The fail range is split,
because 4 of 7 and 0 of 7 are not the same event.

- **0 to 2 days: stop.** Two days in a week is not a habit that nearly formed, it is one that did not
  start, and no change to a trigger fixes that.
- **3 to 4 days: change one thing and re-run.** One thing, not two, so the next reading says which
  change did it.

The capture-side moves are only two, and naming them is the whole of what "stop and look at the capture
path" means. Change how a Capture is triggered: voice first instead of text, a pinned chat, a home
screen shortcut. Or change what comes back when you send one, which is the quote-back.

**Digest replies.** This one is amended against ticket 11. Ticket 11 set the bar at three across the
fortnight and admitted in the same breath that the number undercounts, because a quiet Digest with
nothing to act on is read and gets no reply. A reading of 2 could be "not read" or "read every day,
nothing needed doing", and nothing distinguishes them. A bar we cannot defend should not gate anything.

So three stays as the thing you hope for and **only zero is a fail**. One or two triggers nothing. Zero
in fourteen days means it is not being read, whatever you would tell yourself on day fourteen, and that
is the one claim ticket 11 made here that survives.

The Digest-side moves are also two: change the time of day it is sent, or cut it shorter.

### Stopping is real, and only one number can trigger it

Ticket 11 killed Stage 0 because withholding was theatre. The same test applies to the word "stop", and
it survives, but only on the capture side. If Captures are not being sent the system has no input and
nothing else matters. A retrieval miss or a reply count never justifies stopping, because both have
known fixes that do not depend on you changing.

### What is kept if you stop

Cron and the Telegram bot go off. Nothing is deleted. The Vault is markdown in git and Obsidian opens it
without any of this, so every Card, every Capture and every Journal Entry stays exactly where it is. What
you lose is the daily message. That is a real answer rather than a consolation, and the spec should say it
in those terms.

The stop is still written to `checkpoint-01.md`, same as a pass, because ADR 0028 runs its test again at
about 200 Cards and comparing two runs needs the first one on paper.

### The guard against "one more week"

Three rules, and they close both loops.

**The first fortnight is never extended.** The reading is taken on the date, on whatever the fourteen days
actually were. There is always a reason the fortnight was not representative, which is exactly why an
extension is the start of the endless version. Extending is deciding before you look. A re-run is a thing
you choose after seeing a number.

**Exactly one re-run, and it is one week.** One, because a cap of two is a cap you argue past and one has
no room in it. One week rather than two, because the reason week one was ignored the first time was that
a new toy always gets used, and by then the system is four weeks old and nothing about it is new. Same
bar, 5 of 7 days. It is triggered only by a 3 to 4 capture-day reading. The result goes to
`checkpoint-02.md`.

**Fail the re-run and you stop.** No third reading and no further change. Four weeks and one deliberate
change did not produce the habit.

The other loop is closed by giving it no door. A Digest-replies zero never re-runs and never stops
anything. You make one Digest-side change and log it as an open design question in `checkpoint-01.md`,
to be looked at again at ADR 0028's 200-Card reading, which is already scheduled. There is no such thing
as a Digest re-run, so there is nothing to extend.

### The spec edit

All of this lands in the **The First Loop and the Checkpoint** section that ticket 11 created. No new
ADR: this is a policy for a one-time reading, cheap to reverse, and its substance already sits in
ADR 0017, ADR 0028 and the two `CONTEXT.md` terms. Ticket 11's own "no new ADR" holds.

Two edits ride along. `CONTEXT.md`'s Checkpoint entry drops to two numbers. And ADR 0028 is untouched,
but the spec should say plainly that the twenty-message test is ADR 0028's and runs on the same day
rather than being a Checkpoint number, so a later reader does not put it back.
