# 03 — The Health Canary, and a run that could not compose a Digest

**What to build:** the end of every Digest says whether the run itself was sound, so that a Digest
arriving is never on its own evidence that anything worked.

The Canary is composed by code, because a model asked to report on its own run is the wrong reporter.
It shows only what is not zero, so a clean day is one line. Two counts always show whatever their
value: the run count, which is the proof a run happened at all, and the rejected-edit count, which is
expected to sit at zero forever and whose silent absence would look exactly like it working. Where the
Canary is delivered is the Vault Setting ticket 01 added.

The numbers come from phase 3's report structure rather than from the filing code, which is what
`report.py` was built for. This ticket wires up every count that already exists: failed Filing Runs,
Captures drained, failed batches, edits applied, edits rejected as Pinned Claim violations, edits held
back as Contradictions or Ambiguous Subjects, Stale Targets, Cards that failed the format check, the
Registry's row count and token size, the line count of the largest Card with its name, parked blocks,
message edits Telegram refused, Review Dates due today, and whether any stage failed. Later tickets in
this phase add their own counts to the same structure and change nothing here. No path is ever in the
Canary. The paths are in the commit message, which already holds them.

The Canary is sendable with no model in the path. When Digest composition fails, nothing is committed
and the transport sends the Canary alone as a bare message saying the run did not complete and what
state the Vault was left in. That is the expected output of a failed run and not an error path.

**Blocked by:** 02 — One Digest a day: code assigns the numbers, the model writes the words.

**Status:** completed

**Completed at:** 2026-09-01T12:55:44Z

- [ ] A clean day's Canary is one line carrying the run count and a zero rejected-edit count, and no
      other count.
- [ ] A day with a failed batch, a Stale Target and a parked block shows each of the three, and shows
      nothing that is zero.
- [ ] Every count listed above is read from phase 3's report structure, and the filing code is not
      touched to add one.
- [ ] No file path appears anywhere in a Canary.
- [ ] A Digest composition that fails commits nothing and sends a Canary-only message with no Digest.
- [ ] The Canary-only message says the run did not complete and what state the Vault was left in.
- [ ] The Canary goes where its Vault Setting says.
