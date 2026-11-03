# 01 — A claim about nobody is dropped before code can refuse it

**What to build:** the filing prompt stops telling the model to say nothing about a claim that
belongs to nobody, so the refusal that holds the Capture back can happen.

**Status:** blocked

**Reproduces:** 5 of 5 on `claude-haiku-4-5`, the tier ADR 0003 puts filing on. 1 of 1 on
`claude-opus-5`. Both tiers fail, so the prompt is wrong rather than thin.

## What happens

`L143` sends one message with five thoughts in it:

> stuck at the signal, dumping before i forget: mummy's bp tablet gets over by friday, nikhil wants
> the sprint board cleaned up before the demo, bhavesh is asking for the rent cheque by the fifth,
> the packers are coming sunday morning, and petrol has crossed a hundred and ten a litre again

Four name subjects the Registry carries and file. The fifth names nobody. The model proposes no edit
for it, so nothing about it is refused and nothing about it is asked. `_drained` sees every proposed
edit written, marks the block `filed::`, and the petrol line is gone. No Digest will ever raise it.

That is the problem statement of phase 10.7, word for word, still true after the phase shipped.

## Why

Two rules that contradict each other.

`memark/distillation.py:375` tells the model a null `subject` is allowed on a Task and on a dated
line only, then `memark/distillation.py:377` draws the conclusion:

> A claim about nobody has no Card to go in at all, so code refuses it and it writes nothing.
> `found it, it's on the fridge` is one: it names nobody, it is nothing to do and it falls on no
> day, so propose no edit for it rather than one with a null subject.

`memark/vault/apply.py:1977` builds `owed` from edits that were proposed and did not write. A
thought the model was told not to propose contributes no edit, so it contributes nothing to `owed`.

The prompt line is older than the drain rule and was true when it was written: before this phase the
refusal really did nothing but waste a line. This phase made the refusal the thing that keeps the
Capture queued, and nothing went back to the prompt that says not to trigger it.

## Not a decision

Nothing here reopens a decision. Phase 10.7's spec already says what should happen: "A refused claim
is not a lost claim. It stays unfiled, so the Digest asks about it up to fourteen times per ADR 0037
before it Parks." This ticket makes that sentence true. The reserved Card still takes a Task and a
date and nothing else, per ticket 02 of the phase 9.6 map, and no claim is written anywhere.

Watch the cost of the other direction. A prompt that asks for every unplaceable scrap to come back
as a null-subject claim would hold a Capture back on filler too, and `L149`'s "the traffic near
iskcon was mad today" is filler. The durability test that bounds the `Me` Card is the same question
and is the place to say so: a claim worth reading in a month and belonging to nobody is the one to
propose. A passing remark is not.

## Done when

- [ ] The filing prompt no longer tells the model to propose nothing for a claim that belongs to
      nobody, and says instead to propose it with a null `subject` so the refusal can happen.
- [ ] The prompt says which claims that covers, so filler is not proposed with it. The durability
      test already in the prompt for the `Me` Card is the wording to reuse.
- [ ] `memark/distillation.py`'s module docstring says why the null-subject claim is proposed on
      purpose, so the next reader does not take it back out as a wasted call.
- [ ] A unit test in `tests/` proves a batch holding one filable claim and one null-subject claim
      writes the first, refuses the second, and leaves the block with no `filed::` mark.
- [ ] `python -m harness.live.repeat L143 --runs 5` reports 0 of 5 on `claude-haiku-4-5`.
- [ ] `L121`, phase 10.7's own row for the same story, still passes and its probe still reads good.
- [ ] `pytest`, `mypy`, `ruff check` and `ruff format --check` are green.
