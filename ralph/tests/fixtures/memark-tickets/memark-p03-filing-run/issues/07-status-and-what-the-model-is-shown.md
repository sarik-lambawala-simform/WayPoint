# 07 — A Card's status, and what the model is shown of it

**What to build:** the two rules that change what the agent pays attention to without changing a word of
what is on disk. A finished project stops taking up room in every call and wakes when I mention it
again, and an errand I finished stops being offered back to me.

**Dormancy narrows attention and never narrows retrieval,** per ADR 0007, which decided decay applies to
attention rather than to claims. A Card with `status: dormant` is skipped by routine selection, its
content is untouched, and a due date on it still fires. Dormancy is set and cleared by the agent through
the status change the edit schema already carries, a new Capture naming the subject wakes it, and every
transition is a visible line in the run's diff so I can see it happen in `git log`. There is no score and
no threshold anywhere in this. Selection itself is phase 4, so what this ticket owns is the transition
and the fact that it is visible.

**A closed Task is stripped before any model sees a Card,** per ADR 0034, which decided a closed Task is
hidden from the model and never reopened. Code does the stripping and it is one function with two
callers: the filing call's view of a Card here, and the Lookup's corpus in phase 9. Write it as that one
function now, so phase 9 calls it rather than writing a second one that drifts. The line stays in the
file under `## Done`, visible to me, to Obsidian and to the linter. This is the difference between the
model's view of a Card and the Card, and it is the first place that distinction is made.

**Blocked by:** 03 — Code resolves the subject: extending a Card, and Loose Ends.

**Status:** completed

**Completed at:** 2026-09-01T09:50:06Z

- [ ] A Dormant Card named by a new Capture has its `status` changed to live, and the transition is a
      line in the run's diff.
- [ ] An edit setting a Card dormant changes only the frontmatter, and the test asserts the body is
      byte-identical.
- [ ] No score, threshold or age comparison exists in the dormancy code path.
- [ ] A Card carrying closed Tasks appears in the filing call's view of that Card with none of them, and
      the same closed Tasks are still present in the file on disk under `## Done`.
- [ ] Stripping is one function, and the test asserts the model prompt built for a filing call contains
      no closed Task text.
- [ ] A fixture is added for a Dormant Card. The baseline fixture already carries a Card with a closed
      Task, so extend it rather than duplicating it.
