# The backlog and the offline horizon: how far back can the system reach

Map: [map.md](../map.md)
Type: grilling
Status: resolved

## Question

Two stories promise that being away costs nothing. Story 6: *"I want Captures to be held by Telegram
until the system collects them, so that nothing is lost when my server is down."* Story 63: *"I want
Captures to accumulate and be filed correctly on return, so that a gap in attention does not create a
backlog I must process by hand."* Neither names a limit.

The prompting case: **sixty days away, the laptop off the whole time, messages sent to Telegram every
day.** On return, what is recoverable?

That question splits into two failures that look identical from the chat and have completely different
answers. The spec treats them as one.

### Failure A: the box was off

Nothing was ever written. No inbox block exists, so filing has nothing to scan and the 30-day window is
irrelevant. Everything depends on whether Telegram still holds the updates.

**It does not, beyond about 24 hours.** The Bot API's documented behaviour is that undelivered updates
are stored on the server and not kept longer than 24 hours; a webhook is retried over the same window and
then dropped. If that is right, story 6 holds for a bad connection and an overnight outage and fails
completely for a holiday. Sixty days away with the box off would return at most the last day, with no
record that anything preceded it.

**First job of this ticket is to confirm that number against the current Bot API documentation rather
than from memory.** Everything below changes shape depending on the answer, and it is the only load-
bearing external fact in this effort that was assumed rather than checked.

### Failure B: the box was on, filing was not

Blocks exist in the inbox. Nothing is lost. But filing finds its work by scanning **the last 30 days** of
inbox files for blocks with no `filed::` field. On day 31 an unfiled block stops being scanned. It is not
marked, not reported, not declined. It simply stops being asked about, and the words sit in the inbox
forever with nothing pointing back at them.

Any Capture held back by ADR 0015 as an Ambiguous Subject or by ADR 0010 as a Contradiction takes exactly
this path, and [ticket 18](18-one-message-many-intents.md) establishes that the Ambiguous Subject case
cannot currently be resolved at all. So the abandonment is not a rare edge: it is the default ending for
every question the Digest asks and cannot receive an answer to.

**`catchup` does not help.** It clears the *journal* backlog only, and its scope is every past day with
an inbox file and no Journal Entry. There is no equivalent verb for filing.

### What the 30 is actually protecting

Worth stating precisely, because it constrains the fix less than it first appears. The spec's reasoning:
*"if the write side could reach further back than the scan side, a Capture written into day 40 during a
long journal outage would sit unfiled forever."* The requirement is **scan reach at least as far as write
reach**. It is not a requirement that they be equal. Widening the scan alone breaks nothing, and scanning
is file reads with no model call, since no model ever sees a block that is already filed.

So "one number, three places" is a tidiness argument here rather than a correctness one, and it should be
re-examined rather than inherited.

Decide:

- **Whether filing gets a `catchup` of its own.** Bounded by the inbox the way the journal's is: every
  block anywhere with no `filed::` field. Same cost shape as the journal catch-up, which is the lock
  rather than the money, and the same argument applies that it is acceptable when you asked for it.
- **Whether the scan window widens permanently instead.** If scanning further back is genuinely cheap,
  the cliff can be removed rather than given an escape hatch. Price the file reads at five years of
  inbox files before assuming.
- **What a Capture abandoned at the cliff should leave behind.** Nothing today. At minimum this belongs
  on the Health Canary as a count of blocks that aged out unfiled, because every other failure in this
  system is designed to announce itself and this one is silent.
- **Whether the box knows how long it was off, and says so.** It can: the newest Digest and the newest
  inbox block both carry dates. A return message saying "I was off for 60 days; anything sent before
  <date> did not reach me" is cheap, needs no model, and converts a silent data loss into a stated one.
  This is the same reasoning that makes the Health Canary code-composed.
- **Whether a second capture path is worth it, given Failure A.** The severe case is not solvable inside
  the Vault at all: if Telegram drops updates after a day, no amount of scanning recovers them. The
  honest options are a small always-on relay that collects updates and holds them for the box, or
  accepting the limit and saying it out loud in the spec where story 6 currently implies otherwise. Both
  are real answers. Choosing neither is what is happening now.
- **What the off-box liveness ping should do about a long silence.** ADR 0017 puts liveness reporting
  outside the box precisely so a dead box is noticed. A box dead for a day is already a data-loss event
  under Failure A, which raises the stakes on how fast that notice reaches you and by what route.

Likely amends stories 6 and 63, ADR 0022's 30-day reach, ADR 0017, the Health Canary's contents and the
spec's Running Unattended section. May need a new ADR. Feeds a re-run of
[ticket 13](13-amend-the-spec.md).

## Answer

**Telegram forgets after a day, so the box cannot reach further back than a day on its own. You reach
back instead, and the system tells you when you need to.** The two failures split into two decisions
that share nothing but the story they were hiding under.

**The 24 hours is real and documented.** The Bot API's getUpdates section says updates "are stored on
the server until the bot receives them either way, but they will not be kept longer than 24 hours". The
bot long-polls rather than using a webhook, so no retry window softens it. There is also no
getChatHistory and no getMessages, so a bot can never ask for what it missed. Story 6 was false for any
absence past a day and said nothing about it.

