# 06 — What does a count cite?

**Type:** grilling

**Status:** completed

**Blocked by:** none

## Question

`L173` asked `?how many people do I have notes on, and who are they?` and got the right answer:
fourteen, with all fourteen named, which matches a hand count of the fixture. Its last line was:

> From: no line of your notes I can name.

That is `answering.NO_SOURCES`, and it is correct by every rule in play. Decision 6 of phase 10.8
says the sources line names the Card lines the answer used. A count over Cards uses no Card line: it
uses the fact that a Card exists. ADR 0043 refused dropping the line, for a good reason, that an
answer with no sources line reads as more confident rather than less.

So the most checkable answer the box produced in the whole pass ends with a sentence saying it can
name nothing. `L174`, counting errands, ends with all nine Task lines named, because those are
lines. Two counting questions, two opposite footnotes, and the difference is invisible to the person
asking.

**The question is what a count cites.** Options, with what each costs:

**Nothing, as today.** The rule stays one rule. The price is that `NO_SOURCES` now appears under
answers that are more checkable than most, and it was written for the opposite case, which is a
model that named lines the Vault does not have.

**The Cards counted, by name.** `From: 14 Cards under people` or the names themselves. Truthful and
checkable, and it is a second shape for the line, which decision 6 spent its argument avoiding:
`read all 412 Cards` was rejected exactly because it says nothing.

**The list in the answer is the citation.** A counting answer already prints the things it counted,
one to a line, so the working is shown above the footnote rather than in it. Then the honest line
says there is nothing further to cite, which is roughly what it says today but phrased as a fact
about counting rather than as a confession.

This needs a person because it is decision 6 being asked to cover a case it did not consider, and
guessing at it in code would put a second footnote shape in the box without an argument behind it.

## What the pass saw

`L173` and `L175` both counted correctly and both are worth reading beside each other:

- `L173`, fourteen people, all fourteen listed, footnote `From: no line of your notes I can name.`
- `L174`, nine errands, all nine listed, footnote naming all nine Task lines on eight Cards.

Counting itself is not in question. Both counts match a hand count of the fixture.

## Where it goes

[../memark-p09.6-decisions-only-you-can-make/map.md](../memark-p09.6-decisions-only-you-can-make/map.md),
ticket 07, which is where the sources line's shape was argued.

## Answer

A count cites the whole Vault, and the list it already printed is the working. The footnote stops
saying it can name nothing and says what is true instead: every Card was read, and the list above is
the count. Nothing about the answer itself changes. Only the last line does.

The option the ticket costed as "the Cards counted, by name" is refused. `From: 14 Cards under
people` is a second footnote shape carrying a number, which is what decision 6 of phase 10.8 spent
its argument avoiding when it rejected `read all 412 Cards`. The sentence adopted here carries no
number and appears only under a count, so it is not the same words under every answer.

### The rules

**The model declares the count and code writes the line.** The answering call returns a boolean
beside `lines`, true when the answer it just wrote is a count. Code reads the boolean and picks the
sentence. The model never writes the text, which keeps ADR 0028's rule that code writes this line
and keeps ADR 0032's shape, intent is read by a model and applied by code.

The boolean is needed because the condition that fires today cannot be reused. `NO_SOURCES` prints
whenever nothing survives the check, and that covers two opposite cases: a count, which had no line
to name, and a model that named lines this Vault does not hold and had all of them dropped. Printing
the count sentence on an empty list would put `From: every Card in your notes` under a hallucinated
answer, turning the one warning the reader has into a claim of completeness. The boolean separates
them, and an answer with no boolean keeps `NO_SOURCES` exactly as today.

Code does not read the prose to decide this. Inferring a count from a number and a list in the text
is the box reading the model's own output back as a fact, which it does nowhere else.

**A real line always beats the sentence.** Where the boolean is true and a named line survives the
check, the normal `From: "..." on Card` line is printed. `L174` counted nine open errands and named
all nine Task lines, because an errand is a line and a person is a file. That answer keeps its nine
citations. The count sentence is what a count falls back to when there is no line to name, never a
replacement for citations that exist.

**A malformed response prints no count sentence.** Decision 6 already rules that a broken `lines`
costs the footnote and never the answer, and the reply goes out with `NO_SOURCES` under it. The
boolean inherits that: a response the box could not parse is not one it trusts a single field from,
so the flag is ignored and the old warning stands. A parse failure must never be able to produce a
sentence claiming the whole Vault was read.

**Scope is the Lookup.** Recall is untouched. `answering.what_was_read` already says what was read
rather than what was used, per ADR 0043 as amended, because a window is read whole and nothing in it
is cut. That is the shape this ticket is giving the Lookup's count, so there is nothing to change on
the Recall side.

**`CONTEXT.md`.** No word changes. ADR 0043 already settled that a box reading everything answers an
aggregate question as an ordinary one, so there is no class left to name. What changed is which
sentence is printed, not what anything is called.

### The regression row

`L173` at `harness/live/scenarios_p10_8_india.py` is the row that found this, and its hard check is
edited to assert the new footnote. That is not a row weakened to make a later phase pass, which the
bundle forbids. The expected output changed because the rule changed, and leaving `L173` asserting
`NO_SOURCES` would pin the wrong line in place as regression coverage. `L174`, the errands count,
keeps its check unchanged and becomes the guard on the rule above that a real line wins.

### Where it is written down

ADR 0043's paragraph "The sources line names the Card lines the answer used, and code writes it" is
amended in place to carry the count case. This is not a new decision and it overturns nothing. ADR
0043 made an aggregate question ordinary and then wrote a footnote rule that only fits a question
answered out of lines. The amendment completes it. A new ADR would file the correction away from the
decision it corrects, and decision 6 of phase 10.8 would still read as whole when it is not.

The amendment, the code and the `L173` check are all work for
[ticket 08](08-turn-this-phases-answers-into-a-spec.md), which consolidates every answer in this
phase into one spec.
