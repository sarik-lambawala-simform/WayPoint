# 04 — Every refusal on the write path

**What to build:** the run refuses to write rather than risk destroying something, in every case where
it cannot be sure. Five checks, all in the one place where writing happens, which is the only reason any
of them is enforceable at all. They are one ticket because they are one function with one set of
fixtures, and splitting them would have two tickets editing the same lines.

**A line I marked is untouchable.** ADR 0005 decided a human claim is immutable to the agent, so an edit
targeting a line carrying `!` is filtered out of the applicable set before writing, whatever the model
proposed. The prompt states the rule and the code enforces it, and the code is the part that counts. A
rejection is a model fault rather than a normal event, so the rejected count should sit at zero and a
non-zero one says the cheap tier is misreading the grammar. Only a `compact` can ever be rejected, and a
rejected compact is dropped whole rather than applied in part. Compaction is out of the First Loop, so
in v1 the filter and the mark both exist and there is nothing yet for the filter to reject.

**No Capture is orphaned.** ADR 0019 decided compaction may shorten a Card but never orphan a Capture,
so every Capture that has produced a line in a Card must still have at least one line in that Card
pointing back at it. Checked in the same place as the Pinned Claim rule.

**Provenance is checked on the edit, not on the file.** The linter reads a file and cannot tell who
wrote a line, so the check has to happen while the edit is still data. ADR 0014's schema carries the
source Captures, so an `extend` names at least one Capture and a `compact` carries the sources of every
line it folds. An edit failing this is malformed and costs its batch.

**A file that changed under me keeps my text.** ADR 0009 decided writes are applied against recorded
expected state. The usual case is a Card I fixed by hand in Obsidian while the run was thinking. Its
pending edits are dropped rather than applied, the Captures behind them stay undrained, the rest of the
run proceeds and commits, and the conflict is reported. `vault/apply.py` already has the `FileState`
digest and `ExpectedStateError` this rests on.

**A Card that fails the format check is never repaired.** The lint gate runs once, immediately before
write. A Card whose body breaks the grammar takes the same path as a Stale Target: pending edits
dropped, Captures left undrained for the next run, the path named. The run does not try to fix the file,
because a program repairing my formatting is a program rewriting my words.

Neither a Stale Target nor a malformed edit is a stage failure. Each drops its own edits and the run
still commits the rest.

**Blocked by:** 02 — The edit schema, the filing call, and a Capture becoming a new Card.

**Status:** completed

**Completed at:** 2026-09-01T09:00:24Z

- [ ] A proposed edit targeting a line carrying `!` is dropped and counted, and the line on disk is
      byte-identical afterwards.
- [ ] A rejected `compact` is dropped whole, and the test asserts no part of it was applied.
- [ ] A proposed compaction that would leave a Capture with no line pointing back at it is refused.
- [ ] An `extend` naming no source Capture is malformed and costs its batch, and a `compact` missing the
      source of any line it folds is malformed too.
- [ ] An edit whose target changed on disk between read and write leaves that file exactly as the human
      wrote it, the rest of the run still commits, and the Captures behind the dropped edits stay
      undrained.
- [ ] A second run over that same Vault files against the human's text, so the retry is self-healing.
- [ ] A Card whose body breaks the grammar has its pending edits dropped, its Captures left undrained,
      its path named in the log, and its bytes unchanged.
- [ ] Every refusal above increments its own count, and the counts are logged until phase 4's Health
      Canary reads them.
- [ ] Fixtures cover a Card carrying a Pinned line and a Card that breaks the grammar. The baseline and
      broken fixtures already carry both, so extend rather than duplicate them.
