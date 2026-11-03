# 05 — The answering prompt never says the answer is always prose

**Type:** defect

**Status:** completed

**Completed at:** 2026-09-19T21:14:05Z

**Blocked by:** 03 — A question is answered with nothing and the person is told nothing

**Reproduces:** `L242` 3 of 5 and `L82` 4 of 5 on `claude-sonnet-5`, and `L82` 1 of 1 on
`claude-opus-5`.

## The other half of ticket 03

Ticket 03 is what code does when the answering call comes back with no answer in it. This is why
the call comes back that way.

`SYSTEM` at `memark/answering.py:195` is a long and careful prompt. It says what may be answered
from, what must never be said about a window, what a bracketed standing means, how to write a
count, and that markdown is refused. It never says that the `answer` field always carries prose.

`answer_schema` at `answering.py:300` does not say it either. `answer` is `{"type": "string"}`
with no floor under it, and the docstring beside it explains why `lines`, `counted` and `covered`
may each come back empty. Read together, the schema teaches that an empty field is how this call
says it has nothing, and `answer` is typed exactly like the fields where that is true.

The closest the prompt comes is this, and it is about content rather than about the field:

    Where they do not answer the question, say so plainly rather than filling the gap

A model that has nothing appears to read the empty string as saying so plainly.

## Why both tiers failing settles the shape of the fix

`claude-opus-5` did it too. Per ADR 0003 a comparison run is a diagnostic and never a fix, and
both tiers failing means the prompt is wrong rather than too thin for the cheap one. The stronger
model is not the answer here and would not be even if it had passed.

## What the right answer looks like, and what it must not become

The reply for a Vault that holds nothing at all is already written, in code, at
`answering.py:896`, and no call is made for it. The reply for a question the notes do not answer
is the model's own, per the two conditions of ADR 0043 as amended, and per ADR 0046 it may carry
the miss line and a sources line naming nothing. Both of those are prose.

So the rule is narrow: there is no case where an empty `answer` is the right response, because
every case of having nothing to say already has words for it.

The trap is overcorrecting into a model that always writes something, which is the failure ADR
0046 was written against. A sentence telling the model to always answer would read as a sentence
telling it to always find something. What it needs to be told is about the field.

## Done when

- [ ] `SYSTEM` says the answer field always carries prose, and says that having nothing to say is
      itself written out in words rather than left blank.
- [ ] Nothing in that sentence can be read as pressure to find material. `L242` must still come
      back with the miss line and `From: no line of your notes I can name.`, per ADR 0046, and
      `L226` must still keep its peanut citation, which is phase 10.9's own guard against exactly
      this overcorrection.
- [ ] The rate is measured again on `L242:empty` and `L82:empty` after the change, on
      `claude-sonnet-5`, and both are in this ticket.
- [ ] `pytest`, `mypy`, `ruff check` and `ruff format --check` are green.

## Why it waits on ticket 03

Dropping the rate is not the same as closing the path. Ticket 03 makes a failed answer visible in
the chat, so a run that still comes back empty after this change can be seen rather than only
logged. Built the other way round, a good rate would hide the silent path again.

## The rate after the change

Measured with `python -m harness.live.repeat` on `claude-sonnet-5`, the tier that answered it.

| probe | before | after |
| ----- | ------ | ----- |
| `L242:empty` | 3 of 5 | **0 of 5** |
| `L82:empty` | 4 of 5 | **0 of 5** |

Every one of the ten runs came back `all 1 answers carried prose`.

The two guards against overcorrecting were run as well and both hold.

`L242:miss` and `L242:volunteered` are 0 of 3 each. The reply still opens with
`I have nothing on badminton coaching or club.` and still ends on
`From: no line of your notes I can name.`, so the model wrote prose without reaching for material
that is not there.

`L226` has no probe, so it was run through `python -m harness.live --only L226 L242`. Both passed,
88 checks, none vacuous. `L226` still ends on
`From: "she cannot take anything with peanuts, not even in the chutney" on Khushbu`, which is the
mother's line named for a question about the child, per ADR 0046, what a reply may carry after it
admits a gap.

One run of anything is not a finding and ten runs of nothing is not a proof. What this says is
that the shape the pass hit six times did not come back on the two rows it was measured on. Ticket
03 is what catches the one that does.
