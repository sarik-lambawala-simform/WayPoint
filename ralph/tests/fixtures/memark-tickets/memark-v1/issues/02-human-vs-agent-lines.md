# Distinguishing human lines from agent lines

Map: [map.md](../map.md)
Type: grilling
Status: resolved
Blocked by: 01

## Question

Mostly settled by [ticket 01](01-card-line-grammar.md), which chose the marker convention ADR 0005
left open: a leading `!`, written by the human, and a line is Pinned because it is marked rather than
because a human typed it. That also answered the direction question, whether a human line may be a
Task (yes, `- [ ] ! text`), and where enforcement sits (one gate before write, per ADR 0026).

What is left is narrower.

- **The rejection question's wording.** The spec promises that an edit rejected for targeting a Pinned
  Claim becomes a question in the Digest, and never says what that question looks like. It has to show
  the human enough to judge without quoting a wall of text, and it has to be a numbered item so a
  reply can act on it. Decide what it can offer as a reply: is there anything to say beyond
  acknowledging it, given Superseding is out of scope and the agent may not apply the edit either way?
- **Whether the grammar forbids a source-less agent line.** Every agent line is meant to carry
  `from::`. Decide whether that is a rule the linter enforces, and if so whether any legitimate agent
  line has no source, since if one exists the rule cannot be absolute.
- **Confirm the standing ADR 0005 gap is still acceptable.** Only the immutability half is in v1.
  Superseding is out of scope, so a correction is durable in the Card while the Capture behind the
  wrong belief still says what it said and can be re-derived by a later run. Ticket 01 did not change
  this. Confirm it stands, or the scope changes.

Amends ADR 0005 if the last point moves.

## Answer

Three narrow questions, and the third one turned out not to be a rubber stamp.

**Only a `compact` can ever be rejected.** This was found by reading the write path rather than assumed,
and it reshapes the whole first question. There are three edit kinds. A `contradict` never reaches the
write path, so it cannot be rejected. An `extend` adds a line, and ADR 0005 explicitly allows the agent
to append beneath a Pinned Claim, so it is never rejected either. That leaves `compact`, which is the
only kind that rewords or drops an existing line. So the case the spec promises a Digest question for is
always compaction wanting to touch a line you marked.

**A rejected compact is dropped whole, never applied in part.** Not a choice, a consequence. If the model
folds lines A, B and C into one new line D and A is Pinned, code cannot apply D with A's meaning removed,
because D's wording covers all three and rewriting it needs a model call. So it is all or nothing. The
cost is a second floor on how short a Card gets, on top of ADR 0019's: a Pinned line freezes compaction
of the lines it sits with.

**Compaction comes in two kinds, and only one of them can strand a thought.** A housekeeping compact folds
tidy lines together and carries no new Capture. A reword compact is driven by a new Capture that agrees
with the old line and sharpens it. Only the second has anything to lose. So the Digest asks only when the
rejected edit carries a Capture that would otherwise be drained. The question exists to stop a thought
getting stranded, not to report housekeeping. **Story 54 narrows**: the question is promised when
something would be lost, not on every rejection.

**The Capture stays undrained, and `no N` is the only way out.** Same shape as a Contradiction, a Date
Request, a Proposed Date and a Proposed Heading: nothing is written until the human acts, and every Digest
asks again until they do. `no N` is reused rather than a new verb invented. There is deliberately no
`yes N`, because applying the edit is the one thing ADR 0005 bans. If you want the merge, you open the
Card and do it by hand, which is what pinning the line was for.

**The item shows two quotes and a name, and no model prose.** The Card name, your Pinned line, and what
you said today. The wording the model proposed is deliberately left out: it will never be applied, showing
it makes you want it applied, and it puts a machine sentence in the Digest arguing with two things you
wrote. The item's job is to point at a file, not to negotiate.

**`no N` writes a distinct marker, and the footer gains a second target type.** Every ADR 0021 footer
target so far is a line in a Card or a Date File. This one is an inbox block, and `no N` now branches on
the target type: an `x` line for a Date File, a marker for a block. That is exactly what the footer exists
for, but it is new and must be stated. The marker value is distinct, `filed:: declined` rather than the
ordinary one, because the ordinary marker would have the inbox claim a Capture was filed into a Card when
nothing was written anywhere. Filing skips the block either way; the journal and Lookup still read it,
which is right, because you did say the thing.

**A rejection is a model fault, not a normal event.** Found late, and it is what makes the Canary's count
worth reading. Compaction runs every filing run, so if the model kept proposing to fold a Pinned line the
Canary would print the same non-zero number every day forever, and a number that is never zero and never
actionable is one you stop reading. But a correct model never proposes it: it reads the Card, the `!` is
right there, and the prompt already states the rule. So `0 rejected` is the normal state, and a non-zero
one says the cheap tier is misreading the grammar. The code filter is a backstop, which is the honest
description of what ADR 0005's filter has always been.

