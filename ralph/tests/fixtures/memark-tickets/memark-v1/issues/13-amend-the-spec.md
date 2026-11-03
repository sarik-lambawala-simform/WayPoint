# Amend the spec and write the ADRs

Map: [map.md](../map.md)
Type: task
Status: resolved
Blocked by: 02, 04, 06, 08, 10, 11, 12, 15, 16, 17

## Question

The destination. Nothing to decide here — this ticket executes the write-up once every decision above
is resolved.

- Fold the resolutions into `.scratch/memark-v1/spec.md`, following its own stated conventions:
  stories 1–87 keep their numbers, new stories append as 88+, and a story whose promise changed is
  amended in place rather than renumbered.
- Rewrite the Stage 0 section per ticket 11.
- Add the new sections the additions need — Card grammar, Journaling, Conversation (marked v1.1),
  moving dates — in the voice and at the altitude of the existing Implementation Decisions.
- Update the Cost table for journaling and for conversation at v1.1, and update the three conclusions
  under it if the shape of the bill changed.
- Extend Testing Decisions with the new cases each resolution implies, written as the existing ones
  are — driven through the single seam, asserting on files, commits and outbound messages only.
- Update Out of Scope: add calendar integration, reminder-app push and the custom mobile app; move
  Journaling out of it; restate Conversation as deferred-to-v1.1-with-a-decided-mechanism rather than
  refused.
- Write or amend every ADR the resolved tickets called for, and check that no existing ADR now
  contradicts the spec. Confirm the spec's ADR cross-references still resolve.
- Update `CONTEXT.md` with every term that crystallised, keeping it a glossary and nothing else.
- Re-read the spec's own honesty about scope. It already concedes it is not a thin slice; it has since
  grown. Either that paragraph is updated to tell the truth about the new size, or the build order from
  ticket 11 is doing the work that paragraph was worried about — say which, in the spec.

## Corrections to existing spec text, found while resolving tickets

- **The Cost section's claim that prompt caching is no help is wrong for conversation.** It is correct
  for Filing Runs and the Digest (a day apart, past any TTL), and false for conversational turns
  (seconds apart, 5-minute cache refreshed free on each read at 0.1x). Amend the sentence to scope it
  to the scheduled runs rather than the whole system, and record haiku's 4,096-token minimum cacheable
  prefix, which is why caching does nothing until roughly 200 Cards. Source: ticket 05.
- **The Out of Scope entry on embeddings and lexical ranking argues partly from cost.** Ticket 05
  establishes that at this Vault's scale every rung of ADR 0002's ladder costs indistinguishably
  nothing, and the real separators are state, egress and dependency weight. Whatever ticket 06 decides,
  the cost half of that argument should not survive into the amended spec unchanged.
- **Stories 53 and 56 both need amending, from ticket 01.** Story 53 must say the human *marks* a line
  to make it a Pinned Claim, since an unmarked hand-written line is editable. Story 56 must move the
  unresolved Contradiction out of the Card and into the Digest, which keeps asking until it is settled.
- **Every Card and Date File example in the spec is written in the old grammar.** Ticket 01 fixed one
  line grammar for both, with `·` separated fields whose keys end in `::`. So the worked example's
  `— [[inbox/…]]` becomes `from:: [[inbox/…]]`, and the Date File block's `notice:`, `tier:` and
  `from:` all gain the second colon. ADR 0011's examples need the same sweep; its decision is
  untouched. Add `schema: 1` to every frontmatter example.
- **Add a Card grammar section to Implementation Decisions**, per ADR 0026, and a note that the
  allowed headings live in a file in the Vault rather than in code, because a Proposed Heading is
  approved by replying to a Digest.
- **The Health Canary line gains a count**, from ticket 01: how many Cards failed the format check and
  had their edits dropped. It is the Stale Target path, so it should be reported the way Stale Targets
  are.
- **Story 54 narrows, from ticket 02.** It promises a Digest question whenever an edit is rejected for
  targeting a Pinned Claim. Only a `compact` can ever be rejected, and only a reword compact carries a
  Capture that would otherwise be stranded. So the question is promised where a thought would be lost,
  not on every rejection; a housekeeping rejection is a Health Canary count and nothing more.
- **The compaction paragraph still says the agent may drop "lines it authored".** Ticket 01 replaced
  authorship with the marked and unmarked rule, so the sentence describes a distinction the system no
  longer tracks. Rewrite it against the mark.
- **Rewrite the Pinned Claims enforcement paragraph, from ticket 02.** It should carry which edit kinds
  can actually be rejected (`compact` only, because `contradict` never reaches the write path and
  `extend` may append beneath a Pinned Claim), that a rejected compact is dropped whole rather than in
  part, the split between housekeeping and reword compacts, that the rejected edit's Capture stays
  undrained with `no N` as the only reply and no `yes N`, and that a rejection is a model fault so the
  Canary's rejected count is expected to be zero.
