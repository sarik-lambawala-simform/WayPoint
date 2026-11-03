# 10 — Turn this map's answers into two specs

**Type:** task

**Status:** resolved

**Blocked by:** none. All three blockers have landed. Ticket 09 wrote ADR 0043. Ticket 04 answered the
returning-errand link. Ticket 11 answered Recall, which was the last one: resolving 09 found that ADR
0033's Recall rested on machinery ADR 0043 deleted, and this ticket is the hand-off off the map, so a
decision left unanswered there would have been in no spec at all. This ticket is takeable.

11, because ADR 0033's Recall no longer describes anything that exists. It ranked a date range with
word matching ADR 0043 deleted and cut it at a number the deleted daily cap sized. A spec written now
would either guess Recall or leave it out, and leaving it out is how ticket 04's problem happens twice.

04, because this ticket is the hand-off and a hand-off happens when the map is finished. Ticket 04
either deletes `again-of::` or amends ADR 0034, a closed Task is hidden from the model and never
reopened. Either answer is spec work. Writing the specs while 04 is open would leave its decision in
no spec at all, and the person picking up `p10.7` would never see it.

Ticket 06 needs no entry here. It is reopened and it closes when 09 lands, so 09 covers it.

**Raised by:** the human, 2026-09-14, at the end of ticket 07's session.

## Question

This folder holds this map's answered decisions and no buildable work. Every answer names files and lines,
and none of them is a spec. One session reads them all and splits them into two phases.

It is one ticket and not two, because the split is the work. The two piles touch the same code: ticket
03's Part Drained rule changes the filing scan, and ticket 07's Vault read reads the same `from::`
links to find what nothing points at. One head holding both gets that seam right. Two sessions would
each guess at the other's half.

## The two phases

**`.scratch/memark-p10.7-a-capture-that-files-in-parts/`** takes tickets 01, 02, 03, 04, 05 and 08. Small,
known changes with named lines already in the answers: `memark/vault/apply.py:1906`, `memark/run.py:488`,
`_capitalised` removed, `people/me.md` added, `Loose Ends` narrowed, `CONTEXT.md` gains **Part Drained**
and **Me**, ADR 0010 gains a line, and whatever ticket 04 decides about `again-of::` and ADR 0034. It
is buildable today and must not wait behind a Lookup rewrite.

**`.scratch/memark-p10.8-the-model-reads-the-vault/`** takes ticket 07 alone. Word matching deleted from
the Lookup, the Vault assembled into the prompt, Captures pulled by link, the sources line rebuilt from
the lines the model names, the count returned with its list. It changes the shape of the box, so it
gets its own phase, its own build order and its own live pass.

The numbers are `.7` and `.8` rather than `.5` and `.6` because `CLAUDE.md` reserves `pNN.5` for a
phase's live-pass findings, and phase 10 will claim `p10.5` when its pass runs.

## How to write them

Per `docs/agents/issue-tracker.md`: `spec.md` in each folder, `issues/NN-<slug>.md` beside it numbered
from `01`, one file per ticket and never a combined file. There is no `to-spec` skill on this machine.
The ten existing specs under `.scratch/` are the template, and
`.scratch/memark-p10-intent-read/` is the closest in shape and recency.

Each spec ends with the same two issues every phase spec ends with, per the same doc: an AFK
`ready-for-agent` ticket adding the phase's scenarios and hard checks to `harness/live/`, then a HITL
`ready-for-human` ticket running the live pass.

## What the writer must not do

Do not re-argue any of the answers. They are decided and the reasoning is in each ticket. If a
spec cannot be written without reopening one, that is a new grilling ticket on this map, not a decision
to take in passing.

## Done when

Both folders exist with a `spec.md` and numbered issue files, every answered ticket on this map is
accounted for in exactly one of them, each spec ends with the two standing issues, and no issue in
either folder restates a decision instead of citing the ticket that holds it.

## Answer

