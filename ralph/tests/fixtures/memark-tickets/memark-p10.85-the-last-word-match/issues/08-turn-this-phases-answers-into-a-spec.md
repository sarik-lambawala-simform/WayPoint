# 08 — Turn this phase's answers into a spec

**Type:** task

**Status:** completed

**Blocked by:** 01, 02, 03, 04, 05, 06, 07

## Question

Every other ticket in this phase is either a defect with a fix written in it or a grilling ticket
with a decision written in it. None of them is a build. This ticket is the one that turns all of
them into a single spec somebody can implement from, so the work is planned once rather than seven
times.

Use the `to-spec` skill at
`~/.claude/plugins/cache/claude-plugins-official/mattpocock-skills/1.2.3/skills/engineering/to-spec`.

**Extend `spec.md`, do not overwrite it.** The file already holds this phase's findings: where the
phase came from, what the pass measured, the two findings, and what the phase must not do. Those
sections are the evidence the decisions rest on and they stay as written. What is missing is the
build: the list of work, in order, with the seams named. Add that and leave the rest.

This copies phase 9.6's ticket 10, which turned that map's answers into
[p10.7](../../memark-p10.7-a-capture-that-files-in-parts/spec.md) and
[p10.8](../../memark-p10.8-the-model-reads-the-vault/spec.md). The same two habits from that ticket
carry here and they are the reason it is one head rather than seven.

**Check the code before writing an issue for anything.** Ticket 10 of phase 9.6 found two of its
answers already shipped and two more it had assumed were built and were not, and it checked the code
rather than trusting a commit subject. Do the same. An issue for work already in `memark/` is worse
than no issue.

**Name the seams where two tickets touch the same code.** Tickets 01 and 02 both land on the miss
line and they must not be built twice: 01 changes which subjects reach it and 02 changes what it
means. Tickets 05 and 07 are both the harness. Say in the spec which issue owns which file.

There is a third seam and it is the load-bearing one. **Tickets 01 and 03 both rest on the subject
list the Intent Read returns.** Ticket 01 changes which words get onto that list. Ticket 03 makes
that list decide whether every Card is read at all. So ticket 01 is no longer a defect about one
false line: it moves the price of an answer. Build 01 first and state in 03's issue that it depends
on it, or the two are argued twice against different assumptions about the same list.

## What the spec has to carry

- Whether this phase is one spec or more than one. Phase 9.6 split because its answers fell into two
  builds with a real dependency between them. Decide the same way, on the code, not on the count.
- ADR 0043's amendment from ticket 02. Its paragraph "The miss line keeps its check and loses its
  index" is wrong and the amendment is code's authority, so it is written before the code and not
  after.
- Ticket 03's answer, which is the largest piece of work here and the one most likely to want a phase
  of its own rather than an issue. Its own section is below, because it is the one answer in this
  folder that changes the shape of the answering path rather than one line on it.
- The two issues every phase spec ends with, per `docs/agents/issue-tracker.md`: the AFK one that
  adds this phase's scenarios and hard checks to `harness/live/`, and the HITL one that runs the
  live pass. They are added even if the list is complete without them.
- An out-of-scope section naming what stayed watched rather than filed, so the next reader sees the
  edge of what was decided. The two entries under "Watched, not filed" in `00-index.md` belong
  there, plus ticket 02's gap where a subject the model skipped has its word written in the Vault.

## Ticket 03 in particular

[Ticket 03](03-a-question-that-names-a-festival-never-reaches-the-cards.md) holds the whole argument
and the numbers. This is what the spec has to take from it, and what it must not re-open.

**The rule is one line: the Cards go in the prompt unless the message names a time and nobody.** Code
still reads the window exactly as it does today. What changes is that the window stops deciding
whether a Card is ever opened. Three branches, and the third is not an afterthought: a subject and a
window sends both, a window and no subject sends today's Recall material alone, and `subjects is None`
sends the Cards, because a reading that failed altogether must fail toward reading more.

**Do not re-argue the routing.** Five shapes were put up and four were rejected with reasons written
in the ticket: answer the question only when the occasion has no record, answer it whenever there is
one, change the prompt so a festival word beside a question is not an occasion, merge the two prompts
on every question, and let the model choose the days as well. Each rejection rests on a number or on
another ADR, not on taste. The last one matters most: a model choosing its own days has nothing to
place Diwali with except its own memory of when Diwali falls, which is exactly what
[ticket 04](04-a-festival-date-is-never-the-models-to-know.md) is filed against and what ADR 0012, a
date the agent found is confirmed by the human, refuses. **Ticket 04 stays fixable only while the
window belongs to code.** Say that in the spec so a later reader does not simplify it away.

**The code it touches.** `_window_for` and `_occasion_window` at `memark/handler.py:903` stop deciding
the answer's fate; `_written` gains the branch that puts Cards and window material in one prompt;
`no_occasion` at `memark/answering.py:913` and `_not_on_record` at `memark/handler.py:976` become
unreachable and go, and the `TheWindow | str | None` return narrows with them. `could_not_use_the_window`
stays, because a pair of days code cannot parse is a different failure per ADR 0032, exact match or
nothing.

