# Amend the spec again, for the conversational turn

Map: [map.md](../map.md)
Type: task
Status: resolved
Blocked by: 18 (answered), 19 (answered), 20 (answered), 21 (answered), 22 (answered)

## Question

The second destination. Nothing to decide here — this ticket executes the write-up once tickets 18
through 22 are resolved.

[Ticket 13](13-amend-the-spec.md) did this once and is resolved. It is not reopened: it was correct for
the effort it closed, and its record of what changed and why should stay readable. This is a second pass
over the same document for a change of direction ticket 13 could not have anticipated.

**What makes this pass different.** Ticket 13 folded in additions. This one folds in a constraint that
withdraws answers the spec currently gives. The new standing constraint on the map is that Telegram is
the only surface a human is required to use, and "edit the line in Obsidian" is no longer an available
answer anywhere. Every section has to be read with that in hand, not only the sections the tickets
touched.

## The work

- Fold the resolutions of tickets 18–22 into `.scratch/memark-v1/spec.md`, following its own
  conventions: existing stories keep their numbers, new stories append after the highest in use, and a
  story whose promise changed is amended in place rather than renumbered.
- **Rewrite the classification section outright.** It is the section every one of these tickets lands on,
  and if ticket 21 resolves toward intent at receipt it is no longer describing the system at all.
- **Sweep for "open it in Obsidian" as an answer.** It appears as the fix for a misheard name, for a
  forgotten Line Mark, and implicitly wherever the Command grammar cannot express something. Each
  occurrence is now either a gap with an owner or a stated, accepted limit. There is no third option.
- **Re-price the Cost section.** If intent runs per message, cost is linear in how much the human talks
  rather than flat per day, and the three conclusions under the table are about a bill that no longer
  has that shape. Ticket 13 already corrected one wrong claim in this section about prompt caching;
  check the corrected version still holds.
- **Re-read the Checkpoint against the new cost model.** The gate measures a habit over two weeks and
  assumed a flat per-day cost. Ticket 11's checkpoint and ticket 17's failure branch both need checking
  against whatever ticket 21 decides, and the slow failure in ticket 20 is invisible to a two-week
  window by construction — say so in the spec rather than leaving it to be discovered.
- **Re-read the First Loop.** Ticket 18 establishes that Ambiguous Subjects shipped without any way for
  the human to answer the question they raise. Whatever else changes, the rule that a part is only in
  the First Loop if its whole loop closes should be stated, because that is the check that was missing.
- **Update the Health Canary's contents.** At least three tickets add counts to it: blocks that aged out
  unfiled (22), per-Card size or line count (20), and whatever ticket 21's failure modes need.
- **Extend Testing Decisions**, written as the existing cases are: driven through the single seam,
  asserting on files, commits and outbound messages only. The cases these tickets imply include a
  message carrying several intents, a Digest question being answered, a Capture aged out at the scan
  boundary, a return after a long outage, and a date-scoped recall.
- **Update Out of Scope.** Task decay is currently deferred and ticket 20 may pull it back in. Check
  nothing else moved.
- **Write or amend every ADR the resolutions call for**, and check that no existing ADR now contradicts
  the spec. The ones most likely to move are 0002, 0011, 0012, 0013, 0015, 0018, 0019, 0021, 0022,
  0024, 0027 and 0028. Confirm every ADR cross-reference in the spec still resolves.
- **Update `CONTEXT.md`** with every term that crystallised, keeping it a glossary and nothing else.
- **Update the worked example.** The end-to-end example is the shape the system is tested against, and
  it currently shows only clean single-intent messages. It should carry at least one message that does
  several things, since that is now the main path rather than an edge case.
- **Say the honest thing about scope, again.** The spec already concedes it is not a thin slice. It has
  since grown twice. Either that paragraph tells the truth about the new size, or the build order is
  doing the work the paragraph was worried about. Say which, in the spec.

## Corrections to existing spec text, found while opening tickets 18–22

Recorded here as they were found, so they are not lost if a ticket resolves in a direction that does not
happen to mention them.

- **The spec names confirmation as the place a tier is set, and provides no way to set one.** *"Confirmation
  is where the tier and any non-default Notice Schedule are set, defaulting to tier 2 and `5d..0d`."* The
  Command grammar is `verb + digits`. Every confirmed date is therefore tier 2 with a five-day run-up
  forever. Either the grammar gains arguments or that sentence is false and must be rewritten. Source:
  ticket 18.
- **ADR 0028 fixes the corpus and never mentions Date Files.** It declines three candidates and argues
  each. `dates/` is not among them; it was never considered. Since ADR 0011 moved dates out of Cards,
  this means no dated fact is readable by the one function that answers questions. Whatever ticket 19
  decides, ADR 0028 should record the decision explicitly rather than leaving an omission. Source:
  ticket 19.
