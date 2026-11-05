# 10 — A returning errand carries `again-of::`

**What to build:** the errand that comes back is a new line pointing at the old one, and the box you
ticked in March stays ticked.

Closing is terminal, per ADR 0034, which hid a closed Task from every model read and forbade reopening
one. So a returning errand is a new Task carrying `again-of::`, a wiki link to the closed line's block
id. Code fills it on an exact text match within the same Card, never the model, which cannot see the
closed line to find its id. The link is best effort: "chase the plumber" recreated as "chase the plumber
again" is a different string and gets no link. The ban on unticking is the absolute part.

The rule binds the agent and not you. Untick a box by hand in Obsidian and the Task is open again, and
that is accepted silently. Enforcing terminality in code would mean a program re-ticking a box a person
deliberately unticked, which is what ADR 0005 refuses by making a human claim immutable to the agent.

**Blocked by:** 02 — The next run applies `close-task` with code alone.

**Status:** completed

**Completed at:** 2026-09-04T14:00:40Z

- [ ] A new Task whose text exactly matches a closed Task in the same Card gains `again-of::` linking to
      the closed line's block id, filled by code.
- [ ] A new Task whose text differs gains no link, and nothing is guessed.
- [ ] A matching closed Task in a different Card produces no link.
- [ ] A Card whose closed Tasks were unticked by hand is accepted: the agent treats them as open, never
      re-ticks them and never proposes an untick.
