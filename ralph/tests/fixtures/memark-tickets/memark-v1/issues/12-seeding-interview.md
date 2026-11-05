# The seeding interview

Map: [map.md](../map.md)
Type: grilling
Status: resolved

## Question

The seeder is a Claude Code skill, run once, that writes Capture blocks into a dated inbox file and
lets the ordinary Filing Run do the rest (map Notes). That choice means it introduces no new write
path, no new format and no broken invariant. Decide what it actually asks and what it is allowed to
produce.

- **Coverage.** Which areas the interview walks: people and how they relate to you, dates that matter,
  live projects, areas of life, goals, standing worries, open errands. Ordered so the most valuable
  material arrives before interview fatigue does.
- **Depth, against Registry bloat.** Every Card adds a Registry row, and the whole Registry is sent to
  the model on every Filing Run — up to eight times a day. An over-ambitious interview pads it with
  subjects you never mention again, which the spec says costs filing *quality*, not just money. Decide
  a stopping rule: seed narrow and deep, or wide and shallow.
- **Seeded dates: confirmed or Proposed?** ADR 0012 makes an inferred date a Proposed Date pending one
  tap, because noticing a date is the step no code can guarantee. But in an interview you *state* the
  date and you are live in the loop — nothing is being inferred. Strong instinct: seeded dates are
  confirmed Review Dates written directly, with their tier and Notice Schedule set in the same
  conversation, which is the natural moment to set them. Confirm, and decide whether that needs
  recording against ADR 0012 as an explicit exception.
- **Provenance and dating.** Interview answers become Captures — but they describe things said months
  or years ago. Do they carry the interview's date, and does the resulting Card line say it came from
  the seeder rather than from something you actually said that day?
- **Pinned or not.** Are seeded Card lines yours (immutable) or the agent's (compactable)? Instinct:
  the agent's, because you spoke them casually into an interview rather than typing a correction — but
  this touches ticket 02 and should be checked against whatever mechanism that ticket picks.
- **Names.** The interview is the one moment names are typed rather than transcribed, so it is the
  cheapest possible defence against the misheard-name problem ADR 0025 exists for. Should it explicitly
  confirm spellings and distinguishing suffixes (`Priya (colleague)`) as it goes?
- **Idempotence.** What happens if the skill is run twice.
- **Volume.** Roughly how many Captures one sitting produces, and whether that exceeds what chunked
  filing (ADR 0023) comfortably handles in one run.

## Comments

**From ticket 04 (journal generation).** The seeder must mark its inbox file. The journal step reads a
day's inbox file whole and narrates it, and an interview's worth of Captures narrated as one day is the
most misleading file the system will ever write, produced on day one. The marker lets the journal step
skip composition and write a stated entry instead. This is the seeder's only new obligation from that
ticket, and it does not change the no-new-write-path property.

## Comments

**From ticket 11 (build order and Checkpoint).** Two constraints land on the seeder from the build order.
It runs **last**, after the Filing Run can already eat the Capture blocks it writes, and **the Checkpoint's
clock starts on the first day a Digest is sent from a seeded Vault** rather than on the day the code ships.
One more job attaches to the same moment: the twenty-message retrieval test list (ADR 0028) is written
right after seeding and before the clock starts, from the seeded Vault only. Ticket 11 also leaned on
seeding to argue Ambiguous Subjects and Proposed Dates into the First Loop, so a seeded Vault dense enough
to make a first name ambiguous in week one is an assumption this ticket now carries.

## Answer

**The seeder's job is not to store your life. It is to give filing something to match against**, so a
Capture on day two lands on a Card that already exists instead of making a new one. That reframe decided
most of this ticket. The test for what goes in is not "is this important to me" but "will I say this
name to the bot soon", and almost every answer below falls out of it.

### What it asks, and how deep

Ordered by what you will mention rather than by what matters: people first, closest ring outward, then
the dates hanging off those people, then live projects and open errands, then areas of life and standing
worries, then goals. Goals and worries go last because they are the ones you can add later just by
talking, and they are poor match targets. People go first because they come up daily, and a missing
person Card costs you a duplicate every week.

Narrow and deep, with a rule the skill states out loud and applies: **a subject earns a Card only if you
expect to say its name in the next month.** Everyone else is a mention inside someone else's Card. Rough
target 30 to 40 Cards. Depth is cheap, because a long Card is still one Registry row. Width is what
costs, because the whole Registry goes to the model on every Filing Run.