- **Stories 6 and 63 promise unbounded offline tolerance and name no limit.** If Telegram drops
  undelivered updates after about 24 hours, both are false for any absence longer than a day. Amend them
  to state the real horizon whichever way ticket 22 resolves. Source: ticket 22.
- **The 30-day figure is described as "one number, three places" as though symmetry were required.** The
  actual constraint is scan reach at least as far as write reach, not equality. The sentence should say
  the weaker true thing, so a future reader does not treat widening the scan as forbidden. Source:
  ticket 22.
- **ADR 0012's amendment carves out only the seeding interview** for a date the human states directly. A
  date stated plainly in a Telegram Capture is the same act and is treated as an inference. Either the
  carve-out widens or the ADR states why the interview is special. Source: ticket 18.
- **The Digest's ask paths were never audited as a set.** Ambiguous Subject, Contradiction, Proposed
  Heading, Merge Proposal and Date Request all raise questions. At least one of them has no reply verb.
  The amended spec should show each ask paired with the reply that answers it. Source: ticket 18.

## Settled by ticket 18, ready to fold in

[Ticket 18](18-one-message-many-intents.md) is resolved and wrote ADR 0032. Four of the corrections
above are answered by it, and the rest of its answer lands on this document. Read ADR 0032 first.

- **Classification section.** Rewritten outright, not patched. Three-way whole-message classification is
  gone. What replaces it: a typed Command is checked first with its pattern unchanged and costs no model
  call; everything else goes to an Intent Read, which returns changes in ADR 0014's shape for code to
  check and apply. The whole raw message is appended as a Capture first, always, before any of that.
- **Stories.** 51 loses its meaning and is rewritten, because you no longer type Commands: what it
  protected is now carried by exact-match-or-nothing, the reply naming every change, and `undo`. 52 is
  amended in place to the weaker true promise. Both keep their numbers.
- **Delete the voice-note rule.** *"Voice notes are never Commands"* does not survive. Voice is treated
  exactly like text, with ticket 16's quote-back of a spoken turn made compulsory.
- **"Confirmation is where the tier is set" becomes true.** Tier and Notice Schedule are said in words at
  confirmation and translated by the Intent Read. Defaults unchanged. Add the honesty rule: priority
  tiers are out of the First Loop, so v1 writes the number and does not sort by it, and the reply must
  not imply otherwise.
- **New verb `pick`.** Sixth Command, taking an item number and a name matched exactly against Registry
  rows. Accepted on purpose, because the Digest asks questions nothing could answer.
- **The ask-path audit is done.** Proposed Date, Proposed Heading, Merge Proposal, Date Request,
  Ambiguous Subject, Contradiction. All six have a reply. Show each ask paired with its reply, as this
  ticket asks.
- **ADR 0012's carve-out widened**, with a test code runs rather than the model reporting confidence:
  does the message literally contain a date?
- **New limit to document.** Intent Reads get their own limit, separate from ticket 16's answering cap.
  Passing it drops the system back to saving and echoing. The real numbers are ticket 21's to supply.
- **Worked example.** ADR 0032 has one showing a message that answers, ticks off a Task and files the
  rest in one reply. That is the shape the example should carry.
- **First Loop.** Ambiguous Subjects now have a reply, so they stay. State the rule that was missing: a
  part is only in the First Loop if its whole loop closes.

Ticket 21 has since answered all of that. See the section below.

## Settled by ticket 19, ready to fold in

[Ticket 19](19-recall-by-date.md) is resolved and wrote ADR 0033. It answers the second correction
listed above, that ADR 0028 never mentioned Date Files. Read ADR 0033 first.

- **New Implementation Decisions subsection: Recall.** A second function beside the Lookup, taking a
  date or a pair of dates and returning the Captures sent in that window and the Date File lines it
  covers. State the corpus rule plainly: Date Files are out of word matching for the reason the Registry
  is out, and reachable by name and by date instead.
- **Stories.** New ones for asking about a day, asking about a range, asking about a named past event,
  and being told plainly that a day was empty or that an event is not on record. Say in the story about
  a named event that the answer comes from a past one-shot Date File, since that is what makes it work.
- **The `dates/` blind spot is the spec's too.** Anywhere the spec describes what a Question can be
  answered from, it currently implies Cards and Captures only. Dated lines are now readable, so the
  dentist worked case in ticket 19 stops being a wrong answer that sounds right.
