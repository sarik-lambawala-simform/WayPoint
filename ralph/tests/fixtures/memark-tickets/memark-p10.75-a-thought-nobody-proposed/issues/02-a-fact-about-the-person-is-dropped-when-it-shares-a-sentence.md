# 02 — A fact about the person is dropped when it shares a sentence

**What to build:** the filing prompt carries the `Me` routing rule well enough that the cheap tier
applies it to half a sentence, not only to a whole one.

**Status:** completed

**Completed at:** 2026-09-15T10:39:15Z

**Blocked by:** none.

**Reproduces:** 3 of 5 on `claude-haiku-4-5`, the tier ADR 0003 puts filing on. 0 of 1 on
`claude-opus-5`. Only the cheap tier fails, so the prompt is too thin to carry it.

## What happens

`L158` sends one sentence with two health facts in it, one about the person and one about their
mother:

> my sugar came at 105 fasting which is fine, mummy's is still on the higher side and dr mehta wants
> it rechecked

Mummy's half files. The person's half is never proposed. Nothing is owed an answer, the block takes
its `filed::` mark, and a reading the person typed out is gone.

`L155` is the same shape with no shared vocabulary, "i have stopped taking sugar in my tea and mummy
has started walking in the evening", and it splits correctly onto two Cards. So the rule is being
applied. What breaks it is two claims that sound alike: same topic, same words, only the pronoun
apart. The model reads them as one claim about Mummy and files that.

## Why

`memark/distillation.py:381` states the rule once:

> Write `subject` as `Me` for a claim that is about them and names nobody else.

Read strictly, the person's half of `L158` qualifies: it is about them and it names nobody else, and
the fact that Mummy appears later in the sentence does not change that. The prompt never says the
test is per claim rather than per message, and it gives no example of one sentence splitting into
two. The stronger model infers it. The cheap tier does not, 3 times in 5.

This is the same failure mode as ticket 01, one step along: a thought the model never proposes is a
thought the drain rule cannot protect. Fixing ticket 01 does not fix this one, because a dropped
claim about the person produces no null-subject edit either.

## Not a decision

Nothing here reopens a decision. Ticket 05 of the phase 9.6 map settled that the `Me` Card is an
ordinary `person` Card with a reserved name and no aliases, and the routing rule is already written.
This is the prompt failing to carry a rule that already exists, on the tier it has to run on.

Per ADR 0003 the cheap tier is what filing runs on. `claude-opus-5` getting it right is a diagnostic
saying the rule is stateable, not a reason to move the tier.

## Done when

- [ ] The filing prompt says the `Me` test is applied per claim and not per message, and shows one
      sentence splitting into an edit on `Me` and an edit on somebody else.
- [ ] The example uses two claims that share their vocabulary, because two that do not already work.
- [ ] `python -m harness.live.repeat L158 --runs 5` reports 0 of 5 on `claude-haiku-4-5`.
- [ ] `python -m harness.live.repeat L155 --runs 5` still reports 0 of 5, so the split that already
      worked was not traded for this one.
- [ ] `L151` and `L152` still keep `remind me` and `mujhe yaad dila dena` off the `Me` Card, and
      `L153` still keeps a passing mood off it. A prompt that reaches for `Me` harder is the change
      most likely to break all three.
- [ ] `pytest`, `mypy`, `ruff check` and `ruff format --check` are green.
