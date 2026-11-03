# 29 — The answering prompt says what a reply may add after it admits a gap

**Type:** task

**Status:** completed

**Completed at:** 2026-09-18T19:39:11Z

**Blocked by:** 28

**Strand:** C, the answering prompt. Last in the strand.

**What to build:** asked about badminton coaching fees, which nothing in the Vault touches, the box
says it has nothing and stops. Asked whether a six year old has her mother's allergy, it says it has
nothing on the child and then names the line that belongs to her mother.

## What happens today

`L242` gets the miss line and then a paragraph about the SIP, the credit card bill and the Diwali
bonus, with a `From:` line under all three. The footnote is code's and it reads as evidence for the
paragraph above it, so the reply looks checked and is about a different question.

Nothing in `answering.py` says what a reply may add after it admits a gap.

## What to change

One rule in the answering prompt, written from ticket 28's ADR. After the reply says the Vault holds
nothing on a subject, it may add only material that answers the question that was asked, about a
different subject. Adding it is never required and the box never hunts for a near match.

**Say optional in the prompt, not just in the ADR.** A rule that permits volunteering without saying
it is optional is a rule a model will treat as a job.

**Where the rule goes matters.** Ticket 15 found the three schema fields asked for in three places
with the answering rules between them, and the never-written rule in the middle outranking the ask
for `lines`. That was fixed by putting the three in one block at the end. This rule is written with
that layout in hand rather than dropped wherever it fits.

**Nothing in code moves.** Per ticket 28's ADR and ADR 0002, this is a prompt rule. The sources line
gets no special case. `L242` ends with `From: no line of your notes I can name.`, which
`answering.py` already writes.

## No unit test

The rule is a meaning judgement and it has no unit seam. It is carried by the live pass, and the two
hard checks in ticket 30 are what grade it.

## Done when

- [ ] The answering prompt carries the rule, in the one block at the end with the schema asks.
- [ ] The prompt says adding is optional and says the box does not hunt for a near match.
- [ ] The prompt ties added material to the question that was asked, not to nearness of words.
- [ ] Nothing in `answering.py`'s code path changes and the sources line gets no special case.
- [ ] The prompt cites ticket 28's ADR.
- [ ] The unit suite is green.
- [ ] It commits.
