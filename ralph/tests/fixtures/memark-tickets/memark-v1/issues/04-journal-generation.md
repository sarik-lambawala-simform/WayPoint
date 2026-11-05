# How the journal is generated

Map: [map.md](../map.md)
Type: grilling
Status: resolved
Blocked by: 03

## Question

Given a decided journal entry shape, decide how one gets written.

- **When.** In the same run that composes the Digest, or a separate pass? The spec's run is one entry
  point with one lock (ADR 0024), and an idle day currently costs zero model calls. A journal must not
  turn every idle day into a paid one.
- **Which tier.** Filing is cheap-tier and mechanical; Digest composition is strong-tier because
  judgement lives there. A journal is judgement-shaped, which points at the strong tier and therefore
  at a real cost line — quantify it against the spec's existing table.
- **What it reads.** Only the day's Captures, or the day's Captures plus the Cards they touched? The
  latter is richer and breaks the spec's cost property that a run scales with what you said, not with
  what the Vault holds.
- **Whether it feeds back.** Does the journal become an input to filing — can a Card claim derive from
  a journal entry rather than from a Capture? Strong prior instinct: **no**, because it would make the
  journal a second store of truth and put a model-written sentence in the provenance chain where a
  human sentence belongs. Confirm or overturn deliberately.
- **Failure.** If journal generation fails, does the run still commit and still send the Digest? (The
  spec's rule is that a partial failure never silently swallows the day.) Does the Health Canary report
  it, and does a missed day get backfilled later or lost?
- **Retroactivity.** Captures are stored permanently in dated files from Stage 0 onward, so journals
  for past days are generatable. Is backfilling supported, and is a backfilled entry marked as such?

Also confirm what this does to the day-one experience, since making the first week pay you back was
part of journaling's justification for being in v1 at all.

## Answer

**Journal generation is the last step of the first run after midnight, and the empty case is written by
code.** Those two facts settle most of the ticket. The step writes yesterday, so it can never share the
Digest's call: the Digest is composed during today, for today, and on the day it runs the day it would
journal is not over yet. The ticket's framing of "same run or separate pass" was the wrong axis. The
real question was which run of the *next* day writes it, and the answer is the first one, inside the
single entry point and the single lock that ADR 0024 insists on. No second schedule, nothing new to
fail on its own.

**An idle day still costs nothing.** ADR 0027 requires a file for every day, including a day you said
nothing on, and that looked like it would turn every quiet day into a paid one. It does not, because
there is no judgement in "you sent nothing" and code can write that line more cheaply and more reliably
than a model can, the same way the Health Canary is composed by code. So the run that finds an empty
inbox day makes no model call for it. The spec's property that a run with nothing to do costs nothing
survives the journal intact, which is the single most important result of this ticket.

**Strong tier, and the only flat row in the cost table.** Composition runs on `claude-sonnet-5`,
because a journal nobody wants to read is worth nothing. Against the spec's own assumptions, eight
Captures at ~60 tokens is ~500 tokens of content, plus a prompt at ~800, so roughly 1,300 in and 400
out: **~$0.011 a day, ~$0.33 a month, identical in the year 1, year 3 and year 5 columns.** The cheap
tier would save $0.24 a month and was declined for that reason alone. The interesting part is not the
number, it is that the number does not move: journal generation reads one inbox file and never the
Registry, never the Vault, so it is the one line in the cost table that does not grow. It is a clean
instance of story 43, cost growing with what you said rather than with what the Vault holds, in a
table where filing has already lost that property.

**It reads the day's inbox file and nothing else.** No Cards, not even the Cards the day's Captures
were filed into. A journal that reads the Cards is a worse Card rather than a better journal, and ADR
0027 says the journal exists precisely to hold the shape of a day that the Cards have already dissolved
into subjects. Reading Cards would also undo two properties in one move: the flat cost above, and ticket
03's cut of the filing dependency, since the Cards only reflect a day after filing has drained it.

Within that file, a Question counts and a Command does not. Per ADR 0018 a Question is also a Capture,
so what you asked your own system sits in the inbox, and an evening spent trying to remember when the
plumber's quote came in is a fact about that evening that neither the inbox nor the Cards preserve as
one. But a Question flattened into a statement would read as an event, which is a lie about the day, so
the entry renders it as a question you asked. Commands are machine operation rather than life and are
skipped.

**Failure costs nothing and reports as a count.** The journal step runs last, after filing and after
filing's commit, so a failed model call leaves a run that filed correctly, committed correctly, and
simply has no journal file for yesterday. Nothing is sent about it. The Canary carries one number:
**how many past days have no journal entry.** Not an event at the time, a count of what is outstanding,
which is the shape ticket 10 chose for unanswered Date Requests and for the same reason. A count
survives being unread on the day it appears. This also means the step needs no retry logic of its own,
because backfill *is* the retry.

**Backfill needs no permission and no marking.** ADR 0027 forbids regenerating an entry that exists. It
says nothing about an entry that is absent, and writing a missing day late is generation rather than
regeneration, so backfill falls out for free. Each run writes entries for past days that lack one,
oldest first, **bounded at 7 days per run** and configurable. With eight runs a day a three-month gap
clears in under two days of ordinary running, and no single run turns into a long lock hold. Oldest
first so the Canary's outstanding count falls monotonically.

A backfilled entry is **not marked as backfilled**, and that is a dividend of ticket 03 rather than a
shortcut. Generation reads the day's inbox file whole, and ADR 0001 makes that file permanent and
append-only, so a day journaled three weeks late is generated from byte-identical input to one journaled
at 00:05. There is nothing to disclose, because nothing differs.

**Catch-up is a Command, and it widens the Command grammar.** The 7-day bound needs a one-off override,
and it belongs in Telegram rather than on the box, because you should be able to ask from wherever you
noticed the gap. `catchup` is appended to the inbox as a pending instruction and applied by the next
run, which is exactly the existing mechanism: the bot never writes the Vault, and `done` and `skip`
already work this way. Three things go with it.

It is the first Command that takes no digits, so it widens the pattern story 51 keeps strict. That is
recorded rather than slipped in. It is affordable because it is one word, it is exact, and it is not a
word that occurs in ordinary speech about your own life.

"Everything" is bounded by the inbox rather than by a number: every past day that has an inbox file and
no journal. The set is finite and known, so there is no runaway case.

The real cost is the lock, not the money. Ninety days is about a dollar, which is nothing, but it is
ninety sequential strong-tier calls holding the Vault lock, so filing stalls for the duration and a
Capture sent meanwhile waits. That is acceptable when you asked for it, and it is the whole reason the
default stays bounded. The Canary reports how many entries a catch-up wrote.

**The seeder's day is stated, not narrated.** The seeder writes an interview's worth of Captures into
one dated inbox file, spanning a wife's birthday, a sister's move, a job change in 2019 and a concert
next March. Narrated as a day, that is the most misleading file the system will ever write, produced on
day one, which is the worst possible day to lie. So the seeder marks its inbox file, and the journal
step skips composition for that day and writes a stated entry instead: this day was the seeding
interview, with a pointer to the inbox file. Every day still has a file, and the file is true.

**A late Capture does not reopen a journalled day.** An entry is a snapshot of the inbox file as it
stood when the entry was written. No regeneration, no appendix, no marker, which follows directly from
ADR 0027. This ticket sets that rule rather than deferring it, because it is a rule about the journal,
and it sharpens ticket 15 instead of constraining it: if ticket 15 dates a Capture by send time, then a
late Capture for a closed day is absent from that day's journal permanently and ticket 15 must argue
that cost. If it dates by receipt time, no journal is ever stale and the cost lands on the inbox
instead. The trade is now visible rather than hidden, which is the most this ticket can do for it.

**The day-one claim was right about the value and wrong about the timing.** Journaling was argued into
v1 partly on making the first weeks pay you back, but ADR 0027 makes the journal the one thing the
system produces that you have to go and open, and on day one there is no journal at all, since the
first entry appears on day two about day one. The corrected statement, which the spec should carry
verbatim: **the Digest carries the first week and the journal carries the first month.** The payoff is
scrolling `journal/2026/08/` at the end of a fortnight and seeing fourteen days you would otherwise
have lost, which is a thing the Digest structurally cannot give because the Digest is about today. It
gives you nothing on day three, and pretending otherwise would set the checkpoint up to measure the
wrong thing.

**Already settled, and not reopened.** The ticket asked whether the journal feeds back into filing.
ADR 0027 answers it: no Card claim may cite a Journal Entry and it joins no retrieval corpus. The
strong prior in the ticket was correct and is now written down. The ticket also asked what the journal
reads, and ticket 03 had already cut half of it by fixing generation to the day's inbox file whole
rather than to what filing drained.

### Written as part of this resolution

An amendment paragraph on ADR 0027 covering generation: which run writes an entry, the code-written
empty entry that keeps an idle day free, bounded backfill with no marking, the snapshot rule for late
Captures, and the seeder's stated day. No new ADR, because every one of these follows from ADR 0027
rather than trading against it. No new `CONTEXT.md` term, because nothing here is a new kind of thing.

### Handed to other tickets

- **Ticket 11** (build order and checkpoint): journal-reading cannot be part of the checkpoint's pass
  condition, because nothing prompts you to read it, so a fortnight of unread journals proves nothing
  about the habit. The checkpoint measures Captures sent and Digests read.
- **Ticket 12** (seeding interview): the seeder must mark its inbox file so the journal step can skip
  composition for that day. One line in the file, and the marker is the seeder's only new obligation.
- **Ticket 13** (amend the spec): add the journal step to the run description as the last step after
  filing's commit; add a `~$0.011/day` journal row to the cost table, flat across all three columns;
  add the outstanding-journal-days count to the Health Canary line; add `catchup` to the Command set
  and note it as the first bare-verb Command against story 51; replace the vague first-week payback
  claim with "the Digest carries the first week and the journal carries the first month"; add the
  backfill bound as a config key next to the timezone and display formats.
- **Ticket 15** (which day a Capture belongs to): the snapshot rule above turns its third bullet into a
  stated trade rather than an open question. Send time means late Captures are permanently absent from
  the journals of the days they belong to. Receipt time means no journal is ever stale.
