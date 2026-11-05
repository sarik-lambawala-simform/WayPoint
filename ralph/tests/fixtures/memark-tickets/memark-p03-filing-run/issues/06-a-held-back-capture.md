# 06 — A held-back Capture: an Ambiguous Subject and a contradiction

**What to build:** two cases where the right answer is to write nothing and ask. Both work the same way,
which is why they are one ticket: nothing derived from that Capture is applied, the Capture stays
undrained, and the ask comes back later because the Capture is still unfiled.

**Two friends called Priya.** A name in a Capture matching more than one Registry row is an Ambiguous
Subject, per ADR 0015. No edit derived from that Capture is applied. Not only the edit naming the
ambiguous person: a batch's edits can share a source, so all of them are held. Registry rows carry a distinguishing name
for exactly this reason, such as `Priya (colleague)`. A needless question costs one line in a Digest. A
wrong guess costs a false belief about a person that nothing downstream can detect, and lands something
private under the wrong name.

**My own remarks will conflict.** An edit whose `kind` is `contradict` never reaches the write path, per
ADR 0010, which decided contradictions surface rather than resolve. Nothing is written into the Card,
because a claim the agent may not adjudicate is a claim it may not record. Both claims survive exactly as
they were. The prompt tells the model to prefer `contradict` when it is unsure, because an unnecessary
question is cheaper than a silent loss.

The ask is derived rather than stored, which is what keeps ADR 0020's rule that state comes from files
the system already writes. There is no queue of questions anywhere. The Capture is still unfiled, so the
filing call that runs alongside tomorrow's Digest raises it again by itself.

Neither ask has a reply yet. `pick` answers the ambiguous one and arrives in phase 10. Until then the
question repeats in the Digest and the fix is a hand edit. That is a known and temporary gap, named in
the spec rather than discovered later. In this phase the ask goes to the log, because the Digest is
phase 4.

**Blocked by:** 03 — Code resolves the subject: extending a Card, and Loose Ends.

**Status:** completed

**Completed at:** 2026-09-01T09:31:07Z

- [ ] A Capture naming a subject that matches two Registry rows applies nothing, leaves the Capture
      undrained, and raises the ask.
- [ ] Every other edit in that batch derived from the same Capture is held back too, while edits from
      unrelated Captures in the batch still apply.
- [ ] An edit marked `contradict` writes nothing to the Card, both claims survive byte-identical, and
      the Capture stays undrained.
- [ ] Neither case writes a question anywhere in the Vault, and a second run raises the same ask from
      the same unfiled Capture with no stored state.
- [ ] The prompt states the rule that the model prefers `contradict` when unsure.
- [ ] A fixture is added with a Registry carrying two rows sharing a first name, each with its own
      distinguishing name.
