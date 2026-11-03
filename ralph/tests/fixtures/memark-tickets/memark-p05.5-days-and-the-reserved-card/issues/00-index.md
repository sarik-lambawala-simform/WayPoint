# Phase 5.5 issues

Three defects in what the filing call is told, and two questions about what the design intends.
Tickets 01 to 03 come from the phase 5 live-model pass, with filing on `claude-haiku-4-5` and
judgement on `claude-sonnet-5`, through the local Claude Code CLI. See [../spec.md](../spec.md) for
what the evidence is worth and what it is not. Tickets 04 and 05 and one section of 02 came later,
from hand probes rather than from the pass, and each says so where it is written.

| # | Ticket | Status | Blocked by | Reproduces on Haiku |
| - | ------ | ------ | ---------- | ------------------- |
| 01 | [A weekday is resolved by a rule that only reads numbers](01-a-weekday-is-resolved-by-a-rule-that-only-reads-numbers.md) | done | none | was 7 of 15 words dated wrong, now 0 of 15 |
| 02 | [May the reserved Card hold a claim?](../../memark-p09.6-decisions-only-you-can-make/issues/02-may-the-reserved-card-hold-a-claim.md) | moved to phase 9.6, ticket 02 | none | code behaviour, always. Aimed there 6 of 10 |
| 03 | [Is the returning-errand link worth what it claims?](../../memark-p09.6-decisions-only-you-can-make/issues/04-is-the-returning-errand-link-worth-what-it-claims.md) | moved to phase 9.6, ticket 04 | none | 15 of 15, and 3 of 3 on Opus |
| 04 | [One edit may carry a Task and a day, and code refuses the pair](04-one-edit-may-carry-a-task-and-a-day.md) | done | none | was 1 of 4 filing nothing, now 0 of 5 |
| 05 | [A Task about somebody new files nothing, and the prompt sends it there](05-a-task-about-somebody-new-files-nothing.md) | needs-triage | [phase 9.6 ticket 02](../../memark-p09.6-decisions-only-you-can-make/issues/02-may-the-reserved-card-hold-a-claim.md) | structural, always. No rate measured |

## Nothing blocks anything, and the shared string is now free

01 and 04 both edited `INSTRUCTIONS` in `distillation.py` and both have landed, so the ordering
this section used to carry is spent. They were about different sentences of the same prompt. 01 is
about the day words and how a weekday resolves. 04 is about whether one edit may be a Task and a
day at once, and its fix sits directly below 01's four day bullets.

05 is the third ticket about that prompt. It has no fix yet and it is a decision rather than a
patch, so read it before touching `INSTRUCTIONS` again. The decision it waits on is
[phase 9.6 ticket 02](../../memark-p09.6-decisions-only-you-can-make/issues/02-may-the-reserved-card-hold-a-claim.md).

02 carries one section that did not come from the pass. A hand probe on 2026-09-07 reached the same
route from a first-person claim, and the section says so and says what its counts are worth.

02 and 03 were both grilling tickets and both touch `areas/loose-ends.md`, which is the one Card
they have in common and the only reason to read them together. They ask different questions. 02 asks
what may live in that Card. 03 asks whether a field written into it is worth keeping. Neither answer
constrains the other.

**Both have moved.** They are now tickets 02 and 04 of
[phase 9.6](../../memark-p09.6-decisions-only-you-can-make/issues/00-index.md), gathered with the two other open grilling tickets so
one sitting can answer them all. The rows above link straight through.

## Two of the five tickets were grilling tickets, and both have moved

01 and 04 were implementation work and ran under `run-ralph-tickets.sh`. 05 is `needs-triage`: it
carries three answers and one of them changes code, so it needs a decision before it is claimed.