**No prompt issue for `L134` and `L188`.** The session agreed to split them out and then unsplit them,
because the routing change fixes both rows without touching the prompt. A wrong occasion name now
costs nothing: there is no free refusal for it to trigger and no window for it to narrow an answer to.
One case is watched rather than filed, which is a wrong occasion name that happens to match a day the
Vault did confirm, and it needs a real row before anybody writes a rule for it. That belongs in the
out-of-scope section beside the other watched entries.

**The documents are the authority and go before the code**, the same way ticket 02's ADR 0043
amendment does. ADR 0033, a day is recalled from its Captures, is **amended and not superseded**:
Recall stays a second function beside the Lookup and what changes is that a window no longer hides the
Cards. ADR 0043, the model reads the whole Vault, gains the case its four rules never covered. Then
`CONTEXT.md` line 395, which still says Recall's prompt holds no Cards, and `docs/stack/dates.md` and
`docs/stack/search.md` for the routing path.

**The risk the spec has to schedule, not inherit.** The rule leans on the cheap tier naming subjects,
and nothing has measured that. It is already written as **What the cheap tier actually does with
subjects** in the [p09.6 map's](../../memark-p09.6-decisions-only-you-can-make/map.md) fog, and ticket
03 adds a third thing to that same measurement. The bound is that this phase's ticket 01 shows the
cheap tier naming too many subjects rather than too few, and an extra subject only sends the Cards,
which costs money and never a wrong answer. Put the measurement in the spec as work, not as a note.

**Two live rows the bundle does not have yet**, for the AFK harness issue. One is a subject plus an
occasion that **is** on record, in the shape `holi pe ramaben ko kitna diya tha`, which is the hole the
session found and which no row in `harness/live/scenarios_p10_8_india.py` exercises: `L194` asks about
Holi and names nobody. The other is the regression guard in the other direction, a question naming a
time and nobody, which must still send no Cards. Per `.claude/skills/live-pass/SKILL.md` the earlier
phases' scenarios are the regression coverage and are never edited to make a later phase pass, so both
are new rows.

**The bill is a hard check, not a comment.** `harness/live/bill.py` already prices a question off the
pass's own call log. Ticket 03's whole cost argument is that the cheap path stays cheap: about 375
tokens for a day, 2,600 for a week and 11,000 for a month, against the roughly 150,000 tokens a Card
read costs. A spec that ships this without the bill proving the "time and nobody" path unchanged has
shipped the argument untested.

## Why it is blocked

A spec written before a grilling ticket is answered would carry a guess where a decision belongs.
Tickets 02, 03 and 06 each need a person in the room, so none of them can be hurried by this one.

## Answer

One spec, not two. The three open answers are one build: ticket 03 changes which material reaches the
answering call, and tickets 02 and 06 each add one field to that same call's schema and one line to
the same reply. Splitting would mean editing one schema twice.

The code was checked rather than the commit subjects. Tickets 01, 04, 05 and 07 are shipped in
`memark/` and `harness/`, so no issue is written for any of them. The dependency this ticket named is
already discharged: ticket 01 moved which words reach the subject list and it is built, so ticket
03's rule has the list it rests on.

`spec.md` is extended and not overwritten. It gains what is already built, the one spec argument,
what gets built, the build order with the three seams named, the documents, the testing decisions,
the out of scope section and an exit gate.

Nine issues, `09` to `17` in this same folder, because `01` to `08` are the pass's findings and this
spec extends the same phase:

| # | Issue | Owns |
| - | ----- | ---- |
| 09 | [The routing rule is written down](09-the-routing-rule-is-written-down.md) | ADR 0033, ADR 0043, `CONTEXT.md`, `docs/stack/` |
| 10 | [The Cards go in unless the message names a time and nobody](10-the-cards-go-in-unless-the-message-names-a-time-and-nobody.md) | `memark/handler.py` |
| 11 | [The miss line's promise is amended](11-the-miss-lines-promise-is-amended.md) | ADR 0043's miss line paragraph |
| 12 | [The answering call says what it covered](12-the-answering-call-says-what-it-covered.md) | `memark/answering.py`, the schema |
| 13 | [The sources line's rule carries a count](13-the-sources-lines-rule-carries-a-count.md) | ADR 0043's sources line paragraph |
| 14 | [A count cites the whole Vault](14-a-count-cites-the-whole-vault.md) | `memark/answering.py`, the same schema |
| 15 | [What the cheap tier does with subjects](15-what-the-cheap-tier-does-with-subjects.md) | `harness/live/repeat.py` |
| 16 | [AFK: this phase's rows reach the bundle](16-afk-this-phases-rows-reach-the-bundle.md) | `harness/live/` |
| 17 | [HITL: run the live pass](17-hitl-run-the-live-pass-and-file-what-it-finds.md) | the pass |

The documents go before the code they govern: 09 before 10, 11 before 12, 13 before 14.
