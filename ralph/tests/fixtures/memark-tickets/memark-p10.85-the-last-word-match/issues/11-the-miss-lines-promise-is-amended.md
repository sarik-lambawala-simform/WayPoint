# 11 — The miss line's promise is amended

**Type:** task

**Status:** completed

**Completed at:** 2026-09-17T10:10:49Z

**Blocked by:** none

**What to build:** ADR 0043's paragraph about the miss line says what the line now promises, before
issue 12 builds it.

## What is wrong with it

ADR 0043's paragraph reads "The miss line keeps its check and loses its index". Decision 9 of phase
10.8 says the same. [Ticket 02](02-should-the-miss-line-have-survived-the-picker.md) found that wrong
and the pass measured it: six rows of thirty one opened with `I have nothing on X` and then answered
correctly about X.

ADR 0043 deleted the picker everywhere except this paragraph and missed it. The line promised "no
Card and no Capture writes this word" and a person read it as "the answer below has nothing on this".
Those were one fact while a picker chose the material. For a name they still are, because a person has
one name. For a common noun they came apart, because the thing has other words.

## What to change

Amend the paragraph in place. The line now promises **coverage**: the answer below found nothing on
this. Two conditions, both needed before code prints it:

1. The answering call did not report covering the subject.
2. No word of the subject is written anywhere in the Vault.

Record why the shape is this and not another. The model is asked what it **covered** and never what it
missed, because a model asked to notice its own silence is a model asked to be sure about what it does
not hold. The question is positive, so nothing is asked of the model about absence.
`lookup._nothing_on` is untouched and becomes the second condition rather than the trigger.

**ADR 0028's rule that code writes this line and the model never does is kept whole.** It is not
amended and not bent. The shape is the one ADR 0043 already gave the sources line: the model names,
code confirms against the Vault, code writes the text.

**Record one sentence as dead.** "The model is shown the material and never the gap" was true of a
picker and is false of a box that reads everything: the material is now the whole Vault, so absence
from the material is absence from the Vault. The rule survives on its second reason alone, which is
that a model asked about its own silence answers confidently.

**No new ADR.** A new one would file the correction away from the decision it corrects. This completes
ADR 0043's rule rather than reversing it.

**`CONTEXT.md` gains no word.** What changed is when a line is printed, not what anything is called.

## Done when

- [ ] ADR 0043's miss line paragraph states the two conditions and the coverage promise.
- [ ] It records that the model is asked what it covered and never what it missed, with the reason.
- [ ] It records that ADR 0028's rule is kept whole.
- [ ] It records the dead half of `memark/answering.py:85`.
- [ ] No new ADR, and nothing superseded.
