# 13 — HITL: run the live pass and file what it finds

**What to build:** the pass itself, on a real model, on messages the person whose Vault it is actually
wrote.

Two things here no agent may do alone. The messages have to come from that person: a set an agent
invents tests its own idea of a thought, and the drafts from ticket 12 are a starting point to edit
rather than a substitute. And nothing is filed as a defect until it reproduces, five runs out of five on
the filing model, via `python -m harness.live.repeat`. That rule exists because the first pass of this
bundle produced a write-up claiming a defect that five repeat runs then killed.

Whatever survives is filed as `.scratch/memark-p05.5-<slug>/` before phase 6 starts. A finding that
needs a human decision rather than an implementation is a wayfinder grilling ticket and not an
implementation ticket.

This ticket is `ready-for-human` on purpose. The ticket runner picks `in-progress` first and then
`ready-for-agent`, so it skips this one rather than failing it on a pass that often produces findings
and no commit.

**Blocked by:** 12 — AFK: add this phase's live scenarios and checks.

**Status:** ready-for-human

- [ ] The scenarios were edited or replaced by the person whose Vault it is before the pass ran.
- [ ] The pass ran against a real model, with filing on `claude-haiku-4-5` and judgement on
      `claude-sonnet-5`.
- [ ] Every candidate defect has a reproduction rate from `python -m harness.live.repeat`, and nothing
      below five out of five was filed.
- [ ] What survived is filed as `.scratch/memark-p05.5-<slug>/` with a spec and one file per issue.
- [ ] Any finding needing a human decision is a grilling ticket rather than an implementation ticket.