- **Inert lines in an answer.** Record the rule: `?`, `x` and `handled::` are all returned and each is
  stated for what it is, and Recall never presents an inert line as one that will fire.
- **Cost section.** A Recall answer counts against the same answering cap. The material is capped rather
  than the range: one named day whole, a range cut at 40 Capture blocks after ranking. The sources line
  states the cut. Fold this in with ticket 21's re-pricing, since both land on the same table.
- **First Loop.** It gains Recall, per ticket 11's amendment. It closes its own loop on the code path,
  so it passes the rule that a part is only in the First Loop if its whole loop closes.
- **Testing Decisions.** This ticket already asks for a date-scoped recall case. It needs four: a named
  day read whole, a range that hits the 40-block cap and says so, a day with no inbox file answered as
  "you sent nothing", and a named event with no confirmed date answered as absent rather than guessed.
- **Out of Scope gains the per-day tag index**, with its reason, so a good idea that was argued and
  declined is not quietly reinvented later.
- **ADR cross-references.** ADR 0033 is new. ADR 0028, ADR 0027 and ADR 0011 all gained amendments and
  the spec's references to them should be re-read against the amended text.

## Settled by ticket 21, ready to fold in

[Ticket 21](21-intent-at-receipt.md) is resolved and wrote ADR 0035, amending ADR 0024 and ADR 0032.
Read ADR 0035 first. It supplies the numbers ticket 18 left owing.

- **Classification section.** The rewrite ticket 18 asked for now has its write path. Order: strict
  Command check, raw Capture appended, Intent Read, per-change checking by code, Pending Instruction
  appended, reply. No Card is touched at receipt.
- **New Implementation Decisions subsection: the Pending Instruction.** Where it lives in the inbox
  file, what fields it carries, and the rule it exists for, which is that a Card has exactly one writer.
  State plainly that the reply says "will close" and why that is not a weakness.
- **Amend the Filing Run description.** A run now has two halves of very different price. It applies
  Pending Instructions with pure code every few minutes and calls the model on the filing clock. Say
  that this is one entry point, one lock and one code path, because the Testing Decisions section rests
  on it. Note that the run interval and the filing-model interval are now two numbers, not one.
- **Cost section, re-priced.** Add an Intent Read row: flat in Vault size, cheap tier, ~$0.003 a
  message, about $0.43, $1.74 and $4.35 a month at 5, 20 and 50 messages a day. Fold in ticket 19's
  Recall answers, which land on the same table. Rewrite the conclusions: cost is now linear in talking
  on two lines rather than one, and the Intent Read joins the journal as the second flat-in-Vault-size
  row, which is worth saying because the table's story used to be that only the journal managed it.
  State that prompt caching does not help the Intent Read and why.
- **Checkpoint, re-read.** The gate assumed flat per-day cost. It no longer is. State the fortnight's
  likely spend at the Checkpoint's own message volumes rather than leaving it to be discovered, and
  check ticket 11's and ticket 17's readings still make sense.
- **Settings.** Two new ones. The model id for each tier is a **Box Setting** per ADR 0031. The Intent
  Read limit of 150 a day is a **Vault Setting**, joining the caps already there. The spec has no
  Settings section yet and ADR 0031 needs one; this is the pass that writes it.
- **Stories.** New ones for closing a Task by talking, for correcting a Proposed Date in words, and for
  `undo`. Amend story 43 (cost grows with what I said) with the honest new shape. Amend story 52 again:
  the raw Capture is on disk before any model runs, no Card changes at receipt, every change is named,
  and one word takes it back.
- **Health Canary.** Add the count of Pending Instructions no run has applied. This is ticket 21's
  failure mode and it is invisible in the chat by construction.
- **Worked example.** Use the message ticket 21 walked end to end: a Task closed in prose, a Proposed
  Date corrected with a stated date and a recurrence, a Question mid-message, and one vague phrase that
  is refused and named back. It exercises the multi-intent path, the reply's three edits, and the
  Pending Instruction, which is what makes it worth being the example.
- **Testing Decisions.** Cases this adds: a message closing a Task by prose where exactly one open Task
  matches; the same where two match, asserting nothing closes and the reply lists both; a message where
  one change is refused and the others apply; `undo` after a Pending Instruction is written but before a
  run applies it; a run whose only work is a Pending Instruction, asserting a commit and zero model
  calls; and the Intent Read limit being passed, asserting the message is saved and echoed and that
  `done 2` still ticks a box.
- **ADR cross-references.** ADR 0035 is new. ADR 0024 and ADR 0032 gained amendments. Check ADR 0004,
  ADR 0009 and ADR 0002 read correctly against the new write path, since all three were argued about and
  all three come through unchanged.

