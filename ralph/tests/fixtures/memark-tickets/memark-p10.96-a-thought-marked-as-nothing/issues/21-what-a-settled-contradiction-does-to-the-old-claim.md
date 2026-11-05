# 21. What does a settled Contradiction do to the claim it disagreed with?

Type: grilling
Status: completed
Blocked by: none

## What happened

A harness session on 2026-09-25 sent two messages:

1. `I work at Simform. Mehul is my manager there. ...`, which wrote `work at Simform` under
   `## Facts` in `people/me.md`.
2. `I now work at Google`.

The filing model proposed a `contradict` on `Me`, text `work at Google`. The write path held it
back, as ADR 0010 (a contradiction is asked about, never settled by the agent) says it must.

That exposed two gaps.

**Gap 1, fixed on this branch.** The question went to the log alone. The Digest printed
`I now work at Google` under `Not filed`, and nothing said a question was waiting. The filing run
now writes the question onto the block as `question::` and the Digest leads the ask with it. ADR
0010 has a new amendment, "the question reaches the Digest", that records this.

**Gap 2, this ticket.** The answer does not do what the person means. The only reply is
`pick N Me`. Per ADR 0010's amendment "what the answer writes", that puts `subject:: Me` on the
Capture, and the next filing run writes `work at Google` as a new line. Nothing touches
`work at Simform`. The Card then says both, with no mark on either.

## The question

When a person settles a Contradiction, what happens to the claim the new one disagreed with?

## What to argue through

- **This is the Superseding gap, with the expensive half already paid.** ADR 0005 (human claims
  are immutable to the agent) keeps Superseding out of v1. Its reason: a mark needs a verb, the
  verb needs a Digest item, and the item needs the agent to have noticed the correction, which is
  the problem ADR 0025 (a name correction may propose a merge) names. A Contradiction is the agent
  noticing. The Digest item now exists. What is missing is the verb and what it writes. Does that
  change the cost argument in ADR 0005?
- **Which line is the old one.** The `contradict` edit names a subject and new text. It does not
  name the Card line it disagrees with. Code cannot point at `work at Simform` today. Does the
  edit schema gain a field for that line, or does the person name it, or does nobody?
- **What the old line becomes.** Removed, kept with a mark, or moved. ADR 0005 forbids the agent
  rewriting a Pinned Claim. ADR 0007 (decay applies to attention, not to claims) lets it compact
  what it wrote itself. `work at Simform` is an agent-written line off a human Capture, so which
  rule covers it?
- **The Capture behind the old line.** If only the Card line changes, the Capture still says
  `I work at Simform`, and ADR 0043 (the model reads the whole Vault) puts it in front of every
  later call. Does settling also mark that Capture as no longer believed?
- **The reply grammar.** `pick N <name>` answers "which row was meant". For a Contradiction the
  subject was never in doubt. The question is "which is true now". Is `pick` the right verb here,
  or does the answer name the claim (`6 Google`, or a sentence the Intent Read reads)? What does
  the Digest line tell the person to type?
- **"Both are true."** Some contradictions are not replacements: a second job, a second address.
  The answer needs a way to say "keep both".

## Decisions this touches

- ADR 0005, human claims are immutable to the agent, and its Superseding gap.
- ADR 0007, decay applies to attention, not to claims. It lets the agent compact its own lines.
- ADR 0010, contradictions surface rather than resolve, and its three amendments.
- ADR 0015, ambiguous subjects are asked about, never guessed. `pick` is shared with it.
- ADR 0026, the line grammar and its closed list of fields.
- ADR 0043, the model reads the whole Vault.

## Done when

The answer is written under `## Answer` here. Any new word is in `CONTEXT.md`, and the decision is
an ADR or an amendment to ADR 0010, per `docs/agents/domain.md`. If it needs building, the build
is its own ticket or phase.

## Answer

Settled in a grilling session on 2026-09-25, with `/mattpocock-skills:domain-modeling`. Written up
as ADR 0049, a settled Contradiction dates the old claim. ADR 0005, ADR 0010 and ADR 0026 each carry
an amendment that points to it. `CONTEXT.md` has new entries for Superseding and Contradiction. The
build is [22-a-settled-contradiction-dates-the-old-claim.md](22-a-settled-contradiction-dates-the-old-claim.md).

- **It is Superseding, for this path only.** A Contradiction is the agent noticing, so the
  expensive part of ADR 0005's cost is paid. A correction the agent never noticed stays out.
- **Superseding marks a claim, not a Capture.** One Capture can hold several claims, and deleting a
  line breaks ADR 0019. The old line stays and gains `until:: YYYY-MM-DD`. The Capture gets no mark.
- **Three answers.** `new N` writes the new line and dates the old one. `old N` marks the Capture
  `filed:: declined`, like `no N`. `both N` writes the new line and leaves the old one alone.
- **The model copies the old line's exact text** into a new edit field. Code looks for that line on
  the subject's Card. When it finds it, the question shows both claims. When it does not, `new N`
  writes the new line, dates nothing, and the reply says so.
- **The question shows the whole old line**, so a compacted line with more than one claim is never
  dated by surprise. The person answers `both N` and fixes it by hand.
- **Only code writes `until::`.** A model edit that drops it or folds a dated line is refused.
- **`new N` may date a Pinned Claim**, because it is a Command, like `done N` on a Pinned Task.
- **`pick` stops settling a which-is-true question.** It stays for a `contradict` about a bare
  pronoun, which asks who was meant.
- **The decision is its own ADR.** The build is ticket 22 in this folder, at the person's request.
