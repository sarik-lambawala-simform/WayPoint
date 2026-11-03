# Phase 10.9 issues

Fifteen defects and three questions, from the live-model pass at the end of phase 10.85. Two of the
defects were filed after the pass rather than during it: ticket 18 came out of ticket 06's answer and
ticket 19 out of ticket 07's.

Where they sit. Ticket 11 is arithmetic in `vault/apply.py` and holds whatever any model answers.
Tickets 02, 03 and 08 are the filing prompt. Tickets 12 and 13 are the Intent Read's. Tickets 05,
15 and 07 are what code writes around an answer, or what decides which code writes it. Tickets 09,
11 and 14 are the harness, filed here because this is where they were found. Tickets 16 and 17 were
filed as paths nobody had read. Both have been read since, and each now names the line its defect is
on rather than the file to start in.

The pass ran in `claude-cli` mode and it is the first one measured on the tiers ADR 0003 names for
the box: `claude-haiku-4-5` for filing and `claude-sonnet-5` for judgement. Every rate below was
measured with `python -m harness.live.repeat`, which forces the tier onto that model. **Every defect
on this board carries a rate except ticket 18**, which needs the Recall route and could not be
measured until ticket 06's answer made that route the common one.

| # | Ticket | Type | Status | Reproduces |
| - | ------ | ---- | ------ | ---------- |
| 01 | [Three checks cannot see a citation whose block id is not hex](01-three-checks-cannot-see-a-citation-whose-block-id-is-not-hex.md) | defect | completed | every run, and not a model defect |
| 02 | [A festival date is worked out on the filing path too](02-a-festival-date-is-worked-out-on-the-filing-path-too.md) | defect | completed | 5 of 5 on `claude-haiku-4-5`, 0 of 1 on `claude-opus-5` |
| 03 | [A day the message names does not survive filing](03-a-day-the-message-names-does-not-survive-filing.md) | defect | completed | 5 of 5 on `claude-haiku-4-5`, 1 of 1 on `claude-opus-5` |
| 04 | [A fact is dropped and its Capture drains anyway](04-a-fact-is-dropped-and-its-capture-drains-anyway.md) | grilling | resolved | 3 of 5 and 3 of 5 |
| 05 | [A question about the days ahead does not route the same way twice](05-a-question-about-the-days-ahead-does-not-route-the-same-way-twice.md) | defect | completed | was 1 of 7 one way and 6 of 7 the other; now 5 of 5 to Recall |
| 06 | [Should a question about the days ahead reach Recall?](06-should-a-question-about-the-days-ahead-reach-recall.md) | grilling | completed | not a rate |
| 07 | [What may an answer volunteer beside a miss line?](07-what-may-an-answer-volunteer-beside-a-miss-line.md) | grilling | completed | 4 of 5 on `claude-sonnet-5`, 1 of 1 on `claude-opus-5` |
| 08 | [A new name is lost when the claim reads as a disagreement](08-a-new-name-is-lost-when-the-claim-reads-as-a-disagreement.md) | defect | completed | 5 of 5 on `claude-haiku-4-5`, 0 of 1 on `claude-opus-5` |
| 09 | [The CLI timeout is too tight for a long message](09-the-cli-timeout-is-too-tight-for-a-long-message.md) | defect | completed | once in 48 rows, and not a model defect |
| 11 | [A Capture nobody proposed anything for is never drained](11-a-capture-nobody-proposed-anything-for-is-never-drained.md) | defect | completed | every run, and not a model defect |
| 12 | [A bare day number resolves into the future](12-a-bare-day-number-resolves-into-the-future.md) | defect | completed | 3 of the 4 windows the regression resolved |
| 13 | [`Me` is read as a subject and the cheap path stops being cheap](13-me-is-read-as-a-subject-and-the-cheap-path-stops-being-cheap.md) | defect | completed | 3 of 5 on `claude-haiku-4-5`, 1 of 1 on `claude-opus-5` |
| 14 | [Eight earlier rows assert rules phase 10.85 replaced](14-eight-earlier-rows-assert-rules-phase-10-85-replaced.md) | defect | completed | every run, and not a model defect |
| 15 | [An answer uses the notes and names no line](15-an-answer-uses-the-notes-and-names-no-line.md) | defect | completed | `L61` 3 of 5 on `claude-sonnet-5`. `L63` and `L81` 0 of 5 under the decided rule. `L71` not measured |
| 16 | [Half a Command batch landed and the reply said both things](16-half-a-command-batch-landed-and-the-reply-said-both-things.md) | defect | completed | 5 of 5 on `claude-haiku-4-5`, and not a model defect |
| 17 | [`undo` leaves no Capture of its own](17-undo-leaves-no-capture-of-its-own.md) | defect | completed | 5 of 5 on `claude-haiku-4-5`, and not a model defect |
| 18 | [A recalled answer contradicts its own window](18-a-recalled-answer-contradicts-its-own-window.md) | defect | completed | **no rate.** One run here, one in phase 10.8 |
| 19 | [The model switches the miss line off by claiming coverage](19-the-model-switches-the-miss-line-off-by-claiming-coverage.md) | defect | completed | 1 of 16 on `claude-sonnet-5` |
| 10 | [Turn this phase's answers into a spec](10-turn-this-phases-answers-into-a-spec.md) | task | completed | not a rate |

Where a comparison run on `claude-opus-5` is in a ticket, it is a diagnostic and never a fix. Both
tiers failing means the prompt is wrong. Only the cheap tier failing means the prompt is too thin to
carry it. Per ADR 0003 the cheap tier is what filing runs on either way.

Ticket 01 was found by the regression rather than by anything written for this pass, which is the
argument for running all 198 earlier rows rather than only the new ones. Three of them went red on a
check that was wrong about a line the box had filed correctly.

Ticket 05 changed shape while it was being measured and the ticket says so. It was written as an
answer contradicting its own footnote, which did not reproduce. What reproduced is the route: the
same question reached Recall once and the Cards six times. The finding it started as is watched
below.

Tickets 09 and 11 are not model defects at all. One is a set built from the wrong side in
`_drained` and one is the harness's own call timeout. Both were found by using the box rather than
by reading it, which is the same way phase 10.85 found its tickets 05 and 07.

Tickets 04, 06 and 07 are grilling tickets because each asks a decision the pass cannot make. An
agent must not answer its own side of one. Ticket 04 is the one to read twice: the defect in it is
measured and certain, and only the fix is open, so it is a grilling ticket about how to catch
something rather than about whether it happens.

**All three grilling tickets are answered and each answer is in its own file.** Ticket 06 sends a
question about days to Recall and widens Recall to deserve it. Ticket 07 lets a reply that admits a
gap add only material answering the question that was asked, about a different subject, and never
requires it to add anything. Ticket 07 also split its fifth run out as ticket 19, because a run with
no miss line at all is a different rule from a run that volunteered too much.

**Ticket 04 is answered and the answer is in its own file.** A Capture now drains on coverage rather
than on writes alone, and both of the two fixes the ticket named were refused. The three grilling
tickets have a map of their own at `map.md`, and the answer is gisted there.

**The last four rates are in: tickets 15, 16, 17 and 19.** They were measured on a clean tree, in
that order, after the partial work to `apply.py`, `distillation.py` and `checks.py` had been taken
back out. Two of the four reproduce every run and are code rather than a model. One reproduces on
three rows at three different rates. One reproduces once in sixteen.

**Two of the four had their cause wrong, and both were found by reading the code rather than the
tally.** Ticket 16 blamed `commands.py`, whose all-or-nothing rule is correct; the batch lands on the
Intent Read's path, which has no such rule. Ticket 19 blamed the model claiming coverage; `covered`
was empty on the run that failed, and the miss line is gated on the reading's subject list before
either of ADR 0043's two conditions is reached.

**Ticket 17's title is wrong and the defect under it is worse than the title.** `undo` does open a
Capture. What it never gets is that Capture's `ack::`, because `undo` deletes lines from the same
inbox file between the block being written and the acknowledgement being written to it, and the
acknowledgement is located by a line number that has since moved. The write raises, `handler.py:598`
catches it, logs it, and the run is green. It is the one of the four an agent can take.

**The probe for ticket 17 was wrong twice before it was right, and both versions are written into
its docstring.** One scored 0 of 5 and looked like a killed finding. The next scored 5 of 5 while
printing the block it claimed was missing. The third asks whether that block carries `ack::`. This
is the second worked example in this phase of reading the detail rather than the tally, after ticket
18's probe counting Card headings as window material.

**Ticket 15's probe over-counts and its ticket says so.** `named_no_line_at_all` scores any empty
`lines` as the defect, and an answer that genuinely found nothing is supposed to have one. One of
`L81`'s two failures is a correct answer. The probe is sharpened before the fix, or a fix will be
graded into citing something on every answer, which is what that ticket's own fourth criterion
forbids.

**All ten are done: 01, 02, 03, 05, 08, 09, 11, 12, 13 and 14.** Tickets 04, 06 and 07 are decisions
and all three are answered. Ticket 10 is the spec.

**Four tickets an agent can take: 15, 16, 17 and 19.** Every one says what must be true at the
end and none waits on a decision.

**The three decisions 15, 16 and 19 were waiting on are answered, and each answer is in its own
ticket under `## The rule, decided`.** All three went the conservative way.

- **Ticket 15.** An answer cites a line when it states what that line says. A survey of what the
  Vault covers cites nothing. This narrows the defect to `L61` and stops ticket 15 pulling against
  ticket 07, which is about a footnote already vouching for too much.
- **Ticket 16.** ADR 0041's all-or-nothing rule does not reach the Intent Read's change list. Each
  change keeps standing or falling on its own, because that list also carries ordinary facts and an
  atomic one would drop a birthday because a digest item number was wrong. Only the reply is fixed.
- **Ticket 19.** Code gets no fallback subject. The `_capitalised` rule already tried getting
  subjects out of raw words and produced miss lines claiming `ABT` was a name. The reading is made
  reliable instead, and `L242` gains a hard check so the failure stops being invisible.

**Ticket 16 replaces a hard check, and that is the one thing on this board to read twice.** `L21`'s
`nothing_was_promised` asserts phase 5's all-or-nothing rule on a message that takes the ordinary
path, where the decision says per change is correct. This is ticket 14's shape, where eight rows
asserted rules a phase had replaced, and the rule from that ticket is that a row asserts the rule the
box has. It is allowed here **only because the decision was written down first**, in ticket 16, and
the row's own module has to cite it.

**Ticket 05 is done and its rate is 5 of 5.** The Intent Read prompt now says that a window naming
only days ahead of today is a window like any other, so `?next week kya kya hai` reached Recall on
every one of five runs where it used to reach the Cards on six of seven. The wider routing change
ticket 06 decided is not in it and did not need to be: `L239` names nobody, and a message naming
days **and** a person only reaches Recall safely once that person's Card rides along, which is
Recall's own work. Ticket 10 plans both halves together.

**Taking that rate found a second defect in the instrument, and it is fixed.** `L239:route` reported
a run with no answering call as `NO_READING_DETAIL`, which says the reading failed. A reading that
fails leaves `subjects is None`, routes to the Cards and still answers, so no answering call at all
is a different event and that sentence was a guess. `ModelCall.failed` holds the real reason and the
probe was dropping it. It prints it now. Three such runs in the first measurement were a
`claude-cli` timeout, per ticket 09, taken while the unit suite ran on the same laptop. This is
`L239`'s second probe to be wrong in a way the tally could not show.

Ticket 18 still says `Blocked by: 06`. That line is not the same kind of block. Ticket 06's answer
is what makes ticket 18 measurable, and the fix shape in 18 is still open, so it waits for a person
rather than for a status.

**Ticket 01 was built first of those nine, and it is done.** It is the harness's own eyes. Three
checks in `COMMON` had been blind to part of the Vault for three phases, and every rate this phase
asks to be measured again is read through them. Ticket 11 says `Blocked by: 01` because the drain
arithmetic must be measured through checks that can see, and that block is now clear.

Ticket 10 is last and is blocked by every other ticket. Nothing here is a build on its own.

**The board is closed and the spec is written.** Every ticket is `completed`. The build half of
`spec.md` carries what is left, as three strands that share no file: ticket 04's coverage drain,
ticket 06's forward Recall, and ticket 07's rule for what a reply may add after it admits a gap.
Fifteen of the eighteen tickets shipped while ticket 10 waited, so the spec opens with a table of
what is built and what is not, read off the tree. Two things came out of that reading. `fix(06)`
wrote ticket 05's sentence and none of ticket 06's own decision, and phase 10.85 had already
answered ticket 06's routing question the expensive way. That second one went back to the person
and it is answered: one Card plus the window, so ADR 0043 is amended on the person arm rather than
ignored. Nothing in the spec is open.

## What the regression found, and why it is half this phase

The 48 new rows found six things. **The 198 earlier rows found seven more, and two of those are the
most valuable findings of the pass.** Nothing written for this phase could have found either.

`L200` is the one to read first. **Phase 10.85 wrote it three tickets ago as the guard for its own
cost argument**, and it fired on the first real run after that phase shipped: one word read as a
subject sent all 34 Cards down the path the phase costed at a day's tokens. The row's module says
what it was afraid of, and the thing it was afraid of happened. Ticket 13.

`L84` and `L87` resolved `the 20th` and `the 10th to the 15th` into September, on a Vault whose
today is 27 August. `L69` asked the same sentence and got August. Ticket 12.

Eight more were rows asserting rules phase 10.85 itself replaced, green in the free dry run and red
the moment a model answered. Ticket 14, and it is a statement about the method rather than about the
box: a phase changed two rules, ran forty rows, and shipped. The eight that contradict it sat
unnoticed because the assertions that would have caught them go silent when no model call is made.

**The whole bundle is 246 rows: 227 pass and 19 fail.** Eight of the nineteen are ticket 14's stale
rows and three are ticket 01's blind regex, so eight are the box.

## The bundle

`harness/live/scenarios_p10_85_india_wide.py`, rows `L201` to `L248`, against
`tests/fixtures/an-indian-life` laid over `tests/fixtures/an-indian-household`. The same family in
Bopal the last two passes used, and not one new fixture, because a wide pass on a Vault of its own
would measure the fixture rather than the box.

The rows are a day rather than a phase. Twenty three of what gets typed in, nineteen of what gets
asked, and six that are more than one message. Nothing in them was written for a rule phase 10.85
changed, which is the point: all three of that phase's rules are in `COMMON`, so every one of the 48
rows is held to them and they were exercised 48 times each without breaking.

`harness/live/repeat.py` gains six probes, listed under the wide pass in `PROBES`.

## What worked, so a fix that breaks it is caught

The full list is in `spec.md`. The five worth naming here:

**The allergy stayed where it belongs.** `L226` asked whether a six year old has her mother's peanut
allergy and the box said the notes hold nothing about the child and that the line is her mother's.

**Three wrong premises were refused.** A flight for a father who will not fly, a tax claim before
possession, and a surgery two doctors disagree about.

**Four scripts and three spellings.** Devanagari, Gujarati script, a sentence that switches halfway,
capitals only, no punctuation, no vowels, and transliterated Gujarati all reached the right Card or
filed the right line. The one exception is ticket 03.

**Numbers and places.** Lakhs, a percentage and an EMI filed as one line. A flat number, a building,
a landmark and a pin code filed as one Note rather than six.

**An empty answer stayed empty.** `L232` answered out of a parked Capture and ended `From: no line
of your notes I can name.`, which is phase 10.85's ticket 14 doing its job.

## Watched, not filed

Neither is a ticket. Both are worth a second look next pass.

**The miss line reads a name back in the letters it was typed in.** `L230` asked `?dinesh ne chaabi
ke baare me kya bola tha` and the reply opened `I have nothing on dinesh.` That is honest and it
reads slightly wrong, and whether code should capitalise a name it hands back is a question nobody
has been asked. This pass's own row asserted `Dinesh`, went red, and the assertion was corrected
rather than the box.

**The same question sent twice costs two answers.** `L248` sent one question twice, a few seconds
apart, which is what happens whenever a reply is slow. Two judgement calls were made and two
near-identical answers came back. Nothing is wrong and it is two bills for one question. Whether a
Capture repeating the words of one still being answered should wait is a decision, not a defect.

**A recalled answer can contradict its own window.** Filed as ticket 18. When `L239` did reach
Recall, the reply said the notes show nothing at all under a footnote saying three notes and four
dated lines were read. Phase 10.8 saw the same shape on `L195` and watched it. This pass could not
measure it: the finding needs the Recall route, the route came up once in seven runs, and in five
runs on that row it never came up again. Ticket 06 is what changed that. Its answer sends every
message naming days to Recall, so the route is now the common one and the rate is measurable.

This is the clearest thing the pass has to say about its own method. The first probe written for it
scored 0 of 5 and looked like a killed finding. It was actually counting the `## Notes` heading on
Card bodies as if it were a window's material, and reporting 39 notes where the window held 7. The
probe was rewritten to read only a call that carried no Card, and the rate that came back said
something different and true. Read the detail, not the tally, applies to the repeat step as much as
to the pass.

**Phase 10.8's own watched items.** The volunteering one is now ticket 07. The contradiction one is
now ticket 18. The third, a subject the model skipped whose word the Vault holds, produced no
row in 48 and stays watched with nothing new behind it.

## The build board: tickets 20 to 31

Tickets 01 to 19 are the pass and its answers, and every one is closed. Ticket 10 turned those
answers into the `## The build` half of [`spec.md`](../spec.md). These twelve are that half, broken
out.

**Three strands that share no file.** They can be built in any order and by different sessions.
Inside a strand the order is fixed.

| # | Ticket | Strand | Blocked by |
| - | ------ | ------ | ---------- |
| 20 | [ADR: a Capture is drained by coverage](20-adr-a-capture-is-drained-by-coverage.md) | A | none |
| 21 | [A Capture drains only when every claim piece is covered](21-a-capture-drains-only-when-every-claim-piece-is-covered.md) | A | 20 |
| 22 | [The acknowledgement carries one mark per piece](22-the-acknowledgement-carries-one-mark-per-piece.md) | A | 21 |
| 23 | [The Digest ask leads with the crossed words](23-the-digest-ask-leads-with-the-crossed-words.md) | A | 22 |
| 24 | [ADR: Recall reads forward](24-adr-recall-reads-forward.md) | B | none |
| 25 | [Recall returns the window's Tasks and its forward standings](25-recall-returns-the-windows-tasks-and-its-forward-standings.md) | B | 24 |
| 26 | [An empty forward window is not widened](26-an-empty-forward-window-is-not-widened.md) | B | 24 |
| 27 | [A message naming days and a person reaches one Card plus the window](27-a-message-naming-days-and-a-person-reaches-one-card-plus-the-window.md) | B | 24 |
| 28 | [ADR: what a reply may carry after it admits a gap](28-adr-what-a-reply-may-carry-after-it-admits-a-gap.md) | C | none |
| 29 | [The answering prompt says what a reply may add](29-the-answering-prompt-says-what-a-reply-may-add.md) | C | 28 |
| 30 | [AFK: this phase's rows and hard checks reach the bundle](30-afk-this-phases-rows-and-hard-checks-reach-the-bundle.md) | all | 21, 22, 23, 25, 26, 27, 29 |
| 31 | [HITL: run the live pass and file what it finds](31-hitl-run-the-live-pass-and-file-what-it-finds.md) | all | 30 |

**Strand A** is the filing path: `distillation.py`, `vault/apply.py`, `acknowledge.py`, `digest.py`.
A Capture drains on coverage rather than on writes alone. Ticket 21 is the fix, 22 is how a person
sees it, 23 is the evening ask. Ordered so the fix does not wait on how a person sees it.

**Strand B** is the question path's routing and window: `recall.py`, `handler.py`. Recall reads
forward. Tickets 25, 26 and 27 touch different rules and different call sites, so all three hang off
the ADR and none blocks another.

**Strand C** is one prompt in `answering.py`. It has no unit seam at all, by the decision in ticket
28, and is graded by two hard checks in ticket 30.

**Each strand opens with its ADR, and that is deliberate.** Every one of the three covers more than
one code ticket, so folding it into the first code ticket would leave the later ones citing a
document that does not exist yet. An ADR written after the code records what somebody built. Written
before it, it is the reason they built it. Phase 10.85's ticket 09 is the prior art.

**Ticket 18 is not on this board.** It waits for a rate, the rate waits for ticket 27, and ticket 31
is where it gets taken.

**The guard to read twice is in ticket 30.** `L226` must still cite the Khushbu peanut line. It is
the check that stops a later session fixing the badminton reply by banning volunteering outright,
which is the refusal ticket 07 already made once.