## Settled by ticket 22, ready to fold in

[Ticket 22](22-backlog-and-the-offline-horizon.md) is resolved and wrote ADR 0036 and ADR 0037,
amending ADR 0027, ADR 0030, ADR 0031 and ADR 0017. Read both new ADRs first. This one withdraws a
promise the spec makes rather than adding to it, so read stories 6 and 63 before anything else.

- **Story 6, rewritten.** It currently promises that Telegram holds Captures "until the system collects
  them" with no limit, and that is false past 24 hours. Rewrite it to promise the day the Bot API
  actually gives, and add a story for Recovery so the honest limit and its escape hatch appear together.
- **Story 63, amended.** "A gap in attention does not create a backlog I must process by hand" survives
  for the box-on case and is now true further, since filing has no scan window. Say which failure it
  covers, because it does not cover the box being off.
- **New Implementation Decisions subsection: Recovery.** The 24-hour fact with its quote, the two
  routes, the user-origin rule that refuses channel and group forwards, the four rules a restored
  Capture follows (no Intent Read, exact-match dedup, one reply per batch, real day or today), and the
  20 MB file limit. State the client API as the named escalation with its trigger, in ADR 0002's style.
- **The Running Unattended section.** It is the section this ticket most changes. It has never named
  the offline horizon at all, and it now has to name it, name the recovery routes, and name the
  liveness deadline and route.
- **Amend the Filing Run description.** It scans the whole inbox, not the last 30 days. Say why the
  reads are not the cost and why the asking is, and describe parking and `unpark` there.
- **Amend the journal section.** A day with no inbox file gets no entry. The old "a file for all 365
  days" line goes, and the pairing rule replaces it: a journal file exists exactly when the inbox file
  does. This is the change most likely to be missed, because it reads like a small tidy-up and it is
  what makes Recovery possible at all.
- **Capture dating.** Drop the 30-day write window. An open day is the whole test.
- **Health Canary.** Three additions: the count of Parked blocks, the count of days where the journal
  and inbox files disagree, and the destination rule (Vault Setting, with the push channel as the
  fallback when no Digest can be sent).
- **Settings.** Two more for the Settings section ticket 21 already asked for. The Canary destination
  is a **Vault Setting**; the push topic URL is a **Box Setting**. Note that the 30-day constant is no
  longer an example of ADR 0031's rule and the spec should not still cite it as one.
- **Commands.** `unpark` joins `catchup` as the second bare verb. `CONTEXT.md` is already amended; the
  spec's Command list is not.
- **The gap message.** The first Digest after an absence opens with the dates and the cut-off. Put it
  in the Digest section, not in Recovery, because it is a Digest behaviour.
- **Testing Decisions.** Cases this adds: a forward from a user landing on an open past day; the same
  forward arriving twice, asserting the second is dropped; a forward from a channel, asserting refusal;
  a JSON export covering a range that overlaps messages already held; a restored Capture whose day is
  closed, asserting it lands on today with its true Send Time and no entry is regenerated; a box waking
  after a 60-day gap, asserting no journal entries are written for those days and all of them stay
  open; a block reaching `shown:: 14`, asserting it parks and stops reaching the model; and `unpark`,
  asserting every parked block returns.
- **ADR cross-references.** ADR 0036 and ADR 0037 are new. ADR 0027, ADR 0030, ADR 0031 and ADR 0017
  gained amendments. Check every spec mention of "30 days" and of the journal's every-day rule, since
  both were quoted in more than one place.

## Answer

Done. `.scratch/memark-v1/spec.md` grew from 1,941 to about 2,795 lines, `CONTEXT.md` was touched in
two places, and four ADRs were amended. Nothing here decided anything: every judgement below came out of
tickets 18 to 22 or out of a contradiction the folding exposed.

**The classification section was rewritten outright, as this ticket asked.** It is now "What happens when
a message arrives", and it opens by saying what it replaced, because a reader who knew the old rule needs
to be told it is gone rather than left to notice. The order is numbered: strict Command check, raw Capture
appended whole, Intent Read, per-change checking by code, Pending Instruction appended, reply. No Card is
touched at receipt. Everything ticket 18 and ticket 21 settled hangs off that spine, including the three
guards, the act-or-ask test, the literal-date test, the refusal of a word that names no number, the Task
with no exact key, and the per-change / per-message split.

**Four new subsections**, each one a thing the spec had no home for: the Pending Instruction, Recall,
Recovery with the offline horizon, and Settings. The last one is worth naming because the spec had no
Settings section at all while ADR 0031 needed one and two tickets had added four settings to it.