02 and 03 are wayfinder grilling tickets and are now tickets 02 and 04 of
[phase 9.6](../../memark-p09.6-decisions-only-you-can-make/issues/00-index.md), worked through
[that effort's map](../../memark-p09.6-decisions-only-you-can-make/map.md). Each carries a `**Type:** grilling` line and a
`## Question` body and holds no `- [ ]` criteria, because there is nothing to implement until the
question is settled. Neither carries a `**Status:**` line, so `run-ralph-tickets.sh` skips both.

Grilling is human in the loop. Both questions are about what the design intends rather than about
whether code matches it, and in both cases code matches the design already. An agent must not answer
either side of one.

## Why 01, 04 and 05 are filed on a gap and not on a rate

The pass's rule is that nothing below five of five on the filing model gets filed. It is kept.

01's claim is the structural gap, and it holds on every call. The prompt names `friday` and
`tomorrow` as day words, gives a resolution rule that only reads a number, and renders each Capture
with an ISO date and no weekday. No model is needed to see it. The measured 7 of 15 is quoted as
what that gap costs and not as the evidence it exists. Phase 4.6 ticket 02 was filed the same way.

The same reading applies to 02, whose basis is a code path that behaves identically on every call,
and to 04, whose basis is a rule code enforces and the prompt never states. 04's measured 1 of 4 is
quoted as what that gap costs and not as the evidence it exists.

05 is the same shape as 04 and carries no rate at all. Its refusal fires on every call and a stub
model reproduces it, so a rate would only measure how often a model happens to name somebody the
Registry does not carry.

03 needs no such argument. It reproduced 15 of 15.

## What the live pass confirmed works

Recorded so that a fix breaking one of these is caught as a regression rather than discovered later.

**Phase 5, all of it.** Nothing in this phase's own code came out of the pass.

- `done 2` closed the Task and wrote `done:: 2026-08-27`, with no model call in the loop at all.
- `skip 2` stamped `handled:: 2026-09-01` on the occurrence and restarted no clock.
- `yes 2` on a Proposed Date took the `?` off and wrote the defaults. `yes 2` on a Proposed Heading
  put `Health` into the Settings file the filing prompt reads.
- `no 3` against a Capture nobody filed wrote `filed:: declined` and no Card line, so nothing
  claimed a Card had been written.
- `done 2\ndone 3`, where only one line resolves, landed neither and took the ordinary path. The
  all-or-nothing rule held.
- The arity rule refused `undo 3 of the last 4 changes in illustrator today` and `catchup 3 times
  with Mihir this week atleast`. The verb check refused `Skipped 2 people in line today`. All three
  fell through to filing with no Pending Instruction written.
- `done 1` sent as a reply to Tuesday's Digest on Thursday resolved against Tuesday's list, not the
  newest one, and wrote `target:: [[areas/loose-ends#^b91d]]`.
- A number typed off a Digest a real judgement model had just worded resolved against the footer
  code wrote, and the run applied it.
- The Health Canary's count of outstanding Pending Instructions agreed with disk, and zero read as a
  count rather than as a silence.

**Phases 1 to 4, still working.** These are the phase 4.6 fixes holding.

- A bare `she` reaching two Registry rows came back as `contradict` with `subject` as `she`. The
  model asked instead of guessing, which is phase 4.6 ticket 01.
- `Loose Ends` is now shown to the filing call, which is phase 4.6 ticket 02.
- A finished project came back `status=dormant`, which is phase 4.6 ticket 03.
- `the 4th` in `cant remember if i told priya abt the deck deadline movin to the 4th` resolved to
  `2026-09-04`, on a message with typos and no punctuation, which is phase 4.6 ticket 04. Note that
  the ordinal rule works. Ticket 01 here is about the weekday words in the same sentence of the
  prompt, not about this.

**And the rest.**

- Aliases resolve: `her` reached `Wife` and `priya` reached `Priya (colleague)`.
- Somebody new got a Card and a Registry note: `Sam`, `met at school gate, does kitchen fitting`.
- A contradiction was raised rather than resolved, and wrote nothing into the Card.
- A span is not a day: `the week after next` proposed no date.
- A birthday came back with a rule, `FREQ=YEARLY;BYMONTH=12;BYMONTHDAY=19`.
- A line the person had marked `!` as their own was left alone, per ADR 0005.
- Two people in one sentence became two edits, one on each Card.
- ADR 0034's stripping rule works. No prompt this pass sent carried a `## Done` section, so the
  closed broadband line was hidden from every call, which is what ticket 03 rests on.
- `we might want to cancel it afterall` became a Note and not a Task in 3 of 5 runs. The prompt is
  right that an undecided thought is not a commitment. Where that Note was filed is ticket 02.

## Observations that are not tickets

**A festival date is invented and may be wrong.** `Diwali` came back as a date proposal for
`2026-10-29`. Diwali 2026 is not on that day as far as I can tell, but I have not checked it against
a source and am not filing an almanac claim I cannot back. Worth a look by somebody who can. It is a
Proposed Date the person confirms, so nothing is written off it unanswered.

**One probe registration in the bundle is misleading.** `L34` is registered to
`dropped_the_returning_errand`, whose `bad` includes "no Task was proposed at all". For L34 that is
the right answer rather than a failure, so its 5 of 5 mixes two outcomes and should not be read as
part of ticket 03's rate. Ticket 03 says so and leaves L34 out of its table. The scenario is fine
and the registration is what misleads.

**`claude` is not on the default `PATH` on this machine.** The first real run reported 28 rows
failed with `this mode needs the claude CLI on the PATH and it is not there`, and no call had
reached a model. That is the "a real model answered" check stopping a false green, which is what
the method says it is for. The binary is at `~/.local/bin/claude`, and `python` and `ruff` are in
`.venv/bin`.
