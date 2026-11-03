# 12 — The answering call says what it covered

**Type:** task

**Status:** completed

**Completed at:** 2026-09-17T10:44:31Z

**Blocked by:** 11

**What to build:** the miss line fires only where the answer really covered nothing, so a reply stops
opening with a sentence that contradicts the paragraph under it.

## What happens today

Six rows of thirty one. `?what did the doctor say about my sugar` opened with `I have nothing on my
sugar.` and then gave the fasting report at 118 off the Health Card.
[Ticket 01](01-a-common-noun-is-not-a-subject.md) has the six, and its prompt fix is shipped, which
takes out the common nouns. This issue is the half a prompt cannot fix:

> `?what did dr shah say about the crown` on a Vault whose Card says `the dentist wants to redo the
> cap`. `Dr Shah` is a real name and `crown` is a real thing the notes hold under another word. The
> line fires on `crown` and the answer below it describes the cap.

## What to change

**Ask the model what it covered.** Code already holds the subjects from the Intent Read, per ADR 0032,
intent is read by a model and applied by code. Code puts that list in the prompt and the answering call
hands back the ones it answered about, in one new field beside `lines`. The question is positive, so
nothing is asked of the model about absence.

**Code prints the miss line only when both are true.** The model did not report covering the subject,
and no word of it is written anywhere in the Vault. `_nothing_on` at `memark/lookup.py:680` is
untouched and keeps computing the second condition.

That walks the two measured cases. `crown` is absent from the Vault and covered by the answer, so no
line. `Falguni` is absent and covered by nothing, so the line fires, and it fires from code rather than
from the model's willingness to mention it.

**Read the new field the way `_lines_named` reads `lines`.** Anything not on code's own subject list is
dropped.

**A missing or malformed field means the model covered nothing.** Every absent subject then gets a
line, which is today's behaviour. The direction is chosen and not conceded: a warning too many is a
nuisance a person can see, and a warning too few is the `L182` stranger case failing in silence.

**The prompt block at `memark/answering.py:650` stays and changes what it claims.** Its heading
`## Already written above your answer` becomes false, because code no longer knows the line before the
call. It is not deleted: the word check still runs before the call, and showing the model which words
the Vault never writes is what keeps it from inventing a `Falguni`. Only the claim changes, from a line
already printed to a fact about the notes.

## What this does not touch

**Recall.** `nothing_on` is built in one place, `memark/lookup.py:416`, on the Lookup path. A recalled
window never had a miss line and gains none.

**The empty Vault path.** `found_nothing` at `memark/answering.py:667` prints the miss line instead of
an answer and makes no call, so there is no coverage report to read. A Vault that reached nothing
covered nothing.

**The cheap tier.** The answering call runs on the strong tier, so the new field carries none of
ticket 01's cheap tier risk.

## The seam

This issue owns `memark/answering.py`'s reply assembly and the shape of `answer_schema()`. Issue 14
adds its own boolean to the schema this issue leaves and touches no field of this one. Issue 10 owns
`memark/handler.py` and what reaches the call, and does not edit a footnote.

## Done when

- [ ] The answering schema carries a coverage field beside `lines`, and the prompt asks for the
      subjects the answer covered.
- [ ] Code prints the miss line only where the model did not report covering a subject and no word of
      it is written in the Vault.
- [ ] A coverage entry that is not on code's own subject list is dropped.
- [ ] A missing or malformed field gives every absent subject a line.
- [ ] `memark/answering.py:650`'s block is kept and its heading states a fact about the notes.
- [ ] `lookup._nothing_on` is unchanged.
- [ ] Unit tests cover the `crown` case, the `Falguni` case, a malformed field, and Recall being
      untouched.
- [ ] `python -m harness.live.repeat L168:miss L174:miss --runs 5` reproduces 0 of 5 on
      `claude-haiku-4-5`.
- [ ] `python -m harness.live.repeat L182 --runs 5` still names `Falguni`.
- [ ] No earlier phase's scenarios were edited.
- [ ] `pytest`, `mypy`, `ruff check` and `ruff format --check` are green.