- **The Digest section gains the footer's second target type, from ticket 02.** Every ADR 0021 footer
  target so far is a line in a Card or a Date File; a rejection's target is an inbox block, and `no N`
  branches on the target type. The block gets a distinct marker value, `filed:: declined`, so the inbox
  never claims a Capture was filed into a Card when nothing was written.
- **Add the provenance rule to the Card grammar section, from ticket 02.** `from::` is checked on the
  proposed edit rather than on the file, because the linter cannot tell who wrote a line. The write-path
  gate checks the link parses; the whole-Vault `lint` command also checks it resolves.

## Comments

**From ticket 06 (the retrieval seam).** Carries into the spec: Lookup as a named step in the
Implementation Decisions; a cap of ~40 answered messages a day in the Cost section, with the bot saying
so rather than switching to a weaker model; four new cases on the message-handler seam (named subject
cited, subject-less message matching one Card, message matching nothing asserting the reply asks, named
match not suppressed by a stronger word match elsewhere). Two Out of Scope entries need rewriting rather
than deleting: "Lexical ranking of the Registry" stays out and is now out for a stated reason, while
lexical ranking of Card bodies for conversation is in; and the Conversation entry loses its "no
retrieval mechanism exists" framing.

**From ticket 02 (human vs agent lines).** One acceptance test splits in two. The existing case, "a
proposed edit that targets a Pinned Claim and must be rejected and raised as a question", becomes a
housekeeping compact asserting a Canary count and *no* Digest item, and a reword compact asserting an
undrained Capture, a Digest item repeating across runs, and `no N` ending it with a `filed:: declined`
marker and nothing written to the Card. Two more cases worth adding: `done N` ticking a Pinned Task,
asserting it succeeds, since the ADR 0005 filter covers the model's proposed edits and a Command is not
one; and a `from::` pointing at a block that does not exist, asserting the whole-Vault `lint` fails it
and the write-path gate does not.

## Comments

**From ticket 11 (build order and Checkpoint).** The Stage 0 section is **replaced outright**, not
rewritten, under the new heading "The First Loop and the Checkpoint". One paragraph survives the deletion,
the one on transcription and the mangled proper noun, and it moves into Implementation Decisions beside
"Acknowledgement is one message that fills itself in". Two words leave the spec's vocabulary: "Stage 0"
and "withheld". Two enter, both defined in `CONTEXT.md`: First Loop and Checkpoint. Two existing pieces
need amending rather than adding: story 54 and the Canary lose the Pinned Claim rejection item, because
dropping compaction from the First Loop drops the only edit kind that can be rejected. Ticket 17 owns the
failure branch of the new section, so it blocks this one.

## Comments

**From ticket 16 (the conversation surface).** The v1.1 Conversation section needs a worked example, in
the shape of the existing Capture walkthrough: a spoken chat turn answered, a nothing-found reply, a
named-miss reply, the cap line and the failed-answer fallback. Carry into Implementation Decisions: chat
answers are plain text with no parse mode while the Digest uses `HTML`, and the reason is who writes the
text; answers arrive whole with the typing indicator filling the gap; the 4,096 character split is a
backstop under a short-answer instruction. The single sentence to lift into the spec is the rule the
ticket reduced to: every message you send gets exactly one reply, and an answer is one kind of reply. The
Cost section's cap sentence needs the counting rule (attempted calls, local midnight) rather than just the
number. The Health Canary gains one more count, edits refused by Telegram, reported as a Stale Target is.
Two new testing cases on the message-handler seam: a voice chat turn asserting the transcript is the
answer's first line, and a failed answering call asserting the echo is sent and the block is left unfiled
rather than marked.

## Answer

The spec is amended, the two ADRs that had gone stale are fixed, and `CONTEXT.md` is checked term by
term. Nothing here decided anything: every judgement was made in tickets 01 to 17 and this ticket
carried it into the document.

### What changed in `spec.md`

**The scope paragraph now tells the truth about the size.** The list of moving parts is about thirty
rather than twenty-four, and the paragraph names the build order as the thing doing the work the old
one worried about. It says the point at which the list stops growing is now decided after two numbers
rather than before any code.

**Stage 0 is replaced outright by "The First Loop and the Checkpoint".** Both words left the
vocabulary, "Stage 0" and "withheld", and a grep confirms neither survives anywhere in the spec. The
one surviving paragraph, transcription and the mangled proper noun, moved into Implementation Decisions
beside the acknowledgement, where a permanent concern stops looking temporary. The section carries
ticket 11's in/out list and build order and ticket 17's failure branch: two numbers, each read
separately, only Capture days able to stop the project, one re-run of one week, no extension.

**Stories.** 53 amended to say the human marks the line. 54 narrowed to promise the question only
where a thought would be stranded. 56 moved the unresolved Contradiction out of the Card and into the
Digest. 71 lost Journaling, which is now built. Eighteen new stories, 88 to 107, in six groups: the
journal, reading and correcting a Card, dates that move, starting from something rather than nothing,
which day a thought belongs to, and conversation in v1.1.

