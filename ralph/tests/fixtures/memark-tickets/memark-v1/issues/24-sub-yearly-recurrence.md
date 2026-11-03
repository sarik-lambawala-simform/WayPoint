# A reminder that repeats faster than once a year has nowhere to live

Map: [map.md](../map.md)
Type: grilling
Status: resolved

## Question

The system supports exactly two recurrence shapes, and neither of them is "every month".

Per ADR 0011, recurrence is not a field. It is which folder a file sits in:

- `dates/recurring/MM-DD.md` fires every year, forever.
- `dates/YYYY/MM/YYYY-MM-DD.md` fires once and never again.

That is the whole vocabulary. Story 36 says it plainly: *"I want **yearly** recurrence handled."* There
is no third folder and no interval field anywhere in the spec.

So "get a haircut every month" cannot be recorded. Every available way of writing it fails:

- **As a one-shot.** It fires once. You say you got the haircut, `skip` stamps it handled, and a one-shot
  has no next recurrence, so it never returns. You must say it again every month, which means remembering
  to, which is the faculty the system exists to replace.
- **As a yearly.** It lands in `dates/recurring/09-30.md` and reminds you once a year. Eleven missed
  haircuts.
- **As a Task in a Card.** No date, so it never fires on its own. It sits in the Digest until you tick it,
  and per ADR 0034 a closed Task is closed for good: a returning errand is a new Task, never an unticked
  box.

**This was never decided.** It is not in Out of Scope. It is not in the map's Not-yet-specified. No ADR
mentions it. Every test fixture in the spec exercises yearly lines and one-shots only, so nothing would
ever have surfaced it. It is a hole, not a trade.

**And it is not a small one.** The spec's own Problem Statement is about a memory that fails and a system
that remembers on your behalf. A reminder system that can only think in years handles birthdays and
anniversaries and nothing else about running a life. Rent, medication, a haircut, watering the plants,
a fortnightly one-to-one, changing the water filter, backing up the laptop. These are the ordinary
substance of remembering, and none of them is expressible today.

## Why ADR 0011 made the trade, and what it bought

The folder-as-recurrence rule is not arbitrary and must not be casually undone. It bought three things
at once:

1. **No recurrence arithmetic.** No next-occurrence computation, no year-boundary case to get wrong.
2. **No scanning.** A run reads a fixed forward window of date files rather than parsing every Card, so
   the cost of deciding what to surface is constant in the number of Cards.
3. **A bounded folder.** `dates/recurring/` holds at most 366 small files however long the Vault runs,
   which is what makes ADR 0016's 366-day window affordable.

Any answer here has to say what it does to all three. "Add an interval field" reintroduces exactly the
arithmetic ADR 0011 deleted, and that may well be the right call now, but it is a reversal and needs the
argument made rather than the feature slipped in.

## The split that makes this harder than it looks

"Every month" names two different things, and the spec has neither. Deciding which one is in scope is
the first job of this ticket, because the answers diverge immediately.

**Fixed anchor.** Rent on the 1st. The standing order on the 15th. The bin goes out every Tuesday. The
day is known in advance for all time, independent of whether you did the thing. Firing it is a lookup,
exactly like a birthday, and this shape fits ADR 0011 with the least violence: it is a rule for
generating days rather than a stored state.

**Elapsed since last.** The haircut. This is the prompting case and it is the harder one. There is no
day. There is a gap, and the next date is a function of when you last did it. Get a haircut two weeks
early and the next one moves two weeks early with it. Nothing in the Vault currently records "when you
last did this", and the thing that would record it is the `skip` Command, which today means something
much weaker.

They look identical when you say them out loud. "Every month" is both. Deciding to support only the
first is a defensible v1 answer, but it must be stated, because the haircut is the example the user
actually raised.

## What `skip` currently means, and what this would make it mean

