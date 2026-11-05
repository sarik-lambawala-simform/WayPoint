# The v1 build order and the two-week checkpoint

Map: [map.md](../map.md)
Type: grilling
Status: resolved
Blocked by: 01, 03

## Question

Stage 0's write-only capture week is replaced by a seeding interview, and the behavioural gate moves to
a two-week checkpoint over the smallest useful loop (map Notes). Define both precisely — the spec
concedes it holds "roughly twenty-four moving parts" and offers no order for building them.

- **What is in the smallest useful loop.** Capture, Filing Runs, Cards, the Registry, Date Files,
  selection, the Digest, the Health Canary and the Run Lock are plainly in. Argue each of the rest in or
  out by name: voice capture, self-filling acknowledgement, compaction, dormancy, Proposed Dates,
  priority tiers, Tasks and Commands, Questions, Pinned Claims, contradiction routing, expected-state
  checking, chunked filing, Merge Proposals, Ambiguous Subjects, off-box liveness, journaling.
- **Where journaling and the Card grammar sit.** The grammar is a prerequisite for anything that writes
  a Card, so it is first or nearly first. Journaling was argued into v1 on the grounds that it makes the
  first weeks pay you back — which only holds if it is inside the checkpoint loop rather than after it.
  Decide, having seen tickets 01 and 03 resolved.
- **What the checkpoint measures.** The original gate asked one question: are Captures still arriving
  unprompted on day seven? Two weeks of a working system is a different and easier test, so name the
  pass condition explicitly and honestly — including what number of Captures counts, and whether
  reading the Digest matters as much as sending Captures.
- **What is deliberately withheld until it passes**, and whether withholding anything is now theatre
  given the Vault is seeded and the Digest is live.
- **Whether off-box liveness (ADR 0017) is in the first loop.** It is trivial to add and it is the only
  thing that can tell you the system stopped — a silent failure during the very fortnight you are
  judging the system on would poison the result.
- Whether the spec's Stage 0 section is rewritten in place or replaced outright.

## Comments

**From ticket 04 (journal generation).** Journal-reading cannot be part of the checkpoint's pass
condition. ADR 0027 makes the journal never sent, so nothing prompts you to read it, and a fortnight of
unread journals proves nothing about the habit. The corrected payback claim is that the Digest carries
the first week and the journal carries the first month, so journaling is inside the checkpoint loop for
the sake of what it accumulates, and the checkpoint measures Captures sent and Digests read.

**From ticket 06 (the retrieval seam).** The checkpoint inherits one extra job. ADR 0028 rests word
matching on a belief no published benchmark can settle, and names its falsification test: twenty real
messages written down with the notes each should find, checked at the two-week checkpoint and again at
~200 Cards. Missing more than about a quarter triggers escalation. The checkpoint is where the first
run happens, because it is the first moment a real Vault exists.

## Answer

### The First Loop

Two new terms. The **First Loop** is the set of parts built before the gate. The **Checkpoint** is the
gate. "Stage 0" and the word "withheld" both go out of the vocabulary. The two weeks itself gets no
name, because the duration is a setting rather than a concept.

Every part the ticket named, argued by name:

**In.** Voice Capture, because the fortnight tests capture friction and half of capture happens while
walking. The acknowledgement, in two halves that land in different steps: the quote-back at receipt
(step 3), the self-fill hours later (step 5). Proposed Dates. Tasks. Reply words, limited to `done` and
`no`. Questions and the Lookup. Contradiction routing. Expected-state checking. Chunked filing.
Ambiguous Subjects. Off-box liveness. Journaling. Pinned Claims in part: the Line Mark and the code
filter stay, the rejection item in the Digest goes.

**Out.** Compaction, dormancy, priority tiers, Merge Proposals.

Three arguments carried the in/out line, and none of them was "is this valuable":

1. **Does it protect the fortnight?** Expected-state checking, chunked filing and off-box liveness earn
   their place here alone. A system that dies quietly for four days loses the data and also loses the
   test, because you cannot then tell "I stopped capturing" from "the laptop was asleep".
2. **Does it only pay off after months?** Compaction, dormancy and priority tiers all do. Cards are not
   long yet, attention has not decayed yet, and no Digest is full enough to need dropping.
3. **Does seeding change the odds?** This one cuts both ways and is the most interesting. It pulls
   Ambiguous Subjects **in**: with dozens of Cards on day one, a first name matching two Cards is a week
   one event, and without ADR 0015 the run writes to the wrong person's Card in silence. It makes
   Questions safe, since answers come from a full Vault rather than an empty one. And it pushes Proposed
   Dates **in** for the opposite reason: leave them out and every date in the Digest came from the
   interview, so the Checkpoint measures the interview rather than the habit.

Two knock-on effects worth recording. Dropping compaction drops ticket 02's whole Pinned Claim rejection
path, because only a `compact` can ever be rejected, so the Digest item and the Canary count go with it.
And Merge Proposals go out on the strength of something already built: the quote-back shows you "Prya"
within seconds, and the fix is your own hand in Obsidian.

