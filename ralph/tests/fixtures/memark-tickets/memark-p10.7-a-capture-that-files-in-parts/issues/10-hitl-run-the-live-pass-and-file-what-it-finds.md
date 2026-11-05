# 10 — HITL: run the live pass and file what it finds

**What to build:** the pass itself, run by a person, with whatever survives filed as the next bug
phase.

**Status:** ready-for-human, partly done

This is `ready-for-human` on purpose. `run-ralph-tickets.sh` picks `in-progress` first and then
`ready-for-agent`, so it skips this one rather than failing it. It needs a person for two things no
agent may do alone.

The messages have to come from the person whose Vault it is. A set an agent invents tests its own
idea of a thought, and this phase turns on what a real brain dump looks like: how many thoughts land
in one message, how many of them the box cannot file, and how the person talks about themselves. The
drafts from issue 09 are a starting point to edit, not a substitute.

And nothing is filed as a defect until it reproduces, five runs out of five on the filing model, via
`python -m harness.live.repeat`. This rule exists because the first pass of the phase 9 bundle
produced a write-up claiming a defect that five repeat runs then killed.

Whatever survives is filed as `.scratch/memark-p10.75-<slug>/` before phase 10.8 starts. A finding
that needs a human decision rather than an implementation is a wayfinder grilling ticket, not an
implementation ticket.

The manual pass in the spec is part of this ticket.

**Blocked by:** 09 — AFK: add this phase's live scenarios and checks.

- [ ] The scenarios were edited or replaced with messages the Vault's owner actually wrote.
      **Waived by the owner, who asked the agent to write them.** They wanted a set covering an
      Indian household's day to day and said so. 25 rows, `L143` to `L167`, in
      `harness/live/scenarios_p10_7_india.py`. Phase 9.5 was filed under the same waiver, and
      `.scratch/memark-p10.75-a-thought-nobody-proposed/spec.md` records this one in its own words.
- [x] The pass ran against a real model and the write-up separates what must be true from what the
      model chose. 25 of 25 rows pass their hard checks. Every finding came out of the soft
      observations, which is what the method says to read.
- [ ] A real brain dump with one unfilable thought was sent, and the next Digest asked about that
      thought and nothing else from the message. **Still owed. Needs the owner's own Telegram.**
- [ ] That Digest question was answered and the diff was checked. One duplicate line is the accepted
      cost. More than one is a defect. **Still owed, and blocked by the check above.**
- [ ] Five things about the person were said over a week, and `people/me.md` was read. Any mood on it
      is a prompt defect against the durability test. **Still owed. Needs a week of real days.**
      `L153` and `L154` measure the same rule in one run and both behave.
- [x] An errand was closed, then sent again reworded, and the link filled. `L162`, `L163` and `L164`
      each fill `again-of::`, on the reserved Card, across files, and across folders. The old code
      match filled it 0 times in 24.
- [x] A rate was measured for the cheap tier emitting the literal `Me`, both for a message about the
      person and for `remind me`. `L150` emits it, `L151` and `L152` hold it back.
- [x] Every claimed defect reproduced five runs out of five via `python -m harness.live.repeat`.
      Ticket 01 is 5 of 5 on `claude-haiku-4-5`. Ticket 02 is 3 of 5 and is filed with that rate
      rather than with a claim of five.
- [x] What survived is filed as `.scratch/memark-p10.75-a-thought-nobody-proposed/`.

**Status of the three unmet checks:** all three need the Vault's owner sending real messages over
real days, which is the one thing no agent may do alone. They stay unticked on purpose. The rest of
the pass ran and what it found is filed.
