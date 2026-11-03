# 08 — What stops a Part Drained Capture landing twice?

**Type:** grilling

**Status:** resolved

**Blocked by:** none. [Ticket 03](03-should-a-capture-be-filable-in-parts.md) is resolved, and this is
the only thing between that decision and the code.

**Raised by:** ticket 03's answer, in session.

**Blocks:** ticket 03's implementation. The decision there is not buildable until this is answered.

**Owned by:** `_extend_card` in `memark/vault/apply.py`.

## Question

[Ticket 03](03-should-a-capture-be-filable-in-parts.md) decided a Capture files in parts and stays in the
queue while any part of it is owed an answer. So the next filing run reads the same block, and the model
proposes the fact that already landed a second time.

What refuses the second write?

## Why this is not obvious

There is no duplicate guard on a Card extend. `_extend_card` at `memark/vault/apply.py:2752` checks the
heading is writable, the format gate, and the expected state, and nothing else. The only duplicate check
in the module is for date files at `memark/vault/apply.py:2193`, and it is `one.text == line.text`, an
exact match. A reworded line gets through it.

Rewording is not a worry to wave at. Ticket 04 in this folder measured it on `again-of::`: the link
filled 0 times out of 15 on Haiku and 0 of 3 on Opus, on four wordings of one errand. Exact text is not a
thing the cheap tier hands back twice.

## The guard that looks right and is not

Refuse an edit whose source Capture is already cited on the target Card. The reader exists: `_cited` at
`memark/vault/apply.py:2327` reads every Capture a Card line points at, off the `from::` links ADR 0026,
a Card line has a fixed grammar, puts on every agent line. And it is derived state, so ADR 0020, state is
derived from files the system already writes, is satisfied.

It is wrong as stated. Take a Capture with two facts about one subject, where the first was written and
the second was refused. Next run, the Capture is already cited on that Card by its own first line, so the
guard blocks the second fact for good. The rule meant to stop a double write ends in a permanent loss,
which is the failure ticket 03 was resolved to end.

## What to grill on

- **Is the guard per Capture, per Card, or per line?** Per Capture and per Card is the false block above.
  Per line needs the lines to be comparable, which is the rewording problem.
- **Does the model need to be shown what already landed?** The Card body is already in the prompt, per
  `_cards_shown_for` in `memark/filing.py:579`, and every line in it carries a `from::` link to the block
  being re-read. So the information is on screen. Whether the prompt may be asked to use it is the
  question, and the map's standing preference says a prompt is never the rule. A prompt that reduces the
  duplicate rate is not the same as a guard.
- **Should the refused edit carry a mark instead?** The honest shape of the guard may be to record which
  of a Capture's edits are still owed rather than which landed. That is a new store and ADR 0020 refuses
  one, so this option has to beat the refusal rather than ignore it.
- **Is a double line actually the worst outcome?** ADR 0019, compaction may shorten a Card but never
  orphan a Capture, lets the agent fold lines that agree. A duplicate is exactly two lines that agree. So
  the question may be whether compaction already cleans this up, and at what delay, rather than whether
  the write is refused.

## Not to be answered by an agent

A resolution is appended here under `## Answer`, `Status:` is set to `resolved`, and a one-line gist plus
a link goes into `../map.md` under Decisions so far.

## Answer

**Nothing refuses the second write, because the second write is never proposed. A Part Drained Capture
is not shown to the filing model at all.** The stop goes on the read and not on the write, per ADR 0002,
deterministic code selects what the model sees. The block stays in the queue, the Digest still asks about
it, and it goes back to the model only when an answer arrives on it.

### The rule

A queued block is left out of the filing scan when something derived from it has already landed, unless
it carries an unapplied answer.

- **Already landed** is the block's id appearing in a `from::` link anywhere in the Vault. That is
  ticket 03's own definition of Part Drained, read rather than written.
- **An unapplied answer** is a `subject::` on the block line and no `filed::`. `settle_subject` at
  `memark/vault/apply.py:1311` writes it when you reply `pick N <name>`, and its docstring already says
  what happens next: "The Capture is still unfiled, so the next filing run reads it, resolves it against
  the row named here rather than asking again, and it is that run that writes the claim."

Both halves are files the system already writes for other reasons, so ADR 0020, state is derived from
files the system already writes, needs no new store and no new mark.

### The precedent this copies

The box already skips one kind of block on exactly this reasoning. `memark/run.py:488` leaves a Proposed
Alias out of the filing scan and calls it "a question waiting on an answer rather than a Capture", while
`memark/run.py:781` still puts it in the Digest. A Part Drained block is the same shape and gets the same
treatment. The Digest scan is untouched, so ADR 0037's fourteen-Digest bound still runs and the block
still Parks at the end of it.

### What the numbers made this decision on

A Filing Run happens every few hours, about eight a day, per ADR 0024, filing is frequent and speaking is
daily. A block waits up to fourteen Digests for an answer, per ADR 0037. `unfiled_blocks` at
`memark/filing.py:244` sends every block with no `filed::` mark on every run. So without a stop, one
Part Drained block is re-proposed on the order of a hundred times, and `_extend_card` at
`memark/vault/apply.py:2752` writes every one of them.

