# What mark does a claim the box declines to write carry?

Type: grilling
Status: resolved
Resolved by: ADR 0048; the wording is unmeasured and split to ticket 08

## Question

ADR 0044, a Capture is drained by coverage and not by writes alone, gives a piece two marks.
`claim` says an edit was derived from those words. `skip` says they carry no claim at all.

A third case exists in the filing prompt and has no mark. `distillation.py:801` states the
durability test: would this still be worth reading in a month? `I am tired today` fails it, and
the prompt says it "gets no edit of any kind and the Capture keeps the words". Those words did
carry a claim. The model read one. It decided not to write it.

Neither mark fits, so the model picks one, and which one it picks decides whether the thought
survives.

**Measure first, then argue.** Repeat runs put the wrong pick at **1 of 15** on
`claude-haiku-4-5` and 0 of 3 on `claude-opus-5`. On the other 14 runs the model marked the piece
`claim` with no edits, which is exactly what the prompt asks for. The live session that started
this map hit the rare answer twice in a row. See [../finding.md](../finding.md).

So this ticket is not "the box has no answer". The box has an answer and the model usually gives
it. The question is narrower and harder: is a 1-in-15 chance of losing a thought with no trace
worth changing the schema for?

Argue the cost, not the rate. The two failures are not alike:

- Marked `claim` with no edits, the Capture is held, the evening Digest raises the words, and the
  person can act. Nothing is lost.
- Marked `skip`, the Capture drains, the reply says `Recorded:`, the Digest counts it clean, and
  no code path can see it. The reassembly check passes, because the words are the person's own.

A rate of 1 in 15 on a recoverable failure is noise. On an unrecoverable one it may not be. That
is the whole of this ticket.

The three shapes:

- `claim` with no edits holds the Capture in the queue and the evening Digest raises the words.
  Correct for a lost thought, and wrong for a mood, because it asks the person about every
  passing feeling they ever typed.
- `skip` drains the Capture, marks it `filed::`, and replies `Recorded:`. Correct for a mood.
  For a real claim it is the loss ADR 0044 was written to make impossible.

Decide what the box does here. Some shapes to argue with, not a menu to pick from:

1. **A third mark.** Something like `declined`: the model read a claim and judged it not worth a
   line. The Capture drains, but the reply and the Vault both say so. Costs a schema change, a
   prompt change, and a change to the acknowledgement ADR 0024 defines.
2. **Narrow `skip`.** Forbid the model from marking `skip` over any words it read a claim in,
   whatever it decided about writing. A declined claim becomes `claim` with no edits, and the
   holding behaviour is then the problem to solve separately. Cheaper, and it pushes the mood
   stream into the evening Digest, which the standing preference in the map says is bad.
3. **Leave the marks alone and fix the line.** Ticket 02 raises the rate of correct filing, and
   a claim that is filed is never marked anything. If ticket 02 takes the drop rate near zero,
   the 1-in-15 mark error applies to a much smaller pool and may cost nothing worth paying for.
   This is the cheapest answer and the measured rates now favour it, so argue it properly rather
   than reaching for option 1. The counter-argument is that the line will always be a judgement,
   so some claim will always land on the wrong side of it, and the question is what the box does
   then.

Resolve this one **after** ticket 02 has a number, or at least read ticket 02's answer first.
The ordering is not a blocking edge, because the decision can be argued either way round, but a
session that decides the schema before knowing the new drop rate is deciding blind.

Two things constrain any answer.

**ADR 0014, the model proposes edits and code applies them.** Whether words carried a claim is a
reading of what the person meant, so it is the model's to say. Code cannot decide it. A fix that
has code re-read the words argues with this ADR and must say so.

**ADR 0044 refused a code-only backstop** based on how long a Capture looks for one edit, because
`mixer ka ring aana hai` is five words and was the claim being lost. Do not re-propose a length
rule. Ticket 03 measures a different signal.

Resolve by naming the mark, what the Capture does under it, and what ADR changes. Write the ADR
in the same session.

## Answer

Settled in a grilling session on 2026-09-21, with `/mattpocock-skills:domain-modeling`. Written up
as ADR 0048, `skip` means the words hold nothing that stands. ADR 0044 carries a pointer section.