**The Obsidian sweep found five occurrences and every one is now labelled.** This ticket said each is
either a gap with an owner or a stated, accepted limit, with no third option, and holding to that turned
out to be the useful part. Three are accepted limits and they share one reason: a Pinned Claim, pinning a
seeded line, and fixing a journal typo are all cases where giving Telegram a path would mean giving the
*agent* a path, which is what ADR 0005 refuses. Two are gaps with owners: Merge Proposals, which are
first out of the Out list, and Vault Settings other than the headings list. The Solution section now
states the rule at the top so the labels have something to point at.

**The Cost section was re-priced and its conclusions rewritten.** An Intent Read row at about $0.003 a
message, flat in every year; the monthly table at 5, 20 and 50 messages a day; and the third row showing
what keeping the Registry out of the packet bought. The old conclusion "the journal is the only flat row"
was the sentence most in need of replacing, because it had become an argument that flatness is hard right
as a second row achieved it. Totals move from ~$4.25/$4.85/$5.45 to ~$5.30/$5.90/$6.50 a month. Prompt
caching gets its third correction: it does not help the Intent Read, and for both reasons at once, the
4,096-token floor and the hour between messages.

**The Checkpoint now names its own spend and its own blind spots.** Under two dollars for the fortnight,
stated so that money cannot creep into a behavioural gate. And two failures it cannot see by construction:
ADR 0034's growth takes years, and parking counts fourteen Digests so it cannot fire before day fourteen.
Ticket 11's and ticket 17's readings survive unchanged, which is the answer to the check this ticket
asked for: nothing in the failure branch depended on cost being flat.

**The First Loop gained the rule that was missing**, stated in the words this ticket used: a part is only
in the First Loop if its whole loop closes. It is written as a fourth argument beside the three that were
already there, with Ambiguous Subjects as the worked case, because the rule is only convincing with the
example that produced it. The ask-path audit is a table, and it carries its own enforcement clause: a
seventh ask path may not be added without a seventh row.

**The scope paragraph stopped conceding.** This ticket asked for either the truth about the new size or an
admission that the build order is doing the work. It is the build order. The paragraph now says so
directly and stops apologising, and the test for where a new part lands is the closing-loop rule rather
than a feeling.

**Stories.** Fifteen new (108 to 122) in four groups, and seven amended in place: 6, 43, 44, 51, 52, 63
and 89. Stories 51 and 89 no longer say anything like what they said, and both amendments are withdrawals
rather than additions, which is what made this pass different from ticket 13's.

**The worked example carries a multi-intent message**, as this ticket asked: a Task closed in prose, a
Proposed Date corrected with a stated date and a fortnight of notice, a Question in the middle, and one
vague phrase refused and named back. It shows the reply's four states, the Pending Instruction on disk,
the code-only run that applies it with zero model calls, and then the filing call. A second scene shows
the gap message and the batch reply after an absence.

**Testing Decisions gained five blocks**, written as the existing cases are, through the seams that
already exist: talking through the message handler, Pending Instructions across the seam they cross, four
Recall cases plus the inert rule, Recovery and the offline horizon, parking, and closing a Task. The
journal's "a day with no Captures still gets an entry" case was inverted rather than added to, since it
now asserts the opposite.

**Out of Scope gained six entries** and Task decay was re-checked and stayed out, with the reason written
down rather than assumed: ADR 0034 is not a stopgap for decay, because they govern different things. The
per-day tag index is there with its four reasons and its stated cost.

**ADRs.** The resolutions had already written every amendment except four, and those four are now
written: ADR 0010 and ADR 0015 gained the reply their ask paths never had, ADR 0013 gained the second
limit and the fact that Recall counts against the first, and ADR 0022 gained the note that its thirty days
now stands alone and does not cover a box that was off. Every one of the 37 ADR numbers the spec cites
resolves to a file. ADR 0004, ADR 0009 and ADR 0002 were re-read against the new write path as ticket 21
asked, and all three come through unchanged, which is the whole reason ADR 0035 chose the shape it did.

**Corrections listed in this ticket, all six.** The tier-at-confirmation falsehood is fixed and the
section now says why it was false. ADR 0028's Date File omission is recorded in ADR 0033 and in the new
Recall subsection. Stories 6 and 63 name their real horizons and say which failure each covers. The
"one number, three places" symmetry is replaced by the weaker true statement, that scan reach must be at
least write reach, with a note that a future reader should not read the old symmetry as a rule. ADR 0012's
carve-out is widened by the literal-date test. The ask-path audit is a table.

**What a reader should check first if something looks wrong.** The journal pairing rule. It reads like a
tidy-up, it is the change most likely to be skimmed past, and it is what makes Recovery possible at all.
