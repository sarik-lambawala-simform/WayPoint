# Phase 6.5 issues

One defect, from the phase 6 live-model pass. Filing ran on `claude-sonnet-5` and judgement on
`claude-opus-5` through the local Claude Code CLI, which is a tier above what a real box runs, so
every rate here was measured separately on the box's own models. See [../spec.md](../spec.md) for
what the evidence is worth and what it is not.

| # | Ticket | Status | Blocked by | Reproduces on the judgement tier |
| - | ------ | ------ | ---------- | -------------------------------- |
| 01 | [A Capture that names a thing comes back as an event](01-a-capture-that-names-a-thing-comes-back-as-an-event.md) | ready-for-agent | none | 4 of 5 on `claude-sonnet-5`, 3 of 3 on `claude-opus-5` |

Nothing blocks anything. There is one ticket and it changes one sentence of one prompt.

There is no grilling ticket. The finding needs no decision. The prompt already forbids what the
model does, so the work is to say it in a way that call's own tier can carry.

## What the pass proved works

A fix to the journal prompt could break any of it, and nobody catches that regression unless
somebody wrote down that it worked. All of this is from the 54-row pass.

**Misspellings reach the right Card.** `prya` resolved to `Priya (colleague)` through its `aka::`
row, and `presure valve` filed as the pressure valve. The Registry alias path carries a typo.

**The same message twice becomes one edit.** `L52` sent `call the garage` twice, a minute apart.
Filing proposed one Task, citing both blocks:

    - [ ] call the garage · from:: [[...#^69ba]] · from:: [[...#^cd48]]

**A retraction in the same batch is honoured.** `L50` sent a claim and then withdrew it. Filing
proposed nothing, and `L55` proves that was the retraction rather than a dropped claim. The same
claim alone files 5 of 5.

**Messages with nothing in them are held back, not dropped.** `L51` sent an emoji, `whatever` and
`nvm`. Nothing was proposed and all three blocks stayed in the file, held back.

**A Command typed wrong stays a thought.** `L48`'s day held `don 2`. It reached the model whole,
because a Command is told by what it is and not by what it looks like. `done 2` on the same day
would have come off. No `key:: value` field and no block id reached the model either.

**A self-contradicting ramble splits.** `L53`'s one message became three edits across `Kitchen`,
`Loft` and `Wife`, with the undecided part written as undecided.

**A Question stays a question.** `L48`'s day asked whether Priya had sorted the deposit, and the
entry reported it as a question asked rather than as a thing settled. It used reported speech and no
question mark, So `L48` is deliberately not registered against `flattened_the_question`. That probe
reads a wording.

**The phase 6 rules all held.** The pairing rule, a confirmed catch-up writing all ten days oldest
first, the seven-day bound stopping at seven, the seeding day stated rather than narrated, an
existing entry left byte for byte, the Canary's counts agreeing with disk, and the journal sending
nothing.

## What the earlier phases' rows showed, and who owns it

Two observations in the regression half are already somebody's.

`L7` filed one edit where the row wants two, and `L9` filed two claims of three. Both are the
question in
[../../memark-p09.6-decisions-only-you-can-make/issues/03-should-a-capture-be-filable-in-parts.md](../../memark-p09.6-decisions-only-you-can-make/issues/03-should-a-capture-be-filable-in-parts.md),
which is still `ready-for-human`. Not filed again here.

`L54` proposed no date for `week after next` or `in the spring`, and put both in the Task text
instead. That is the behaviour `proposed_no_date` already measures on `L5` and `L11`, and declining
a span is a fair reading of the prompt.

The production-model run of `L46` aimed a claim with no subject at the reserved Card, which is the
open question in
[../../memark-p09.6-decisions-only-you-can-make/issues/02-may-the-reserved-card-hold-a-claim.md](../../memark-p09.6-decisions-only-you-can-make/issues/02-may-the-reserved-card-hold-a-claim.md).
Not filed again here either.