**A declined claim is `skip`, and `skip` is redefined rather than joined by a third mark.** `skip`
no longer means the words carry no claim at all. It means they hold nothing that stands. A greeting
holds nothing that stands. So does a passing mood the durability test turned down.

### The measurement changed the question

This ticket was written to ask whether a 1-in-15 silent loss was worth a schema change. It measured
both sides first, bundled with ticket 06's run. Fifty calls on `claude-haiku-4-5`, `claude-cli`
mode, 2026-09-21. Both tables are in [../finding.md](../finding.md).

- **The silent loss is 0 of 10.** `L300:mark` and `L301:mark` no longer come back `skip` at all.
  Ticket 02's wording files the claim, and a filed claim is never marked anything else. Option 3 on
  the list above, leave the marks alone and fix the line, was right about this half.
- **The noisy failure is 8 of 10.** A new probe, `a_mood_held_the_capture`, read the mark on a
  passing mood for the first time. `L126:mark` and `L153:mark` are 4 of 5 each. Four times in five,
  a mood is marked `claim` with no edits, its Capture is held, and the evening Digest queues a
  question about how tired the person was.

So the two halves swapped size. The rare, unrecoverable failure this ticket was built around is
gone. The failure that is left is the common one, and it is the box working as the prompt asks. The
prompt says a `claim` piece with no edit is right "whenever you read a claim you could not place",
and a turned-down mood reads as exactly that.

That is why option 3 does not finish the job. It fixed the loss and left the noise, and the noise
was never measured until now.

### Why not a third mark

The full argument is in ADR 0048. Three reasons, short:

- Nothing branches on it. A declined claim and a greeting get the same treatment, and a mark no code
  reads is a field to keep in step across the schema, the prompt, `vault/apply.py`, the
  acknowledgement and every fixture.
- It costs the reply. ADR 0024, filing is frequent and speaking is daily, gives the reply one mark
  per piece. A third mark is a fourth thing to show on the most ordinary message a person sends.
- It asks the cheap tier a three-way question. Per ADR 0003, two tiers of model, filing runs on the
  cheap tier, and the defect being fixed is that tier already mishandling a two-way one.

### What landed in this session

- **`docs/adr/0048-skip-means-the-words-hold-nothing-that-stands.md`**.
- **`docs/adr/0044-...md`** gains an `Amended by phase 10.96 ticket 01` section pointing at 0048.
  The coverage rule, the reassembly check and the `edits` field are untouched.
- **`memark/distillation.py`**, two prompt bullets changed as a pair. The `skip` bullet says the
  words hold nothing that stands and names a turned-down mood beside the greeting. The
  `claim`-with-no-edits bullet keeps its job, a claim that stands and could not be placed, and says
  a turned-down claim is not that case. One without the other leaves the two bullets contradicting
  each other, which is what produced the 8 of 10.
- **`memark/distillation.py`**, the comment on `CLAIM` and `SKIP` moved with the prompt.
- **`harness/live/repeat.py`**, a new probe `a_mood_held_the_capture`, registered as `L126:mark` and
  `L153:mark`. It reads the queue's side of the durability test, where `a_mood_reached_the_card`
  reads the Card's side. Nothing read the mark on a mood before.
- **`.scratch/.../finding.md`**, four tables of after-rates.
- No new word in `CONTEXT.md`. One mark now has one meaning, and naming a declined claim apart in
  the glossary would argue with the decision. The **Durability Test** entry already carries the
  question that separates them. Recorded in ADR 0048 so it reads as decided rather than missed.
- The unit suite is green, 1763 passed.

### What this ticket does not carry

**The measured rate of the new wording.** It is in the prompt and nobody has run it. Split to
**ticket 08**, the same way ticket 02 split its measurement to ticket 06. The bar is 0 of 10 on
`L126:mark` and `L153:mark`, with the phase 10.95 rows that assert a real unplaced claim still holds
its Capture as the no-regression side.

**Ticket 03 is invalidated by this answer.** It measures whether "every piece came back `skip`" is a
signal code can read. That only works if an all-`skip` Capture is rare and suspicious. Under this
decision every passing mood is an all-`skip` Capture on purpose, so the signal is the normal case.