**One exception, and it exists to stop this ticket quietly voiding ticket 11.** Ticket 11 pulled
Ambiguous Subjects into the First Loop on the grounds that a seeded Vault makes a first-name collision a
week-one event. A narrow Vault is precisely the Vault least likely to hold two people called Priya,
because the second one fails the month test and gets dropped. Without her there is no collision to find:
filing sees one clean match and files your colleague's news onto your cousin, silently. So a name that
collides with a name already in gets a Card whether or not it clears the bar, and the interview asks it
per person: is there anyone else you call by this name. The Vault stays narrow everywhere the narrowness
is free.

### Dates are written directly, and confirmed

If the seeder wrote only Captures, filing would infer the dates and ADR 0012 would turn every one into a
Proposed Date. Your first Digest would be forty date confirmations, which is the worst possible first
message. So **the seeder writes Date Files directly, as confirmed Review Dates**, with tier and Notice
Schedule set in the same conversation, which is the natural moment to set them.

This is a second write path and it does break the clean "no new write path" property the seeder was
designed around. Accepted, and the cost is contained two ways: the seeder is dev-time tooling rather
than shipped code, and it writes through the same linter the Filing Run uses, so it cannot write a shape
the system cannot read.

**This is not an exception to ADR 0012.** ADR 0012 exists because noticing a date is the one step no code
can guarantee, and it governs a date the *agent inferred*. Here you state the date and you are live in
the loop. The confirmation still happens. It happens in the interview rather than in the Digest. ADR 0012
gains a sentence saying the interview is a confirmation moment, rather than a carve-out saying it is
exempt.

**Festival fills go as deep as the source has, and no further.** Ticket 10 asked whether a ten-year fill
is real or merely defers the silence to year eleven. It defers nothing, because there is no silence:
`holidays` reaches 2035, so from 2026 a ten-year fill cannot be filled anyway, and a Date Request with no
guess still fires and still asks. Depth buys typing saved, not correctness. So: fill what the source
covers, stop, and answer ticket 10's question as no.

### Dating, provenance and marking

Captures carry **the interview's date**, because the inbox is a log of when something was written, not
when it happened. When it happened is content, and the Card line says so.

Ticket 04 already requires the seeder to mark its inbox file so the journal step writes a stated entry
rather than narrating an interview as a day. **That marker is enough on its own**, and no per-block
`seeded::` field is added. The whole file is the interview, so every `from::` link into it points at a
file that already says what it is. One marker, not two.

### Pinned or not, and a question that has gone nearly dead

Seeded Card lines are the agent's, unpinned. Worth recording *why* this stopped mattering: ticket 02
found that only a `compact` can ever be rejected for hitting a Pinned Claim, and ticket 11 dropped
compaction out of the First Loop. So inside the First Loop, pinning a seeded line changes nothing at all.
It only starts to matter months later. Leave them unpinned and pin the few that earn it by hand, once
you have seen which ones they are.

### Names, and the words you actually say

The interview is the one moment names are typed rather than heard, so correct spelling is free. It
confirms spellings and distinguishing suffixes (`Priya (colleague)`) as it goes. The larger prize sits
next to it: **the names you actually say out loud.** "Mum", "Raj", "the Delhi team". ADR 0025 exists for a
speech problem, and exact matching needs something to hit.

The shape had one forced answer. Ticket 06 settled that Lookup resolves a name exactly against the
**Registry**, so an alias held in a Card heading or a Card line cannot be matched and is decorative. It
goes on the Registry row as an `aka::` Line Field, using ADR 0026's grammar rather than inventing a
lookalike a migration script could not find. Two costs, both real: the Registry grows and it is sent on
every Filing Run, contained by keeping aliases to names you genuinely say; and **ADR 0026 widens to a
third kind of file**, having governed Cards and Date Files only.

### Running it twice is a top-up, not idempotence

The ticket asked for idempotence and that was the wrong word. A second run is a **top-up**, and it works
because by then the first sitting has been filed, so there are Cards and a Registry to read. It never
compares raw Captures to raw Captures, which is the hard version of the problem.

- **It reads the Registry to pick the areas and the Card to pick the questions.** The Registry says which
  subjects exist, so whole areas are skipped. The Card says what is already recorded, so where it does
  ask, it asks "anything new about Priya" rather than starting over.
