# 13 — The sources line's rule carries a count

**Type:** task

**Status:** completed

**Completed at:** 2026-09-17T10:50:57Z

**Blocked by:** none

**What to build:** ADR 0043's paragraph on the sources line covers a count, before issue 14 builds it.

## What is wrong with it

ADR 0043 made an aggregate question an ordinary one and then wrote a footnote rule that only fits a
question answered out of lines. `L173` asked `?how many people do I have notes on, and who are they?`,
named all fourteen, and ended with `From: no line of your notes I can name.` A count over Cards uses no
Card line: it uses the fact that a Card exists. So the most checkable answer of the whole pass ended
with a sentence saying it can name nothing.

## What to change

Amend the paragraph "The sources line names the Card lines the answer used, and code writes it" in
place. A count cites the whole Vault, and the list the answer already printed is the working. The
footnote says every Card was read and the list above is the count.

Record the rules, because each one is a refusal of something simpler:

- **The model declares the count and code writes the line.** One boolean beside `lines`. The model
  never writes the text, which keeps ADR 0028's rule that code writes this line and ADR 0032's shape,
  intent is read by a model and applied by code.
- **The boolean cannot be replaced by the condition that fires today.** `NO_SOURCES` prints whenever
  nothing survives the check, and that covers two opposite cases: a count with no line to name, and a
  model that named lines this Vault does not hold and had all of them dropped. Printing the count
  sentence on an empty list would put a claim of completeness under a hallucinated answer.
- **Code does not read the prose to decide this.** Inferring a count from a number and a list in the
  text is the box reading the model's own output back as a fact, which it does nowhere else.
- **A real line always beats the sentence.** The count sentence is the fallback where there is no line
  to name, never a replacement for citations that exist.
- **A malformed response prints no count sentence.** A response code could not parse is not one it
  trusts a single field from.
- **The sentence carries no number and appears only under a count.** `From: 14 Cards under people` was
  refused: a second footnote shape carrying a number is what the argument against `read all 412 Cards`
  was about.
- **Scope is the Lookup.** Recall is untouched, because `answering.what_was_read` already says what was
  read rather than what was used.

**No new ADR and no word in `CONTEXT.md`.** ADR 0043 already settled that a box reading everything
answers an aggregate question as an ordinary one, so there is no class left to name. What changed is
which sentence is printed.

## Done when

- [ ] ADR 0043's sources line paragraph carries the count case and the seven rules above.
- [ ] It records why the boolean cannot be inferred from an empty `lines` list.
- [ ] No new ADR, and nothing superseded.