### The build order

The risk in this build is the joins, not the parts. Telegram, git, the model call and cron are where the
surprises live. So one Capture goes end to end as early as possible and the loop thickens after.

1. Card grammar and the linter (ticket 01). Nothing may write before this.
2. Vault module, git, Run Lock. Everything writes through it.
3. Text Capture: inbox append, quote-back reply.
4. Filing Run: model call, chunked, expected-state checked, Registry, Cards. Contradiction routing,
   Ambiguous Subjects and the Pinned filter land here, because all three are rules on this one write path.
5. Selection, Date Files, Digest, Health Canary, `done` and `no`, and the acknowledgement filling itself in.
6. Journal generation.
7. Voice Capture.
8. Off-box liveness ping.
9. The Lookup, then answering Questions.
10. The seeding interview (ticket 12), run once.

Seeding is last because the seeder writes Capture blocks the Filing Run has to be able to eat. **The
clock starts on the first day a Digest is sent from a seeded Vault**, not on the day the code ships.

### What the Checkpoint measures

Three numbers.

**Capture days: at least one Capture on 5 of the 7 days of week two.** Week one is ignored on purpose,
because a new toy always gets used. Days are counted rather than Captures, because a habit is a per-day
thing and twenty Captures on one excited Saturday would sail past any total while proving nothing.

**Digest replies: three across the fortnight, at least one in week two.** A Telegram bot gets no read
receipt for what it sends, so "read" is not observable and a reply is the only visible sign. That
undercounts, since a quiet Digest with nothing to act on is read and gets no reply, so the bar is a floor
rather than a score. Zero replies in fourteen days means it is not being read, whatever you would tell
yourself on day fourteen. The alternative, writing down your own honest answer, is the one number you can
flatter yourself on.

**Retrieval: at most five misses out of twenty**, inherited unchanged from ticket 06 and ADR 0028. The
list of twenty messages is written **right after seeding and before the clock starts**, from the seeded
Vault only. That is the one moment you know what is in the Vault but have not yet watched the Lookup
succeed at anything. Write it at day fourteen and you will write questions you already know it can
answer. Captures added during the fortnight only make the test harder, which is the right direction.

Counting needs no new code. Capture days come from the inbox files and replies come from the chat, so the
Checkpoint is something you read rather than something the system computes.

The result goes in `.scratch/memark-v1/checkpoint-01.md`: the three numbers, the date, and what you
decided. In the repo, not the Vault, because the Vault is for your life rather than notes about the
project. ADR 0028 runs this same test again at about 200 Cards, and comparing two runs needs the first
one on paper.

### Withholding is theatre, so the word goes

Nothing is being held back from you. Every part left out of the First Loop pays off after months, so it
is later in a list rather than withheld to make a point. The old Stage 0 withheld the whole system to
avoid building on a habit that might not form. That claim does not survive a seeded Vault and a live
Digest, and the spec should stop making it.

So the Checkpoint stops gating **what gets built** and starts gating **whether you keep spending**. Pass
and the remaining parts get built. Fail and you stop and look at the capture path. That is a smaller
claim than Stage 0 made, and it is the true one.

### The spec edit

**Replace the Stage 0 section outright**, do not rewrite it. The write-only week is gone, the day-seven
gate is gone, and the paragraph arguing that a write-only week is a harder test defends a weakness that
no longer exists.

One paragraph survives: transcription and the mangled proper noun, and why quoting the transcript back is
load-bearing rather than a courtesy. It moves into Implementation Decisions beside "Acknowledgement is one
message that fills itself in", which is what it was always about. Sitting in a stage section made a
permanent concern look temporary.

New heading: **The First Loop and the Checkpoint**. No new ADR. The build order is neither hard to
reverse nor surprising, and the Checkpoint's substance already lives in ADR 0017, ADR 0028 and the two
new `CONTEXT.md` terms.

## Amendment

[Ticket 17](17-checkpoint-failure-branch.md) wrote the fail branch and changed two things above.

- The Checkpoint reads **two** numbers, not three. The twenty-message retrieval test keeps its timing but
  belongs to ADR 0028 rather than to the Checkpoint verdict.
- The Digest reply bar of three stays as the hope, but **only zero is a fail**, because ticket 11 itself
  established the proxy undercounts and a bar we cannot defend should not gate anything.

## Amendment

[Ticket 19](19-recall-by-date.md) adds one part to the First Loop.

- **Recall ships with the Lookup.** It answers a literal date or a literal range on the code path alone,
  so it needs no model and no Intent Read. Event names and loose windows switch on later with ticket 21.
  It is in for the same reason the Lookup is in: ADR 0028 settles retrieval before conversation ships so
  v1 builds one seam rather than a seam plus a workaround, and a date filter bolted on afterwards is
  exactly the workaround that argument refuses. `CONTEXT.md`'s First Loop entry carries it too.
