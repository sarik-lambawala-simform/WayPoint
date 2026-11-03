# 03 — Code resolves the subject: extending a Card, and Loose Ends

**What to build:** the second thing I say about someone lands in the Card the first thing made, and an
errand that belongs to nobody has one fixed home instead of a Card invented for the plumber. Both are
the same step: taking the name the model read and deciding, in code, which file it means.

The model returns the name it read and never a path, per ADR 0015, which decided an ambiguous subject is
asked about and never guessed. Resolution is code's job, matched exactly against the Registry, against
both the Card names and the aliases a row carries. A match extends the existing Card and creates no
second one, so the same person is never split across two near-duplicate files. That check running in
code rather than in the prompt is also what makes two batches proposing the same new subject safe, which
ticket 05 asserts.

A Capture that names no subject and produces a Task goes to `areas/loose-ends.md`. It is the one Card
reserved by name and the only permitted home for a subjectless Task, and the agent may not invent an
alternative. That is what makes the invariant checkable: every Task lives in a Card. It also means no
Card is ever created for the plumber, which is the whole point, because a Card per errand is how a Vault
rots into a list of one-line files.

Every Task lives in the Card it came from, so a Task inferred from a Capture about a person goes under
that person's Tasks heading rather than to Loose Ends. Loose Ends is the fallback and never the default.

**Blocked by:** 02 — The edit schema, the filing call, and a Capture becoming a new Card.

**Status:** completed

**Completed at:** 2026-09-01T08:37:25Z

- [ ] A Capture about a subject already in the Registry extends that Card, and the test asserts no
      second Card and no second Registry row were created.
- [ ] Resolution matches the Registry exactly, on Card names and on the aliases a row carries, and the
      test covers a Capture reaching a Card through an alias.
- [ ] A Capture naming no subject and producing a Task lands in `areas/loose-ends.md`, and the test
      asserts no Card was created for anything the Capture mentioned.
- [ ] A Task inferred from a Capture about a known person lands under that person's Card, not in Loose
      Ends.
- [ ] An edit proposing an invented alternative home for a subjectless Task is refused and counted.
- [ ] Resolution takes the name the model returned and never a path, so a path in a model response is
      ignored rather than trusted.
