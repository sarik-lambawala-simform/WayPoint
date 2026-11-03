# 28 — ADR: what a reply may carry after it admits a gap

**Type:** task

**Status:** completed

**Completed at:** 2026-09-18T19:29:23Z

**Blocked by:** none

**Strand:** C, the answering prompt. First in the strand.

**What to build:** the written rule for what a reply may add after it says the Vault holds nothing,
so a later session does not fix the badminton reply by banning volunteering outright.

## Why the document goes first

Same reason as tickets 20 and 24. The prompt in ticket 29 is written against an authority rather
than ahead of one, and this rule is unusually easy to get wrong in the safe direction.

## What to write

A new ADR, the next free number. Title it so the rule is in the title: what a reply may carry after
it admits a gap.

**The rule.** After a reply says the Vault holds nothing on a subject, it may add only material that
answers the question that was asked, about a different subject. Adding it is never required. What
survives is cited in the sources line like any other answer.

**The tie is the question and never the words.** `L226` and `L242` look alike and are not. `L226`
answered the question that was asked, a peanut allergy, about a person nobody named. `L242` answered
a different question, household money, because `fees` sounds like a money word. So the rule names
the question and says nothing about nearness, which is the thing that let `fees` reach `money`.

**Adding is optional and the box never hunts.** A miss line and silence is a complete and correct
reply. No instruction to look for a near match, no second pass over other subjects, no expectation
that something is always found. A rule that permits volunteering without saying it is optional is a
rule a model will treat as a job, and `claude-opus-5` already volunteers five lines where
`claude-sonnet-5` volunteers three.

**What survives is cited.** No special case in the sources line. Stripping proof off the best reply
in the pass would be the wrong trade. ADR 0043 refused dropping the sources line because a reply
with no footnote reads as more sure of itself rather than less, and that reason holds here
unchanged.

**Why code enforces nothing.** Cite ADR 0002, deterministic code selects what the model sees. One
code check was looked for and it fails. The obvious shape, that a reply covering no subject may cite
no line, kills `L242` and kills `L226` with it, because Aarohi was the only subject the message
named and she was missed too. Whether added material answers the question asked is a meaning
judgement, and ADR 0002 is about selection rather than about meaning.

**ADR 0043 is cited and not amended.** It is about what the model reads and does not own this.

**Record the two refusals.** A miss line and nothing else was refused because it throws away `L226`.
Anything under a separate heading was refused because it keeps the noise and only relabels it. A
person still reads four lines of money talk to learn nothing.

**Record what this rule does not cover.** A reply that wanders while it is answering. Phase 10.8 saw
`?what suffers if we are out of town for a few days` come back with the tulsi, the spare key, the
SIP and the credit card bill. No miss line and nothing dishonest, just wider than the question. Here
the box has said it holds nothing, so everything after is by its own account not an answer. There it
is answering, and whether a wider answer is helpful or noisy is a judgement nobody has settled.

## Done when

- [ ] The ADR exists at the next free number and carries the rule in its title.
- [ ] It states that adding is optional and that the box never hunts for a near match.
- [ ] It says the tie is the question and never the nearness of the words.
- [ ] It cites ADR 0002 for why this is a prompt rule and code enforces nothing.
- [ ] It cites ADR 0043 and does not amend it.
- [ ] It records both refusals and the case it does not cover.
- [ ] No ADR is superseded.
- [ ] It commits.