**New sections in Implementation Decisions.** The Card grammar with `schema: 1`, the three Line Marks,
Line Fields, headings held in a file in the Vault, provenance checked on the edit rather than the file,
and the one lint gate with its two callers. Moving dates and the Date Request, with the two-notice-window
constraint spelled out. The journal, generation, the code-written empty day, bounded backfill, `catchup`,
the snapshot rule and the seeder's stated day. Capture dating with Send Time, Receipt Time and the open
day. The Lookup, as a named step built in v1. The seeding interview. And "Conversation, in v1.1" as a
`###` subsection at the end of Implementation Decisions, so everything deferred sits in one place a
reader can skip.

**Amended in place.** Vault layout gains `journal/` and the `YYYY/MM/` nesting plus the storage-versus-
display split. The compaction paragraph is rewritten against the mark rather than authorship. The
Pinned Claim paragraph is rewritten with the compact-only rule, the whole-or-nothing drop, the split
between housekeeping and reword, `no N` as the only reply, and the rejected count expected to be zero.
The Digest section gains the footer's second target type and `filed:: declined`. The Health Canary
gains four counts. The Registry paragraph gains `aka::` and the rule that Lookup and filing must not be
merged. Filing gains the 30-day scan and the file-order batching rule. Message classification gains
`catchup` as the first bare-verb Command. Configuration gains the display formats, the backfill bound
and the answered-message cap.

**The worked example** is swept to the new grammar throughout: `schema: 1`, `from::`, `·` separated
fields, `YYYY/MM/` paths, and an `ack::` field on the inbox block. It gains a journal entry written
just after midnight, and a v1.1 subsection with the five conversation shapes: an answered spoken turn,
nothing found, a named miss, the cap, and a failed answer.

**Cost.** The caching sentence is scoped to the scheduled runs and now records haiku's 4,096-token
minimum cacheable prefix, which is why caching does nothing until roughly 200 Cards. A journal row at
~$0.011/day, flat across all three columns. A v1.1 conversation row at up to ~$0.80/day at the cap.
Totals move to ~$4.25, ~$4.85 and ~$5.45 a month. The conclusions are rewritten: the journal is named
as the only flat row, and "Questions dominate" becomes "talking to it dominates", with the cap
explained as the thing that keeps the bill predictable.

**Testing Decisions.** The message-handler seam gains four Lookup cases, two dating cases, one
`lint`-versus-write-path case, and two marked v1.1. The Pinned Claim case splits into two as ticket 02
required, and a `done N` on a Pinned Task is added. Eleven Vault fixtures added for the grammar, the
journal, Date Requests and file-order batching.

**Out of Scope.** Journaling removed. Conversation restated as deferred to v1.1 with a decided
mechanism. The Registry ranking entry now states its reason and says plainly that ranking Card bodies
for conversation is in. The embeddings entry drops the cost argument, per ticket 05, and keeps state,
egress and dependency weight. Added: the custom mobile app, calendar integration, reminder-app push,
Superseding with its recorded cost, and computing a moving festival date.

**Further Notes.** The behavioural-risk paragraph now points at the Checkpoint, and carries ticket 04's
corrected claim verbatim: the Digest carries the first week and the journal carries the first month.

### ADRs

Every ADR the tickets called for had already been written by the ticket that decided it, 0026 through
0030, with amendments on 0001, 0002, 0005, 0010, 0012, 0018, 0023, 0027, 0028 and 0029. Two had gone
stale and are fixed here:

- **ADR 0011** carried `dates/YYYY/YYYY-MM-DD.md`, which ADR 0001's nesting amendment had already
  contradicted, and had no `::` grammar. It gains one amendment paragraph covering both, plus a
  paragraph naming the Date Request as a third kind of line that adds no new file shape. Its decision
  is untouched.
- **ADR 0016** carried `notice: 90d, 15d..0d` with one colon. Swept.

Every `ADR 00NN` reference in the spec was checked against `docs/adr/` and all thirty resolve.

### `CONTEXT.md`

Every term the tickets crystallised was already present: Line Mark, Line Field, Proposed Heading,
Journal Entry, Date Request, Lookup, Thread, Agent Turn, First Loop, Checkpoint, Send Time, Receipt
Time, Closed Day, plus the rewritten Pinned Claim, Task and Contradiction. Three entries were stale
against the amended spec and were corrected: Question said "recognised by exact pattern", which
contradicts ADR 0018's loose recognition and mattered more once chat existed; Command did not carry
`catchup`; Filing Run did not carry the journal step or the 30-day scan. It remains a glossary.

### One thing worth a reader's attention

New prose in this amendment follows the repo's writing rules, which forbid em dashes. The document it
sits in uses them heavily, so the spec now mixes both. Sentences carried over unchanged were not
repunctuated, because that is a different job from this one. A full pass over the older text would make
it consistent and is not part of this ticket.
