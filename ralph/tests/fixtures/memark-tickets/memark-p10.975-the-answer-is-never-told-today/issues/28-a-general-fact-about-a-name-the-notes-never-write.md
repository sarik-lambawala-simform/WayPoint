# 28. A general fact about a name the notes never write

**Type:** task

**Status:** completed

**Blocked by:** 27

**What to build:** `what is the plot of inception?` gets the plot. A name the notes never write may
still get a general fact from what the model knows. A fact about a person the notes never name is
still refused.

## What happens today

Seen by hand on 2026-10-08 in the harness, chat messages 1004 and 1005, after ticket 27 landed.

- `what is the plot of inception?` got `I have nothing on Inception.`, then more Nolan picks, and no
  plot.

The Intent Read named `Inception` as a subject. No Card and no Capture writes it, so code put it
under `Words your notes never write`. The absent-name rule in `SYSTEM` says every name there "is out
of your answer: do not write the name, and write no sentence about it of any kind", and that it
"comes before every other rule". Ticket 27's exception only let a suggestion through "without
writing that name". The rule is there to stop the box inventing what a stranger said or did. It
cannot tell a stranger from a film everyone knows.

## The rule

Decided with the person on 2026-10-08. It extends ADR 0062, advice may use what the model knows,
to the absent-name rule.

- **A general fact about an absent name may come from the model.** Where the question asks a
  general fact about the name itself, such as the plot of a film, what a word means or where a
  place is, the model answers from what it knows, may write the name, and sets `suggested`.
- **A fact about a person or about the person's life stays refused.** "What did Rahul say", "when
  is Rahul's birthday" and "did Dev pay me back" are unchanged. The name stays out of the answer.
- **The miss line stays.** `I have nothing on Inception.` is true, so code still writes it. A
  general fact is not covering the name, so it puts nothing under `covered`.
- **The footer wording fits a fact as well as a pick.** `The suggestions are mine, not from your
  notes.` reads wrong under a plot. It becomes `Anything not from your notes is from what I know.`

## What to change

- `SYSTEM` in `memark/answering.py`: the absent-name rule and the `covered` ask.
- `SUGGESTED` in `memark/answering.py`: the new wording.
- ADR 0062: an amendment section for this rule and the wording.
- Live rows from `L410`: the Inception question, a Hinglish twin, and a guard where an absent person
  gets no invented fact and no suggestion line.

## Done when

- [x] The prompt carries the rule, and a unit test asserts both halves.
- [x] `SUGGESTED` has the new wording.
- [x] ADR 0062 has the amendment.
- [x] The new rows run under `MEMARK_PASS_MODE=auto python -m harness.live`.
- [x] The unit suite, `mypy`, `ruff check` and `ruff format --check` are green.