**Both folders exist. Ten issues in the first, eleven in the second.** Nothing was re-argued and no
decision was taken in passing.

- [`.scratch/memark-p10.7-a-capture-that-files-in-parts/`](../../memark-p10.7-a-capture-that-files-in-parts/spec.md),
  ten issues. Tickets 02, 05, 03, 08 and 04.
- [`.scratch/memark-p10.8-the-model-reads-the-vault/`](../../memark-p10.8-the-model-reads-the-vault/spec.md),
  eleven issues. Tickets 07 and 11.

### Where every answered ticket went

| Ticket | Where |
| ------ | ----- |
| 01, which capitalised words are names | **Already built.** Neither folder holds an issue for it, and the p10.7 spec says so with the commits. |
| 02, may the reserved Card hold a claim | p10.7 issue 02 |
| 03, should a Capture be filable in parts | p10.7 issue 05 |
| 04, is the returning-errand link worth what it claims | p10.7 issues 07 and 08 |
| 05, a Card for the person themselves | p10.7 issues 01, 03 and 04 |
| 06, should the model read the Vault itself | **Closed by ticket 07.** Named in the p10.8 spec's table with why it has no issue. |
| 07, the question that counts the whole Vault | p10.8 issues 01 to 05 |
| 08, what stops a Part Drained Capture landing twice | p10.7 issue 06 |
| 09, the ADR that supersedes word matching | **Already done.** Named in the p10.8 spec's table. The docs it wrote are the authority p10.8 builds against. |
| 11, what Recall does when nothing ranks | p10.8 issues 06 to 09 |

### The one thing the split had to get right, and the one thing that changed under it

**The seam is Part Drained, and both phases touch it.** Ticket 03's rule is what creates a block
nothing has finished with, ticket 08 reads every `from::` link in the Vault to spot one, and ticket
07 rule 4 reads the same links inverted to find every Capture nothing points at. So p10.7 issue 06
builds the cited-blocks reader and p10.8 issue 03 reuses it rather than walking twice. That is why
p10.8 depends on p10.7 and not only on phase 9, and it is the reason this was one ticket.

**Ticket 01 turned out to be built.** Its code shipped as phase 9.5 ticket 02 in commit `e7e6b94`
and as phase 10 ticket 03 in `dee4c01`, while this map was still open. `_capitalised` is gone,
`NAMES_WENT_UNCHECKED` is at `memark/answering.py:234`, and `subjects` is an input to `look_up` with
a docstring that says the miss line is what it decides. That was checked in the code rather than
assumed from the commit subject. Writing an issue for it would have sent an agent to build something
twice.

**Tickets 02 and 05 are not built.** Their `decide(...)` commits touched `.scratch/` and nothing
else, which was also checked. Same for the documents: `CONTEXT.md` has no **Part Drained** entry and
no **Me** entry, ADR 0010 has no line for the drain rule, and ADR 0034 carries its amendment for ADR
0043 but not ticket 04's two. So all of that is issue work, and each issue carries it.

### What was left out on purpose

Every patch in **Not yet specified** stays there. The specs name the ones that touch them under
**Out of scope** with a line saying why, so a reader picking up either phase can see the edge of what
was decided rather than guessing at it. The map is unchanged on that section.

The one place this ticket came close to deciding something is the sources line for a Recall answer
with no Cards in it. It did not: ticket 11 part 5 already settled it and p10.8 issue 09 cites it.

### Done when, checked

- [x] Both folders exist with a `spec.md` and numbered issue files.
- [x] Every answered ticket is accounted for in exactly one place, per the table above.
- [x] Each spec ends with the two standing issues, the AFK one `ready-for-agent` and the HITL one
      `ready-for-human`.
- [x] No issue restates a decision instead of citing the ticket that holds it. Every issue opens with
      the ticket link and the words "Do not re-argue it".
- [x] Every relative link in both folders resolves.

The map is finished. Nothing on it is open.