Today `skip` writes a `handled` stamp: the date stops firing for the rest of its Notice Schedule and
comes back untouched at its next recurrence. It is a mute for the current run-up, and nothing more. The
line is never edited.

Under elapsed-since-last, `skip` stops being a mute and becomes **the thing that sets the next date**.
That is a much bigger job for a verb whose whole design is that it changes nothing. Consequences to
argue through:

- A `skip` you never send means the reminder is stuck. Under a fixed anchor, silence costs you one
  ignored line and the date rolls on by itself. Under elapsed-since-last, silence means the next
  occurrence is never scheduled, so the line either nags forever or goes quiet forever. Both are bad and
  the spec's parking rule (fourteen asks, then stop) was written for questions, not for reminders.
- `skip` would now write to a Date File on the ordinary path. Check this against ADR 0035's split and
  the Pending Instruction rule, which already allows a Date File line to be written, so this is probably
  fine but should be confirmed rather than assumed.
- Is `done` the better verb for "I did the thing, restart the clock"? Today `done` closes a Task and
  `skip` handles a Review Date, and the distinction is that a Task ends and a Review Date recurs. An
  elapsed-since-last reminder is a Task that recurs, which is a shape neither verb was built for.

## The other collisions to work through

- **ADR 0016 and the 366-day window.** A monthly line in `dates/recurring/` means either twelve copies
  of the same line in twelve files, or a line that is computed rather than looked up. The first is a
  duplication that hand-editing will desynchronise. The second is the arithmetic ADR 0011 removed.
- **ADR 0020, state derived from files the system already writes.** An elapsed-since-last reminder needs
  a `last-done::` date. Written on the date line itself, that is a file the system already writes, so it
  may pass. But it is a genuinely new fact that exists nowhere else in the Vault, which is the thing
  ADR 0020 is suspicious of. Argue it explicitly rather than waving it through on a technicality.
- **ADR 0022, a day that passed unread is still fired.** Away for three months with a monthly reminder:
  three reminders or one? For a haircut, one. For "pay the rent", you may genuinely need to know you
  missed three. The answer may differ by shape, which is a reason the two shapes may need to stay
  distinguishable rather than being unified.
- **The Notice Schedule.** `notice:: 5d..0d` on a monthly is sensible. On an elapsed-since-last line
  whose target day moves every time you do the thing, what does a lead time attach to?
- **The Digest's volume.** Twelve monthlies with a 5-day run-up is a line in the Digest most evenings.
  Priority tiers exist to solve exactly this and are out of the First Loop per ADR 0038, so a v1 that
  adds frequent reminders without tiers may make the Digest noisy at the moment it becomes useful. This
  may be an argument for tiers moving into v1 alongside this, or for a cap on run-ups.
- **The seeding interview.** If monthlies exist, the interview should collect them, and it currently
  asks for birthdays and one-shots.

## Decide

1. **Which shapes are in v1.** Fixed-anchor only, both, or a single shape that covers both.
2. **How recurrence is represented**, and what that does to ADR 0011's three properties. A third folder,
   an interval field on the line, or something else. If ADR 0011 is being reversed in part, name it.
3. **Which verb restarts the clock**, and what happens when it is never sent.
4. **What a missed occurrence does**, and whether the answer is allowed to differ by shape.
5. **Whether the whole loop closes.** The spec's own First Loop rule: a part is only in the First Loop
   if its whole loop closes. For this, that means creating a monthly by talking, having it fire, saying
   you did the thing, having it come back at the right time, and changing the interval later. If any
   link is missing, it either gets built or the feature waits.
6. **Whether priority tiers must come with it**, given the Digest volume this adds.

## Notes

Raised while amending the spec for the `alias` verb. The wording that exposed it was D11's *"Stops firing
this run-up, returns next year"* in the atlas, which is accurate for the only recurring shape that exists.
CONTEXT.md's *"comes back untouched at its next recurrence"* reads as though several kinds are supported,
and that general phrasing is what hid the gap. Whatever is decided here, that line needs to end up saying
something true.

