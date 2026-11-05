# 20 — ADR: a Capture is drained by coverage and not by writes alone

**Type:** task

**Status:** completed

**Completed at:** 2026-09-18T16:55:10Z

**Blocked by:** none

**Strand:** A, the filing path. First in the strand.

**What to build:** the written reason the coverage field exists, so the next person to read
`_drained` sees a decision rather than a second condition that looks like dead weight.

## Why the document goes first

The spec says each of this phase's three ADRs is written before the code rather than after. An ADR
amended after the code records what somebody built. Written before it, it is the reason they built
it. Phase 10.85's ticket 09 made the same call and it is the prior art.

## What to write

A new ADR, the next free number after 0043. Title it so the rule is in the title: a Capture is
drained by coverage and not by writes alone.

**The rule.** A Capture drains when two things are true. No edit naming it failed to write, which is
the condition `_drained` has today. And every word of it belongs to a `claim` piece some surviving
edit came from, or to a `skip` piece the model marked as carrying no claim.

**Why the partition is the model's.** Cite ADR 0014, the model proposes edits and code applies them.
How many claims a message holds is a proposal like any other. Record that code inferring it from the
Capture's length was refused: `mixer ka ring aana hai` is the seventh of ten errands and the
shortest, so any length rule skips exactly the claim that was lost on every run and on both tiers.

**Why code checks the pieces reassemble.** Without the check a model can hide a missed claim behind
pieces that do not fit the raw words.

**Why there is no code-only backstop.** Holding a Capture back because its words look long for one
edit is not kept as a floor under the coverage rule. Two rules both leaning careful hold back a long
single claim message the model covered correctly, and a person cannot then tell which rule held it.

**Note on ADR 0024**, filing is frequent and speaking is daily. The acknowledgement now carries
three marks per piece rather than one arrow per landing. This is a note, not an amendment: the
reason the acknowledgement exists is unchanged and only its shape moves.

**Name the thing that becomes redundant and stays.** `distillation.py` asks the model for a claim
about nobody on purpose, so the reserved Card refuses it and the refused edit holds the Capture
back. A `claim` piece with no surviving edit now does that job directly. The refusal still carries
what the claim was into the Digest, so removing it is a later question nobody has costed. Say so in
the ADR, or the next reader sees two rules that look like duplicates and deletes the wrong one.

## Done when

- [ ] The ADR exists at the next free number and carries the rule in its title.
- [ ] It cites ADR 0014 for why the partition is the model's to propose.
- [ ] It records both refusals: the length rule and the code-only backstop.
- [ ] It notes on ADR 0024 that the acknowledgement carries three marks per piece.
- [ ] It names the refused edit in `distillation.py` as redundant and kept.
- [ ] No existing ADR is superseded.
- [ ] It commits.
