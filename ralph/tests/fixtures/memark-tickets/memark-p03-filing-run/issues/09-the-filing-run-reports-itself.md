# 09 — The filing run reports itself, and the exit gate

**What to build:** one log line per filing run that says what it did, and then the manual pass that
decides whether the cheap tier is actually good enough to be trusted with my notes.

Every count this phase produces goes to the log, because the Health Canary that will read them is phase
4. Gather them in one place rather than scattering print statements: Captures drained, batches attempted
and failed, Pinned Claim rejections, orphan refusals, malformed edits, Stale Targets, lint refusals,
held-back Captures, blocks newly parked, and acknowledgement edits refused. Phase 4 should be able to
read this structure and build the Canary without touching the filing code.

The Registry's row count and its token size are measured and reported rather than guessed. The Registry
ships whole on every call, so its size is the one number in this design that grows without bound, and
v1's answer is to buy the guarantee and watch the number rather than to optimise it away now. Watching
it means measuring it.

Then the exit gate, which is a reading exercise rather than a code change. The parent spec asks for it
explicitly, because no automated case can tell whether a Card is worth opening in a year.

**Blocked by:** 05 — Filing is batched, and a bad batch costs only its own Captures; 06 — A held-back
Capture: an Ambiguous Subject and a contradiction; 07 — A Card's status, and what the model is shown of
it; 08 — The acknowledgement fills itself in.

**Status:** completed

**Completed at:** 2026-09-01T10:35:15Z

- [ ] One structured log line per filing run carries every count listed above, and no count is printed
      from anywhere else.
- [ ] The Registry's row count and token size are measured on each filing call and logged.
- [ ] Every automated case from the spec passes, and the test suite drives all of them through the
      scheduled run's single entry point.
- [ ] Manual: send five real Captures across an afternoon about two people and one project, then read
      `git diff` on every resulting commit.
- [ ] Manual: read the resulting Cards in Obsidian and ask of each whether it is something you would
      want to open in a year.
- [ ] Manual: edit a Card by hand while a run is in flight, and confirm your text survives untouched.
- [ ] Manual: put a `!` on a line, say something that would reword it, and confirm the line is
      unchanged.
- [ ] Manual: send a Capture naming a person whose first name matches two Registry rows, and confirm
      nothing is written anywhere.
- [ ] Manual: turn the API key off for an hour, keep capturing, turn it back on, and confirm everything
      files.
- [ ] A week of real Captures has been filed, the git diffs read by hand, and the result judged
      acceptable. Then phase 4 starts.