- **You see the skip list before a single question is asked.** This is ADR 0014's shape applied to an
  interview: the model proposes what to skip and a human confirms. A wrong guess then costs one glance
  instead of a silent gap. Without this the whole mechanism is the model marking its own homework.
- **It refuses to run while an earlier seeding file is still undrained.** This is the failure the smart
  path is blind to: re-run before any Filing Run and the Registry is empty, the check finds nothing, and
  it duplicates the lot while looking like it worked. The gate needs no judgement, only whether the
  marked file's blocks carry the filed marker.
- **Prose gets the soft check, dates get a hard one.** The two write paths fail differently. A duplicated
  Capture is cheap, because filing folds it onto the same Card line and you never see it. A duplicated
  Review Date is expensive and silent: the same birthday fires twice forever, and the only sign is a
  Digest that looks slightly off. So before writing any Review Date the seeder checks the Date File for an
  existing line naming the same subject on the same day. Exact match, no model judgement. This is the one
  place the interview's opinion does not get a vote.
- **It never corrects anything.** A top-up will hit "Priya left the company", which is not new but
  contradicts the Card. The seeder writes the Capture and stops, and the ordinary path takes over: by ADR
  0010 filing writes nothing and the Digest asks. Correct outcome, no code, and it stays out of
  Superseding, which is out of scope.

It writes after each area rather than at the end, so a crash in hour two costs one area rather than the
sitting, and an unfinished file is offered as a resume.

This decides the **Re-seeding** patch sitting in the map's fog, which graduates into this answer rather
than waiting for a ticket of its own.

### Volume, and what seeding does to ADR 0023

At 30 to 40 Cards and roughly four facts each, one sitting is about **140 to 180 Captures** plus the
dates. ADR 0023 names two hundred Captures as the case it was written for, so the volume itself needs
nothing.

The second-order effect does. ADR 0023 accepts that a batch cannot see what a neighbouring batch filed,
so two Captures about the same new subject can each propose creating it, saved by a code-side Registry
check on apply. On an ordinary day that is a rare event. **On seeding day every subject is new**, so that
path stops being the edge case and becomes the main one, on day one, which is the day the code has never
run in anger. Two things follow. The seeder writes all of one subject's Captures together, which it gets
for free from the subject-by-subject ordering above, so a subject's facts mostly land in one batch. And
that only helps if **batches are taken in file order**, which ADR 0023 never actually said. It says so now.

### The retrieval test is not the seeder's to write

ADR 0028 and ticket 11 put the twenty-message list right after seeding, from the seeded Vault, before the
Checkpoint clock starts. The seeder does not write it and must not. The point of writing it at that
moment is that you cannot write questions you already know it can answer, and the agent that just seeded
the Vault would write twenty questions it knows land. The one honest thing it can do is **print the
Registry at the end**, so you have the subject list in front of you while you write. Material, not
answers.

### Written down

No new ADR. Every decision here either lives inside an existing one or is dev-time tooling rather than
architecture, and the one genuinely architectural claim, that the interview is a confirmation moment,
belongs next to ADR 0012 rather than in a second ADR arguing with it from outside.

- **ADR 0012** amended: the seeding interview is a confirmation moment, so a date stated in it is written
  as a confirmed Review Date.
- **ADR 0026** amended: the grammar covers the Registry, and `aka::` is named as a Registry field.
- **ADR 0023** amended: batches are taken in file order, and seeding is named as the run that makes it
  load-bearing.
- **CONTEXT.md**: Lookup's entry amended to say a name resolves against the Registry's names and aliases.
  No new term. An alias is a property of a Card, not a new kind of thing, and a top-up is a behaviour of
  a dev-time skill rather than a domain concept.

### Handed to other tickets

- **Ticket 13** (amend the spec): the seeder writes Date Files directly, which the spec must state
  alongside the Capture write; the Registry row gains an optional `aka::`; the file-order batching rule;
  and the Registry printout as the last step of the interview, feeding the twenty-message list.
- **Ticket 15** (which day a Capture belongs to): the seeding file is a whole day of Captures whose
  content is years old, so whatever rule ticket 15 picks must be a rule about *send* time, or it will try
  to scatter one interview across a decade of inbox files.
