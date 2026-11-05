# 06 — A Part Drained Capture is left out of the filing scan

**What to build:** the stop on the second write, put on the read rather than on the write.

Decided in
[ticket 08, what stops a Part Drained Capture landing twice](../../memark-p09.6-decisions-only-you-can-make/issues/08-what-stops-a-part-drained-capture-landing-twice.md).
Do not re-argue it.

**Nothing refuses the second write, because the second write is never proposed.** A Part Drained
Capture is not shown to the filing model at all. Per ADR 0002, deterministic code selects what the
model sees.

**The rule:** a queued block is left out of the filing scan when something derived from it has
already landed, unless it carries an unapplied answer.

- **Already landed** is the block's id appearing in a `from::` link anywhere in the Vault. That is
  issue 05's definition of Part Drained, read rather than written.
- **An unapplied answer** is a `subject::` on the block line with no `filed::`. `settle_subject` at
  `memark/vault/apply.py:1311` writes it when you reply `pick N <name>`, and its docstring already
  says the next filing run reads the Capture and resolves it against the row named there.

Both halves are files the system already writes, so ADR 0020 needs no new store and no new mark.

**The precedent this copies.** `memark/run.py:488` already leaves a Proposed Alias out of the filing
scan and calls it a question waiting on an answer rather than a Capture, while `memark/run.py:781`
still puts it in the Digest. A Part Drained block is the same shape and gets the same treatment. The
Digest scan is untouched, so ADR 0037's fourteen-Digest bound still runs and the block still Parks.

**The number that settled it.** A Filing Run happens about eight times a day per ADR 0024, a block
waits up to fourteen Digests per ADR 0037, and `unfiled_blocks` at `memark/filing.py:244` sends every
block with no `filed::` mark on every run. Without a stop, one Part Drained block is re-proposed on
the order of a hundred times, and `_extend_card` at `memark/vault/apply.py:2752` writes every one. A
duplicate the box already accepts once is survivable. A hundred is a Card nobody can read.

**Where code looks.** One pass over the Vault per filing run, collecting every block id in a `from::`
link. `_cited` at `memark/vault/apply.py:2327` is the reader and already exists. **Cards and Date
Files both count**, because a part of a Capture can land in either. Leaving Date Files to
`_already_said` at `memark/vault/apply.py:2193` was rejected: it compares text exactly, and ticket 04
measured exact text at 0 out of 15.

**One duplicate is accepted and it is stated plainly.** On the run that applies your answer, the
model is handed the Capture's whole words again and may propose the part that already landed. The
alternative is a write-side guard, and it fails on the one case it is needed for: a Capture with two
facts for one Card, the first written and the second held for a Contradiction, would have its own
answer blocked by its own first line, for good. That turns a duplicate line into a permanent loss,
which is the failure issue 05 exists to end.

**Compaction does not clean this up, and saying it would was named as the tempting mistake.**
`memark/vault/apply.py:2239` checks one and drops it, because compaction is out of this build. So the
line stays on the Card. One line, visible in that run's diff, on a Card you had to answer a question
about anyway.

**The prompt is improved and is not the rule.** The Card body is already in the prompt with its
`from::` links per `_cards_shown_for` at `memark/filing.py:579`, so the filing prompt gains a
sentence saying a line already citing this block is filed and is not to be proposed again. Per the
map's standing preference and ADR 0003, which chose the cheap tier for filing, that lowers a rate and
decides nothing.

**Blocked by:** 05 — A Capture drains only when nothing derived from it is owed an answer.

**Status:** completed

**Completed at:** 2026-09-14T14:06:10Z

- [ ] `memark/run.py:488` gains a second filter beside `_is_a_proposed_alias`.
- [ ] A block cited anywhere in the Vault and carrying no unapplied `subject::` is left out of the
      filing scan.
- [ ] A block carrying a `subject::` and no `filed::` goes back to the model.
- [ ] The cited set is read over Cards and Date Files alike, built on `_cited` at
      `memark/vault/apply.py:2327`.
- [ ] `memark/run.py:781` is untouched and the Digest still asks, so the fourteen-Digest bound still
      runs.
- [ ] `_extend_card` at `memark/vault/apply.py:2752` gains no duplicate guard, and its docstring says
      why.
- [ ] The filing prompt gains the one sentence about a line already citing the block.
- [ ] A Part Drained block over several runs is proposed exactly once more, on the run that applies
      the answer.
- [ ] `CONTEXT.md`'s **Part Drained** entry gains one sentence saying such a Capture is not shown to
      the filing model until an answer lands on it.
