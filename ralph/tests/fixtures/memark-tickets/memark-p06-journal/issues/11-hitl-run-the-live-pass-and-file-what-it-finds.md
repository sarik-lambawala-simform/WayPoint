# 11 — HITL: run the live pass and file what it finds

**What to build:** the pass itself, on a real model, on messages the person whose Vault it is actually
wrote.

Two things here no agent may do alone. The messages have to come from that person: a set an agent
invents tests its own idea of a thought, and the drafts from ticket 10 are a starting point to edit
rather than a substitute. And nothing is filed as a defect until it reproduces, five runs out of five
on the filing model, via `python -m harness.live.repeat`. That rule exists because the first pass of
this bundle produced a write-up claiming a defect that five repeat runs then killed.

Whatever survives is filed as `.scratch/memark-p06.5-<slug>/` before phase 7 starts. A finding that
needs a human decision rather than an implementation is a wayfinder grilling ticket and not an
implementation ticket.

This ticket is `ready-for-human` on purpose. The ticket runner picks `in-progress` first and then
`ready-for-agent`, so it skips this one rather than failing it on a pass that often produces findings
and no commit.

**Blocked by:** 10 — AFK: add this phase's live scenarios and checks.

**Status:** completed

**Completed at:** 2026-09-08

- [~] The scenarios were edited or replaced by the person whose Vault it is before the pass ran.
      Not met. The limit was put to the user and they directed an agent to draft the messages
      instead. `.scratch/memark-p06.5-the-journal-and-the-bare-capture/spec.md` says so at the top
      of what the evidence is worth, and says which finding it does and does not weaken.
- [x] The pass ran against a real model, with filing on `claude-haiku-4-5` and judgement on
      `claude-sonnet-5`. The 54-row pass ran a tier above both, which `harness/session.py:92`
      documents as deliberate, so no rate was taken from it. Every rate came from
      `harness/live/repeat.py`, which uses the two models named here, and `L46` was also run once
      end to end on them.
- [x] Every candidate defect has a reproduction rate from `python -m harness.live.repeat`, and
      nothing below five out of five was filed. Five candidates, one filed. Four died: an omission
      that was a probe matching a phrase, a dropped claim that was a retraction honoured at 0 of 5,
      a one-block entry at 0 of 5, and a harness default that turned out to be deliberate.
- [x] What survived is filed as `.scratch/memark-p06.5-the-journal-and-the-bare-capture/` with a
      spec and one file per issue.
- [x] Any finding needing a human decision is a grilling ticket rather than an implementation
      ticket. There is no grilling ticket. The one finding breaks a rule the prompt already states,
      so it needs no decision.
