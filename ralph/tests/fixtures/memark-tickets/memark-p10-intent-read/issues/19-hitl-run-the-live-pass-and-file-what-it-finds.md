# 19 — HITL: run the live pass and file what it finds

**What to build:** the pass itself, run by a person, with whatever survives filed as the next bug phase.

**Status:** ready-for-human

This is `ready-for-human` on purpose. `run-ralph-tickets.sh` picks `in-progress` first and then
`ready-for-agent`, so it skips this one rather than failing it. It needs a person for two things no agent
may do alone.

The messages have to come from the person whose Vault it is. A set an agent invents tests its own idea of
a thought, and this is the phase that decides whether the box understands how you actually talk. The
drafts from ticket 18 are a starting point to edit, not a substitute.

And nothing is filed as a defect until it reproduces, five runs out of five on the filing model, via
`python -m harness.live.repeat`. This rule exists because the first pass of this bundle produced a
write-up claiming a defect that five repeat runs then killed.

Whatever survives is filed as `.scratch/memark-p10.5-<slug>/` before phase 11 starts. A finding that
needs a human decision rather than an implementation is a wayfinder grilling ticket, not an
implementation ticket.

The manual pass in the spec is part of this ticket, and it is a week long. Send the parent spec's worked
example message in your own voice and compare the reply against the one written there, line by line.
That example is the bar.

**Blocked by:** 18 — AFK: add this phase's live scenarios and checks.

- [ ] The scenarios were edited or replaced with messages the Vault's owner actually wrote.
- [ ] The pass ran against a real model and the write-up separates what must be true from what the model
      chose.
- [ ] The parent spec's worked example message was sent and the reply compared line by line.
- [ ] A week was spent never typing a Command, only talking, and every time the system did the wrong
      thing rather than refusing was counted.
- [ ] A deliberately ambiguous message was sent, and it refused and named what it could not use.
- [ ] `undo` was sent after a real mistake and nothing had reached a file.
- [ ] Every row of the parent spec's ask-path table was walked and each ask has a working typed reply.
- [ ] Every claimed defect reproduced five runs out of five via `python -m harness.live.repeat`.
- [ ] What survived is filed as `.scratch/memark-p10.5-<slug>/`.