**Provenance is a rule about proposed edits, not about files.** This is the answer to the second question,
and ticket 01 forces it. The linter reads a file and sees lines, and it cannot tell who wrote one, because
ticket 01 deliberately removed every authorship inference. A line typed into Obsidian has no `from::` and
never will, and if the `!` was forgotten it has no mark either. So a lint rule of "every unmarked line
carries `from::`" would fail every hand-typed line, and carving those out means guessing at authorship,
which is the exact thing ADR 0026 threw out. The rule works one step earlier instead. ADR 0014's edit
schema already carries which Capture an edit derives from, and everything in that object came from the
model by definition, so there is nothing to guess. An `extend` must name at least one Capture; a `compact`
must carry the sources of every line it folds, which ADR 0019 already demands for its own reasons; a
`contradict` never writes. An edit failing this is malformed and costs a batch, per ADR 0014.

So the direct answer to the ticket's question: **no agent-written line lacks a source, and source-less
lines still belong in Cards, because the human types them.** That is why the check cannot live in the
linter. Two checks, two shapes, both survive. The linter checks grammar. The schema checks where a claim
came from.

**The linter's business with `from::` splits along ADR 0026's existing two callers.** The write-path gate
checks only that the value parses as a wiki link, so it stays fast and file-local. The whole-Vault `lint`
command also checks that the link resolves to a block that exists, which catches a dangling source ADR
0019's orphan check cannot see because it runs the other way round. Hand editing is when links break, and
`lint` is the pass that runs after hand editing.

**A line you typed gains a `from::` the first time the agent edits it.** ADR 0019 forces it: the new
Capture must have a line pointing at it in that Card. The cost is that your words end up inside a line
that reads as the agent's own work. That is the same trade ticket 01 already made and named, showing up in
a second place, and it is written into ADR 0026 rather than left for someone to find.

**Two writes to Pinned lines are legal by construction and must not be broken by a later check.** `done N`
ticking a Pinned Task, and code bumping `shown:: 3` on one. Neither is blocked, because the ADR 0005 rule
is a filter over the model's proposed edits and a Command is not one.

**The ADR 0005 gap got wider, and the ticket did not know it.** When ADR 0005 accepted the gap it was
bounded: with Superseding out of scope, a wrong belief can be re-derived from its Capture by a later
Filing Run. One reader, and a reader with a floor under it, because filing writes into a Card where the
correction sits as a Pinned Claim. Ticket 06 added a second reader. The inbox is now half the search
corpus, and ticket 03 made that mandatory, since for a large class of questions the raw Capture is the
only place the answer is. So v1.1 conversation can answer out of a Capture already corrected, and nothing
filters it: there is no supersede mark, the correction lives in the Card rather than the inbox, and word
matching has no reason to rank the correction alongside the thing it corrects. Filing has the Pinned Claim
as a backstop. Lookup has none.

**Accepted, and written down rather than patched.** A `superseded:: true` field on the inbox block was
considered and declined, and the reason is that the cheap half is not the hard half: setting the mark needs
a verb, the verb needs a Digest item to point at, and the item needs the agent to have noticed the
correction at all, which is the Merge Proposal problem and the expensive part. Half of Superseding does not
buy half the value. Narrowing the corpus was refused on sight, since ticket 03 established the inbox is in
the corpus for exactly this kind of question. So the cost is stated plainly in both ADRs instead: **v1.1
conversation can tell you something you already corrected, and sound sure about it.** Superseding stays out
of scope for this destination, now with a recorded reason rather than an inherited one.

**Written as part of this resolution:** amendment paragraphs on ADR 0005, ADR 0026 and ADR 0028. No new
ADR, because every decision here is a consequence of ADR 0026, ADR 0014 and ADR 0019 rather than a new
trade-off standing on its own. No new `CONTEXT.md` term.

**Left for ticket 13:** narrow story 54 to promise the question only where a thought would be stranded;
fix the compaction paragraph, which still says the agent may drop "lines it authored" when ticket 01
replaced that with the marked and unmarked rule; add the footer's second target type and `no N`'s branch to
the Digest section; rewrite the Pinned Claims enforcement paragraph with the two kinds of compact and the
Canary's meaning; and split the acceptance test "a proposed edit that targets a Pinned Claim and must be
rejected and raised as a question" into two, one housekeeping compact asserting a Canary count and no
Digest item, one reword compact asserting an undrained Capture and a repeating item that `no N` ends.