Consult `/grilling` and `/domain-modeling` per the map's standing note. **Recurring Date** or similar is
likely a new term for CONTEXT.md, and this almost certainly needs an ADR of its own, since amending
ADR 0011 in place would bury a reversal inside a decision that reads as settled.

## Next

Resolving this ticket decides; it does not write. [Ticket 25](25-amend-the-spec-a-third-time.md) executes
the write-up and is blocked by this one. It folds the decision into the spec, writes the ADR, corrects
`CONTEXT.md`, and updates the published flow-docs atlas. Do not amend the spec from inside this ticket:
tickets 13 and 23 established that the write-up is its own step, and the reason is that a decision made
and a decision recorded are separately checkable.

## Answer

Resolved by grilling, seven rounds. The hole is real and it is filled by a **partial reversal of
ADR 0011**: folder-as-recurrence cannot express "the first Monday of every month" at any price, so the
rule moves onto the line. One-shots are untouched.

### 1. Which shapes are in v1

**Fixed anchor only.** A recurrence is a rule that generates days, independent of whether you did the
thing. Rent on the 1st, medication on Monday, Thursday and Friday, vitamin D on the first Monday.

**Elapsed-since-last is out of scope for v1** and is recorded on the map as such. It is the haircut: no
fixed day, a gap, and the next date is a function of when you last acted. It is out because it turns
`skip` from a mute into the thing that sets the next date, which means a `skip` you never send leaves the
reminder either nagging forever or silent forever, and because it needs a `last-done::` fact that exists
nowhere else in the Vault. Both are arguments worth having and neither is worth having now. Fixed anchor
covers rent, medication, the bins, the filter, the fortnightly one-to-one and the backup, which is most
of the list this ticket opened with.

Consequence: **`skip` restarts no clock and its meaning does not change.**

### 2. How recurrence is represented

**A rule on the line, in one file, matched rather than calculated.**

- **One file.** `dates/recurring.md` holds every repeating Review Date, yearly included.
  `dates/recurring/MM-DD.md` is removed. One-shots stay at `dates/YYYY/MM/YYYY-MM-DD.md`, because a
  one-shot has no rule to write and ADR 0011 keeps past ones as a record of what the system told you.
- **The rule is iCalendar's recurrence rule** in a `repeat::` field. Everything the standard offers
  except sub-daily frequencies, which are excluded for the same reason a time of day is (see below).
  Chosen over a bespoke four-form vocabulary because the calendar is where the hard cases live and a
  battle-tested library already has them right.
- **It is matched, never stored ahead.** Selection expands each rule across the 366-day window it
  already reads and asks whether a given day is in the set. No next-occurrence date is written anywhere,
  so ADR 0011's "no recurrence arithmetic" survives in the only form that matters: nothing is
  precomputed into a file that can then be wrong.
- **`since::` carries the start date**, which `INTERVAL` needs to anchor. "Every 3 months on the 1st"
  does not say which months. It cannot be `from::`, which already means the Capture that caused the line.
- **`COUNT` is accepted in speech and stored as `UNTIL`.** "Every Monday for six weeks" is a real thing
  to say. `COUNT` would force the run to expand history and count, and a spent line would look alive.
  Code works out the sixth Monday once, at write time, and writes the date. Evaluation stays a pure test
  and a spent line reads as spent.
- **The leap day is a system rule on top of expansion.** A yearly rule naming 29 February fires on
  28 February in common years. The library correctly produces nothing in a common year, and ADR 0011
  already promised otherwise. One special case, written down, with a test.
- **A plain-English reading sits on the line in a `reads::` field.** The rule is authoritative and firing
  never reads this field. The system rewrites it whenever it writes the line, and the linter flags a
  reading that does not match its rule, because a comment that might be wrong is worse than none. It is
  a named field rather than a bare parenthetical so it parses like every other field under ADR 0026.
