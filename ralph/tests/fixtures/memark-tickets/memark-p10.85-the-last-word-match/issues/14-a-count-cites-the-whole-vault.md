# 14 — A count cites the whole Vault

**Type:** task

**Status:** completed

**Completed at:** 2026-09-17T11:06:38Z

**Blocked by:** 12, 13

**What to build:** a counting answer stops ending with a sentence saying the box can name nothing.

## What happens today

Two counting questions, two opposite footnotes, and the difference is invisible to the person asking.

- `L173`, fourteen people, all fourteen listed, footnote `From: no line of your notes I can name.`
- `L174`, nine errands, all nine listed, footnote naming all nine Task lines on eight Cards.

Both counts match a hand count of the fixture. The difference is that an errand is a line and a person
is a file.

## What to change

**The answering call returns a boolean beside `lines`, true when the answer it just wrote is a count.**
Code reads the boolean and picks the sentence. The model never writes the text.

**Where the boolean is true and no named line survives the check**, code prints one fixed sentence
saying every Card was read and the list above is the count, in place of `NO_SOURCES`.

**Where the boolean is true and a named line does survive**, the normal `From: "..." on Card` line is
printed. `L174` keeps its nine citations.

**Where the response is malformed**, the flag is ignored and `NO_SOURCES` stands. A parse failure must
never produce a sentence claiming the whole Vault was read.

**Where there is no boolean**, `NO_SOURCES` is exactly as today.

**Recall is untouched.**

## The regression row

`L173` at `harness/live/scenarios_p10_8_india.py:226` is the row that found this, and its hard check is
edited to assert the new footnote. That is not a row weakened to make a later phase pass. The expected
output changed because the rule changed, and leaving `L173` asserting `NO_SOURCES` would pin the wrong
line in place as regression coverage. `L174` keeps its check unchanged and becomes the guard on the
rule that a real line wins.

## The seam

Issue 12 owns the shape of `answer_schema()` and the miss line. This issue adds its boolean to what
issue 12 leaves and touches no field of issue 12's.

## Done when

- [ ] The answering schema carries a count boolean beside `lines`, and the prompt says when to set it.
- [ ] A count with no surviving line prints the count sentence and not `NO_SOURCES`.
- [ ] A count with a surviving named line prints the ordinary sources line.
- [ ] A malformed response prints `NO_SOURCES` and never the count sentence.
- [ ] An answer with no boolean is unchanged.
- [ ] Recall's `what_was_read` is unchanged.
- [ ] Code reads the boolean and never the prose.
- [ ] `L173`'s hard check asserts the new footnote and `L174`'s is unchanged.
- [ ] Unit tests cover all five branches.
- [ ] `pytest`, `mypy`, `ruff check` and `ruff format --check` are green.