**The fact the ticket did not have: Telegram did not lose the messages, only the delivery.** Your own
chat history sits in Telegram's cloud with no expiry. So recovery is a transfer, not a reconstruction,
and it needs no relay and no second box. Two routes carry it, both inside Telegram, which is why a
failure mode that looks like it must break the Telegram-only rule does not. Forwarding for a gap of
days, since forward_origin carries the original Send Time on all four MessageOrigin types. The desktop
client's JSON export sent to the bot as a document for a long absence, since date_unixtime is on every
message and the 20 MB download limit is nowhere near a text-only export. A forward counts as Recovery
only when its origin is a **user**, which refuses channel and group forwards by a field that already
exists and leaves that whole space free for a forwarding feature later. That was the human's objection
and it turned into the rule.

**The real client API was found, costed and declined.** messages.getHistory as your own account reads
the chat back to its beginning and would make Recovery automatic. It was declined on the credential, not
the capability: a bot token speaks in one chat, a user session on the box reads and writes every chat in
the account, and that is a large permanent risk for an event that may never happen. Recorded as the
named escalation with a behavioural trigger, in ADR 0002's style. Business connections were checked and
are a dead end: a connected bot sees only messages sent after the connection.

**A restored Capture is not a new one.** No Intent Read, so a sixty-day-old "remind me tomorrow" cannot
write a date fifty-nine days in the past; the honest cost is that an instruction sent during the absence
survives only as words. Duplicates dropped on exact Send Time plus text, which makes a wrong export
range harmless. One reply per batch, written down as an explicit exception to ticket 16's
one-reply-per-message rule rather than allowed to bend quietly.

**The session's sharpest find, and it came from the human: the journal would have shut the door before
anyone reached it.** ADR 0027 wrote a file for every calendar day so a missing file always meant a
fault, which meant a box off for sixty days would wake, journal sixty days as empty, close all of them,
and void the whole recovery path. Those entries would also be lies. The box does not know nothing was
captured, only that nothing arrived. So the journal now writes a day only when that day has an inbox
file. The fault signal gets **stronger**, not weaker: a journal file exists exactly when the inbox file
does, which is a pairing the Canary can check, where presence alone could not say which file was
missing. It also removes a duplication ticket 19 had already made, since a quiet day was already read
from the absence of an inbox file.

**That let the 30-day write window go entirely.** An open day is now the whole test, and a day the box
slept through is open forever. A restored Capture landing on a day that *is* closed goes onto today
carrying its true Send Time, because losing the thought is the failure this ticket exists to fix and
regenerating an entry is a rule ADR 0027 will not bend. The cost: those Captures sit on the wrong day
for recall by date and are reachable only by their words.

**Failure B: the cliff goes, and the bound moves off time and onto asking.** Filing scans the whole
inbox, and no `refile` verb is added, because the complaint is that the cliff is *silent* and a verb you
must know to type cannot fix that. The reads were never the cost. The cost is that an unfilable block
would be sent to the model roughly eight times a day forever, which also breaks a property the system
had for free: a day with no new Captures currently costs nothing. So an unfiled block carries
`shown:: N`, reusing ADR 0034's field and meaning, and after fourteen asks code writes `filed:: parked`
and stops sending it. Fourteen is a fortnight, which is already this design's unit, and it is written
into the spec as the guess it is.

**Parking needed a door back, and finding that was the last hole.** Parking marks a block as filed and
filing looks for blocks that are not, so `pick` could no longer reach it and a limit meant to stop a
cost would have been making a decision instead. `unpark` returns every parked block at once, takes no
argument, and is discoverable only because the Canary counts them. Date Requests do not park and the
exclusion is by construction rather than exception: they are lines in a Date File, so the scan never
sees them, which is what keeps ticket 10's silently-absent risk paid for.

**The box now says how long it was off**, in the first Digest after a gap, naming the exact cut-off date
rather than describing it, derived from the newest Digest file the way ADR 0022 already derives it. No
model call, no stored state, and the one-message-a-day rule untouched.

**Liveness gained the number it never had.** Ping every three hours with a six-hour deadline: one missed
run of tolerance, roughly eighteen hours left to act. The route is now part of the decision, because an
alert delivered into Telegram lands in the same app whose messages are quietly expiring. A watcher in
front of a push channel, since a push service delivers and only a watcher notices silence.
healthchecks.io with ntfy is the recommended pair. Where the Canary goes is a Vault Setting; the topic
URL is a Box Setting.

**One thing these answers broke, caught rather than left.** ADR 0031 used the 30-day reach as its worked
example of a value that must stay a code constant, on the grounds that three rules shared it. Two are
now gone. The rule survives and its example is replaced; ADR 0022's backward reach is now alone and is
about which Review Dates fire after an absence, not about filing.

Wrote ADR 0036 and ADR 0037; amended ADR 0027, ADR 0030, ADR 0031 and ADR 0017; new `CONTEXT.md` terms
Recovery and Parked, with Journal Entry, Filing Run, Command, Closed Day, Health Canary and Setting
amended in place. Amends stories 6 and 63 and the Running Unattended section, and adds the parked and
journal-pairing counts to the Health Canary. Feeds ticket 23.