- **A time of day is kept as text and printed in the Digest. Nothing schedules on it.** A 3pm ping is a
  second speaking channel and reverses ADR 0024. The reply that confirms the line says the reminder
  arrives in the daily Digest, not at the clock time.
- **The default Notice Schedule for a repeating line is `0d`**, not `5d..0d`. A lead time exists to give
  you time to act, and there is nothing to prepare for "take your medication today". Longer schedules are
  written when you ask for them, exactly as ADR 0016 already allows: `notice:: 15d, 5d..0d`.

An example line:

```markdown
- [[Health]] take vitamin D · repeat:: FREQ=MONTHLY;BYDAY=1MO · reads:: every month on the first Monday · since:: 2026-10-01 · notice:: 0d · tier:: 2 · from:: [[inbox/2026/09/2026-09-30#^b41c]]
```

**What this does to ADR 0011's three properties.** The new ADR must state this rather than claim the old
bound survives.

| ADR 0011 property | Under this decision |
| --- | --- |
| No scanning of Cards | Holds, unchanged. Selection still opens date files by name and never parses a Card. |
| No recurrence arithmetic | Partly reversed. Expansion returns, but only as a set-membership test over a bounded window. No next-occurrence date is computed or stored, so the year-boundary case ADR 0011 deleted stays deleted. |
| A bounded folder | **Lost, and replaced by a weaker bound.** ADR 0011 guaranteed at most 366 files forever. The new bound is one line per repeating reminder, which has no ceiling in principle. |

The bound is the only real loss and it buys a cost saving that was not anticipated. ADR 0016's 366-day
window already forces selection to read **the whole of `dates/recurring/`** every night. One file is one
read instead of up to 366. **The folded design is cheaper than the design it replaces.**

Two things also get simpler. A Date Request's approximate day is corrected by editing a rule on a line
rather than moving the line between `12-19.md` and `12-21.md`, which removes the Pending Instruction that
names a file path. And nothing needs to know which files exist, because a Date File today "is created
only when something is written on that day" and one file always exists.

### 3. Which verb restarts the clock

**None, and nothing about `skip` changes.** Fixed anchor means the date rolls on by itself, so a `skip`
you never send costs you one ignored line.

One storage change falls out of frequent repetition. **`handled::` records the occurrence it dealt with,
not the day you spoke.** `handled:: 2026-09-14` means the 14 September occurrence is done. A line is
muted when the occurrence it is running up to has a matching stamp. Nothing is ever cleared, which
deletes the word "cleared" from the design and with it the question of what "next recurs" means on a
weekly line. Stamps are trimmed to the occurrence in view when the line is rewritten.

### 4. What a missed occurrence does

**One collapsed mention carrying a count.** "Medication: 12 days missed since 1 June", not twelve lines.
ADR 0022 already says a missed date is collapsed into a single mention and labelled overdue; for a
one-shot the collapsing is invisible, and for a repeating line the count is the part that carries the
information. The thirty-day backward cap is unchanged and does most of the work: a monthly can miss at
most one occurrence inside it.

The answer does not differ by shape, because only one shape ships.

### 5. Whether the whole loop closes

It closes.

| Step | Mechanism | New |
| --- | --- | --- |
| Create by talking | Intent Read parses it, the bot asks a follow-up if a value is missing, replies with the `reads::` text for one tap, appends a Pending Instruction to the inbox, the Filing Run writes the line | One Pending Instruction verb |
| Fire | Selection reads one file, expands each rule over 366 days, applies the Notice Schedule | Expansion |
| Say you did it | `skip N` stamps `handled::` against the occurrence | Stamp meaning |
| Come back | The next matching day | Falls out of expansion |
| Change the rule | Talking, with a tap | Reuses the same Pending Instruction against an existing line |
| Stop it | `UNTIL` set to yesterday | Nothing |

