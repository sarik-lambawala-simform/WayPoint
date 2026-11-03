# 03 — Should a Capture be filable in parts?

**Type:** grilling

**Status:** resolved

**Blocked by:** [02 — May the reserved Card hold a claim?](02-may-the-reserved-card-hold-a-claim.md),
now resolved. The question below can be argued on its own. What cannot is the naming. This ticket needs
a word in `CONTEXT.md` for a Capture that only partly landed, and ticket 02 decides whether the Vault
keeps a thought with no home at all. Name the fourth state first and then decide the Vault drops
homeless thoughts, and you have named something the Vault does not do.

**Moved from:** phase 4.6 ticket 06. Renumbered, not rewritten.

**Owned by:** phase 3. `_file_one_batch` and the ask path in `memark/filing.py`.

**Found by:** the live-model pass, scenario L9.

## Question

One Capture carried three separable facts. One of them was a Contradiction. Because a Capture is
filed or held back whole, the other two facts were never written.

Is that the right trade at v1, or does a Capture need a way to be filed in parts?

## Why this is grilling and not a task

There is nothing to implement until the trade is settled, and settling it is a judgement about how
the Vault should behave when its owner brain dumps. That judgement is the user's. Per the wayfinder
ticket types, a grilling ticket resolves only through live exchange, and the agent never stands in
for the human's side of it.

Invoke `/mattpocock-skills:grilling` and `/mattpocock-skills:domain-modeling` when working this.
Domain modeling is named because a partial fill needs a word the Vault does not have yet: a Capture
today is drained, held back or parked, and "some of it landed" is a fourth state with no name.

## What was seen

The Capture:

```
ok brain dump: the plumber quote was 4200 not 3800, priya's leaving the agency in november
she told me at lunch, and I still haven't cancelled the skip hire
```

`claude-haiku-4-5` read it correctly and proposed three edits:

| kind | subject | line |
| ---- | ------- | ---- |
| `extend` | `Kitchen` | `plumber quote is 4200` |
| `contradict` | `Priya (colleague)` | `leaving the agency` |
| `extend` | null, a Task | `cancel the skip hire` |

The `contradict` held the whole Capture back. No Card changed.

## What the current behaviour rests on

ADR 0010 surfaces Contradictions rather than resolving them, and the Capture is the unit that carries
the question onward. `filing.py` says so:

> the unfiled block it came from is the whole of what carries the question onward

The missing `filed::` mark is the only record that a question is open. There is no mark for "two of
these three landed", and inventing one is the kind of new store ADR 0020 refuses.

## What to grill on

- Is delay the real cost, or is silence? Nothing is lost: the facts are written once the
  Contradiction is answered. But nothing in the chat says two good facts are waiting on one
  disagreement.
- How long does the delay actually last? Not one phase. Phase 5's spec puts `pick` out of scope and
  says so plainly: "Three asks still have no typed reply after this phase, an Ambiguous Subject, a
  Contradiction and a Proposed Alias, and all three are phase 10's." So answering a Contradiction
  stays a hand edit through phases 5 to 9. Anyone arguing this dissolves on its own should check
  which phase it dissolves in.
- What would a partly filed Capture be called? A fourth state needs a name in `CONTEXT.md` before it
  needs code, and whether ADR 0020 tolerates the mark is downstream of naming it.
- Is the batch the wrong unit rather than the Capture? A Contradiction is about one subject. Whether
  edits about other subjects are implicated at all is a separate question from partial filing.

## Not to be answered by an agent

A resolution is appended here under `## Answer`, `Status:` is set to `resolved`, and a one-line gist
plus a link goes into `../map.md` under Decisions so far.

## Answer

**A Capture files in parts. The lines that land are written, the Capture stays in the queue, and the
Digest keeps asking about the part that did not land.** The fourth state is called **Part Drained**: some
of the Capture's lines are in Cards, the block carries no `filed::` mark, and it is still queued.

### What this session found, and why it changed the recommendation

The ticket was written to argue about delay. Two facts found here say the argument is about silence
instead.

**The delay is one Digest, not four phases.** The ticket quotes phase 5's spec putting `pick` out of
scope, so a Contradiction stayed a hand edit through phases 5 to 9. `pick` is built:
`memark/commands.py:231` and `memark/commands.py:1086`, and ADR 0010, Contradictions surface rather than
resolve, carries the amendment that says what the answer writes. So option A no longer buys months. It
buys about a day.

**Partial filing already ships, and the part that does not land is lost.** A Capture is drained when any
one of its groups writes, at `memark/vault/apply.py:1906`:

```python
drained.extend(source for edit in group for source in edit.sources)
```

So a Capture carrying one good edit and one refused edit has the good edit written, gets its `filed::`
mark, and the refused edit is gone. No run proposes it again and no Digest asks. `apply.py:19` says the
opposite, that "a refusal costs its own edit and leaves the Captures behind it undrained", and that is
only true when the refused edit is the Capture's only one. The docstring is written for that case and
reads as a general rule.

The two paths therefore disagree today, and neither one is what this ticket asked for:

| The Capture holds | What happens now |
| ----------------- | ---------------- |
| a good edit and a **refused** edit | the good edit lands, the block drains, the refused edit is dropped in silence |
| a good edit and a **`contradict`** edit | nothing lands, the block stays queued, the Digest asks |

### This is a hole in ticket 02's answer

[Ticket 02](02-may-the-reserved-card-hold-a-claim.md) rests its "dropping is not losing" argument on the
refused claim staying in the queue, so the Digest asks about it up to fourteen times per ADR 0037, an
unanswered question is parked never abandoned. That holds when the homeless claim is the Capture's only
edit. Put `the wifi is still causing issues` in a brain dump next to one fact that files, and the block
drains and nothing ever asks. The words stay findable per ADR 0028, conversation finds Cards by matching
words, which is the weaker half of 02's argument and the only half that survives.

So 02's answer is right about where a homeless claim goes and wrong about what keeps it alive. This
ticket is what closes that.

### The rule

One rule over both paths. **A Capture drains only when nothing derived from it is still owed an answer.**
An edit that was refused or held back leaves its Capture unfiled however many of its siblings wrote.

That makes the ask path strictly more generous than it is now and the refusal path strictly less silent.
`_held_back` at `memark/vault/apply.py:2403` gives the current reason for holding everything:

> An edit applied from a held-back Capture would drain it, and a drained Capture is one no Digest asks
> about again.

The premise is that writing a sibling forces the mark. It does not. The mark is a separate write, and
whether a Capture is in `drained` is code's choice at line 1906. Take the source out of `drained` when an
ask or a counted refusal names it, and the sibling lands with the question still open.

### Why this needs no new store

ADR 0020, state is derived from files the system already writes, refuses a new mark for "some of this
landed", and it does not need one. Part Drained is not a written state. It is the absence of `filed::`
plus the presence of a Card line carrying a `from::` link back to the block, and both halves are already
written for other reasons. ADR 0026, a Card line has a fixed grammar, puts a `from::` link on every agent
line, and `_cited` at `memark/vault/apply.py:2327` already reads them, for the compaction orphan check
ADR 0019 requires.

So Part Drained is a word for something the Vault can already be asked about, which is exactly the test
ADR 0020 sets.

### What changes

- `memark/vault/apply.py:1906`. A source named by an ask or by a counted refusal is left out of
  `drained`. This is the whole of the behaviour change.
- `memark/vault/apply.py:2403`. `_held_back`'s reason is rewritten. It holds the edit and no longer the
  Capture's siblings.
- `memark/vault/apply.py:19`. The refusal docstring stops claiming a general rule it does not have.
- `CONTEXT.md`. **Part Drained** is added beside Parked and Declined, and the Capture entry gains one
  sentence saying a Capture drains only when nothing derived from it is owed an answer.
- ADR 0010 gains one line. Its refusal is untouched, because nothing here lets the agent adjudicate a
  Contradiction. What changes is that the other facts in the message no longer wait on it.
- [Ticket 02](02-may-the-reserved-card-hold-a-claim.md) gains one line under what changed, saying the
  refused claim in a mixed Capture was a hole and naming this ticket as what closes it.
- Ticket 08 in this folder is opened. Writing a sibling and leaving the Capture queued means the next run
  proposes the landed edit again, and there is no duplicate guard on a Card extend to stop it. See below.

### The one thing this answer does not settle

A Part Drained Capture is read again next run, so the model proposes the landed fact a second time.
`_extend_card` at `memark/vault/apply.py:2752` has no duplicate check at all. The only one in the module
is for date files, at `memark/vault/apply.py:2193`, and it compares text exactly, so a reworded line gets
through. Ticket 04 in this folder measured what best effort on rewording comes to: `again-of::` filled 0
times out of 15.

The shape of the guard looks obvious, refuse an edit whose source Capture is already cited on the target
Card, and it is wrong as stated: a Capture with two facts about one subject, one written and one refused,
would have its second fact blocked by its own first line. That needs deciding rather than assuming, so it
is ticket 08 and not a note here.

Until ticket 08 lands, this decision is not buildable. It is the only thing between here and the code.

**Amended by [ticket 08](08-what-stops-a-part-drained-capture-landing-twice.md). This is buildable now.**
The second write is not refused. It is never proposed, because a Part Drained Capture is left out of the
filing scan until an answer lands on it. So `_extend_card` gains no guard, the false block above never
arises, and the change lands in `memark/run.py:488` beside the Proposed Alias filter rather than in
`apply.py`.

### Rejected

**Whole Capture or nothing, on both paths.** Make the refusal path behave like the ask path. It is the
cheaper change and it names nothing new. Rejected because it fixes a silent loss by making the delay
worse, and because it would undo behaviour that already ships and is already right. It also fails the
brain dump, which is the one input shape this system is built to take: one refused claim in five facts
would cost all five.

**A new `filed::` value for a partial fill.** Rejected per ADR 0020. Nothing needs it, because the
absence of the mark and the presence of a `from::` link say it already.

**Leave it and let the prompt stop proposing contradictions.** Not argued for here, and rejected for the
reason the map's standing preference gives: ADR 0003, hosted models over local inference, chose the cheap
tier for filing, so a prompt is worth improving and is never the rule.