That number is what settles the whole question. A duplicate the box already accepts once, on the stale
inbox path `_drain` in `memark/filing.py` describes, is survivable. A hundred of them is a Card nobody
can read and a daily diff nobody can check.

### Where code looks

One pass over the Vault per filing run, collecting every block id in a `from::` link. `_cited` at
`memark/vault/apply.py:2327` is the reader and already exists, written for ADR 0019's orphan check.

**Cards and Date Files both count.** A part of a Capture can land in either, and one rule over both is
the same shape ticket 03 chose. Leaving Date Files to their own guard was rejected: `_already_said` at
`memark/vault/apply.py:2193` compares text exactly, and ticket 04 measured what the cheap tier does with
exact text at 0 out of 15. A guard the measurement says does not fire is not a reason to carve out a
case.

The alternative was a block-only read: skip a block carrying `shown:: 1` or more and no `subject::`,
using `times_shown` at `memark/vault/grammar.py:534`. It costs no Vault read and it is wrong in a window.
The refusal is written nowhere, which `a_pick_of` at `memark/commands.py:1086` says out loud, so `shown::`
stays at zero until that evening's Digest and the three runs before it all send the block. Three duplicate
lines rather than none, to save a read of a few hundred small files on a laptop. ADR 0028, conversation
finds Cards by matching words, already builds a whole search index over the same files on every Lookup
call, so a whole-Vault read is a cost this system has accepted before.

### The one duplicate this accepts, and why

The `subject::` exception opens a hole exactly one line wide. On the run that applies your answer, the
model is handed the Capture's whole words again and proposes the part that already landed alongside the
part that did not.

That is accepted. The alternative is the guard ticket 08 was written around, refuse an edit whose source
block is already cited on the target Card, and it fails on the one case it is needed for. Take a Capture
with two facts about one person, the first written and the second held for a Contradiction. Both lines
are for the same Card and both cite the same block, so the guard blocks your own answer and blocks it
for good. It turns a duplicate line into a permanent loss, which is the failure ticket 03 was resolved to
end.

**Compaction does not clean this up yet, and saying it would was the tempting mistake.** ADR 0019 lets a
compaction fold lines that agree, and two duplicate lines are the easiest fold there is. But compaction
is out of this build: `memark/vault/apply.py:2239` checks one and then drops it, saying "`compact` is out
of this build, so no compaction reaches a file". So the duplicate line stays on the Card until compaction
ships. One line, visible in that run's diff, on a Card you had to answer a question about anyway. That is
the cost, stated plainly rather than deferred to code that does not exist.

### The prompt is improved and is not the rule

The Card body is already in the prompt with its `from::` links, per `_cards_shown_for` at
`memark/filing.py:579`, so the model can see which lines came from the block it is being shown. The
filing prompt gains a sentence saying a line already citing this block is filed and is not to be proposed
again. Per the map's standing preference, and ADR 0003, hosted models over local inference, which chose
the cheap tier for filing, that lowers a rate and decides nothing. The rule is the skip.

### What changes

- `memark/run.py:488`. The filing scan gains a second filter beside `_is_a_proposed_alias`: a block whose
  id is cited anywhere in the Vault and which carries no unapplied `subject::` is left out.
- `memark/run.py:781`. Untouched, on purpose. The Digest still asks, so the bound still runs.
- A reader for the cited set, over Cards and Date Files, built on `_cited` at
  `memark/vault/apply.py:2327`.
- The filing prompt gains one sentence, as a rate and not a rule.
- `CONTEXT.md`. The **Part Drained** entry ticket 03 adds gains one sentence: a Part Drained Capture is
  not shown to the filing model until an answer lands on it.
- `memark/vault/apply.py:2752`. No duplicate guard is added to `_extend_card`. That is the decision, and
  the docstring says why rather than leaving the absence to look like an oversight.

### Rejected

**A duplicate guard on the write, per Capture and per Card.** The shape ticket 08 was written around.
Rejected because it blocks a Capture's second fact with its own first line, permanently, on exactly the
case that matters.

**A duplicate guard on the write, per line text.** Rejected on ticket 04's measurement. The model
rewords, 15 times out of 15, so a text comparison catches almost nothing.

**A mark recording which of a Capture's edits are still owed.** Rejected per ADR 0020. It is a second
source of truth, and the `from::` links already say it.

**Accept the duplicates and wait for compaction.** Rejected on the arithmetic above. Compaction is out of
this build, and even built it would be folding roughly a hundred lines per unanswered question.

### One thing that did not need deciding

A Card that will not parse cannot hide its citations in a way that costs anything. `_read_card` at
`memark/vault/apply.py:2334` already refuses to write to a Card that fails the format check, per ADR
0026, so an unreadable Card cannot grow a duplicate line either. The edit is refused with the path named.