ADR 0035 holds throughout: the bot only talks and appends to the inbox, and the Filing Run remains the
only writer.

**Ambiguity is asked about in the chat, straight away, not deferred to the Digest.** The test is
mechanical: can the rule be written without inventing a number you were not told? Three cases fail it,
and the bot asks about exactly those.

| You said | Missing | The bot asks |
| --- | --- | --- |
| every month | day of month | which day of the month? |
| every year | date | which date? |
| every week | weekday | which day? |

"Every 3 months" is **not** ambiguous once `since::` defaults to today, and "first Monday of every month"
is complete. Asking about a sentence with one sensible reading trains you to ignore the asking.

Asking in the chat departs from the habit ADR 0012 and ADR 0015 set, where the Digest asks the next day.
It is justified here because the bot is already in the conversation under ADR 0032 and you have the
answer in your head at that moment, and it breaks nothing under ADR 0035 because the bot is only talking.

**A repeating rule is confirmed with one tap before it goes live, and the `reads::` text is the
confirmation.** This is a stronger case than ADR 0012 had for a one-shot. A one-shot confirmed wrong
costs one wrong reminder; a rule confirmed wrong costs every reminder it will ever produce. The tap turns
`reads::` from decoration into the thing that catches a bad translation.

**Changing the rule by talking also needs the tap**, unlike `notice::`, which the spec already changes by
talking without asking because it is a cheap reversible edit. A mistranslated rule is not.

**Stopping sets `UNTIL` to yesterday rather than deleting the line.** The Vault keeps things: ADR 0034
keeps a closed Task's line and rejected proposals stay as struck lines so the same inference is not
offered twice. A deleted rule leaves no trace and the agent could re-propose it from an old Capture. A
spent rule reads as "you used to do this and you stopped". Telling "stop reminding me" apart from "delete
that reminder" is not in v1, because getting it wrong destroys a line.

**Two guards against a rule that never fires**, which is this ticket's own failure with a new cause.
Before a line is written, expand it across the next 366 days; if it produces no day, refuse and ask. And
the Health Canary counts any rule in the Vault that will never fire, which catches the hand-edited case
that Q3 and Q23 both allow. The expansion is already written for selection, so both are cheap.

### 6. Whether priority tiers must come with it

**No. Tiers stay in v1.1 per ADR 0038.** The Digest-volume worry came from the `5d..0d` default, not from
repetition. At `0d`, ten repeating reminders produce ten lines spread across a month, which is a longer
Digest and not a noisy one. If it does turn out noisy in use, that is an argument for tiers made from
evidence, which is a better argument than this ticket could make now.

### Vocabulary and documents

**No new term.** `CONTEXT.md` has no entry for `notice::` either; it has Notice Schedule, the concept.
A `repeat::` value is not a concept in the same way, and naming it invites the reader to think there are
two kinds of Review Date, which there are not. Two edits are needed:

- **Date File** stops saying a Review Date is "the only place a date lives", and stops implying every
  date-keyed file is named after a day.
- **Review Date** names its second home, `dates/recurring.md`, and its `repeat::`, `reads::`, `since::`
  fields.
- The line this ticket's Notes flagged, *"comes back untouched at its next recurrence"*, becomes true:
  there is now more than one kind of recurrence, and it is the rule that decides.

**This needs its own ADR**, not an in-place edit of ADR 0011. Amending 0011 would bury a reversal inside
a decision that reads as settled. The new ADR must state the lost bound plainly rather than claiming the
366-file guarantee survives.

**Nothing was built.** `dates/recurring/` appears seven times in the spec and three times in the ADRs and
nowhere else, so this is a spec edit and not a migration.

### Handover

[Ticket 25](25-amend-the-spec-a-third-time.md) executes the write-up. It is now blocked by this ticket
and by [ticket 26](26-a-standard-for-the-command-set.md), which was raised in this session.
