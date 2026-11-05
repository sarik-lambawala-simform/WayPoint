# 31 — HITL: run the live pass and file what it finds

**Type:** task

**Status:** completed

**Blocked by:** 30

**What to do:** run the live-model pass on this phase, get reproduction rates, and file what
survives as a new phase folder.

This is `ready-for-human` on purpose. `run-ralph-tickets.sh` picks `in-progress` first and then
`ready-for-agent`, so it skips this one rather than failing it. The pass needs a person for the
messages, and the runner fails any ticket where no commit lands, which a findings-only pass often
will not produce.

The method is `.claude/skills/live-pass/SKILL.md`, invocable as `/live-pass`.

## The tiers

Per ADR 0003, hosted models over local inference, the pass runs on the tiers the box runs on:
`claude-haiku-4-5` for filing and `claude-sonnet-5` for judgement. A comparison run on
`claude-opus-5` is a diagnostic and never a fix. Both tiers failing means the prompt is wrong. Only
the cheap tier failing means the prompt is too thin to carry it.

## Ticket 18's rate is taken here and not before

A recalled answer contradicting its own window has one run in this phase and one in phase 10.8.
Ticket 27 is what makes every forward question take the Recall route, so the rate becomes measurable
from this pass on. Nothing is built for it until it has one.

## Done when

- [x] The whole bundle runs, not only this phase's rows. 294 rows, 273 pass and 21 fail, in
      `claude-cli` mode on `claude-haiku-4-5` and `claude-sonnet-5`. The run is
      `live-pass-p10.9-hitl.json`.
- [x] Every finding carries a reproduction rate, measured with `python -m harness.live.repeat`.
      Two carry none and each says why in its own file: ticket 02 is arithmetic and holds whatever
      a model answers, and ticket 04 is a decision.
- [x] Ticket 18 has a rate or is recorded as still unmeasurable, with the reason. See below.
- [x] What survives is filed as `.scratch/memark-p10.95-a-question-filed-and-never-answered/` with
      an index.
- [x] The findings that are decisions rather than defects are filed as grilling tickets, and no
      agent answers its own side of one. Ticket 04 of that board is the one, and it is open.

## What ticket 18 came to

**No rate, and the reason changed.** Ticket 18 is a recalled answer contradicting its own window,
and it waited on ticket 27 to make the Recall route the common one. That worked: the route is now
ordinary and this pass recalled windows on many rows.

What stopped the measurement is ticket 01 of the new board. Phase 10.9's own ticket 25 lengthened
the footnote, and `an_answer_never_empties_a_window_it_read` at `checks.py:2471` reads that
footnote through `_matched_window`, which could not parse it. So the check that would have caught
ticket 18's shape was returning `None` and passing on every recalled row of this pass.

That is fixed now, in `4524299`, and the check can see again. **The next pass is the first one that
can measure ticket 18**, and it should be measured before anything is built for it. Nothing about
the finding changed. What changed is that the instrument for it was broken for the whole of this
pass and nobody could have known from the tally, because a blind check passes.

## What was found

Seven findings, in `.scratch/memark-p10.95-a-question-filed-and-never-answered/issues/00-index.md`.
Two were built during the pass, both harness defects, and both are the same shape as this phase's
own ticket 01. The headline is ticket 03: a question can cost a judgement call, come back with an
empty answer, and leave the person holding the ordinary `Recorded:` echo.

The bundle also gained 43 rows, `L254` to `L296`, in `harness/live/scenarios_p10_9_wide.py`.
