# 04 — A fact is dropped and its Capture drains anyway

**Type:** grilling

**Status:** completed

The defect is not in doubt and the fix was. Two ways of catching it are written below and neither
was obviously right, so this carried no `**Status:**` line and the ticket runner skipped it. A
runner handed an implementation ticket with two fixes in it picks one and nobody reviews the choice.
It is answered now and the answer is at the bottom. `resolved` is not a role the runner picks up, so
it still skips this file: the work the answer asks for is ticket 10's spec to break out.

**Reproduces:** `L211` 3 of 5 on `claude-haiku-4-5` and 0 of 1 on `claude-opus-5`. `L223` 3 of 5 on
`claude-haiku-4-5` and 1 of 1 on `claude-opus-5`.

**The two rows have different diagnoses and that is the most useful thing the rates say.** `L211` is
two clauses and only the cheap tier loses one, so the prompt is too thin to carry it. `L223` is ten
errands and both tiers lose the same one, so the prompt is wrong. A fix aimed at the cheap tier
alone closes half of this ticket. Per ADR 0003 the cheap tier is what filing runs on either way, so
the stronger model is the diagnostic and never the fix.

## Question

A message whose parts were not all proposed drains anyway, so the part nobody filed is lost with
nothing left to raise it. What should code check, given it cannot know how many claims a message
held?

## What happens

Two rows lost a fact and then drained, which is the pair that loses words for good.

`L211` sent `paid ramaben 8k by gpay for this month, next month se 8500 karna hai`. Two facts: a
payment made, and a new rate from next month. Only the rate was proposed. The Capture took its
`filed::` mark on the strength of it, so the payment is written nowhere, cited nowhere, and no
Digest will ever ask about it.

`L223` sent ten errands in one message before a drive. Eight were proposed. `mixer ka ring aana hai`
was not, and the block drained. It is the same errand every time it is lost, on both tiers, which
says the position in the message is doing the work rather than the words: it is the seventh of ten
and the shortest.

The reply names what landed, so neither loss is visible in the chat. The person sees seven arrows
under a ten part message and has no reason to count them.

## Why

This is not the drain rule failing. The drain rule is exactly right about the case it covers, and
`memark/vault/apply.py:1987` says so: a Capture is held back the moment an edit naming it did not
write. A claim the model never proposed derives no edit, so nothing is owed, so the Capture drains.
`memark/distillation.py:44` already names this as the failure mode it cannot catch:

> A claim the model never proposes is a claim no refusal can save.

The prompt's answer to that is the per claim routing rule, which is written for one sentence
splitting across two Cards. Neither of these rows is that shape. `L211` is one clause the model read
as background to the next one, and `L223` is the tenth item of ten.

So the question this ticket has to answer is not how to make the model better. It is what code can
check. The number of parts a message has is not knowable in code, but a message and what was
proposed out of it are both in front of the run.

## The two answers

Start from the read rather than from the filing. The Intent Read already returns the subjects a
message is about, per ADR 0032, and `L211`'s reading named `Ramaben` while the proposal named her
too, so subjects alone will not carry it. What separates these two rows from an ordinary one is the
count: ten errands typed and eight proposed, two clauses typed and one proposed.

Two directions worth costing before one is chosen, which is why this ticket names them rather than
picking:

1. Code compares the Captures in the batch against the sources the proposals cite, and holds back
   any Capture whose own words are long enough to be several claims while only one edit cites it.
   Cheap, needs no call, and it holds back some messages that really did hold one fact.
2. The filing prompt asks for a count of the separable claims beside the edits, and code holds the
   Capture back when the count and the edits disagree. Honest, and it trusts the same model that
   just missed the claim.

There is a third answer worth saying out loud, which is to do nothing. The Digest already asks about
every Capture that stays queued, and a rule that holds messages back too eagerly turns that list
into noise nobody reads, which loses claims a different way. `L223` is the row that argues against
doing nothing: both tiers lost the same errand, so this is not rare.

Whichever is chosen, two things go in the answer. What a message with a part nobody proposed must
end as, and what an ordinary message must still end as, because the second is what stops the fix
from holding everything back.

## Answer

**Neither of the two answers as written. The check is coverage, and the reply is what pays for it.**

Answer 2 was closest and it asked for the wrong thing. A count says two claims were separable and
one edit cites the Capture, so code knows something is missing and cannot say which words. Ask for
the words instead and the same field does three jobs: it drives the check, it names the gap in the
reply, and it names the gap in the Digest ask. A count does one of the three.

### The rule

A Capture drains when two things are true, not one. No edit naming it failed to write, which is the
rule `_drained` already has at `memark/vault/apply.py:2006`. And every word of the Capture is
accounted for by a claim the model proposed an edit for, or by a piece the model marked as carrying
no claim.

So the filing call returns a partition of each Capture's own text beside the edits. Every piece
carries a mark. A `claim` piece is one the model derived an edit from. A `skip` piece carries no
claim: a greeting, a connective, filler. The pieces concatenate back to the Capture's raw words and
code checks that they do. A partition that does not reassemble holds the Capture back, because a
model cannot then hide a missed claim behind pieces that do not fit.

**Why the model and not code.** Per ADR 0014 the model proposes and code applies, and how many
claims a message holds is a proposal like any other. Answer 1 asked code to infer it from the
Capture's length, and `L223` is the row that kills it: `mixer ka ring aana hai` is the seventh of
ten and the shortest, so any length rule skips exactly the claim that was lost every run on both
tiers.

**Why this is harder to get wrong than silence.** Today losing a claim costs the model nothing. It
says less and no field records that it said less. Under this rule the model has to write `skip` over
`mixer ka ring aana hai` on purpose. A wrong mark is still possible and it is a different act from
an omission, and the reply shows it to a person the same day.

### What a message ends as

**A message with a part nobody proposed** keeps no `filed::` mark, so it stays in the queue and the
next Digest asks about it. That is the whole of the fix and it needs nothing on screen to work.

**An ordinary message** drains exactly as it does today. Its claim pieces each derived an edit,
those edits wrote, its filler is marked `skip`, the pieces reassemble, so nothing is owed. This is
what stops the rule from holding everything back, and it is the half to write the test for first.

**A message the write path held back or refused** also drains exactly as today, by the existing
condition. Nothing about that path changes.

### The reply

The marks are the visible half and they were chosen with the check rather than after it. Today
`memark/acknowledge.py` quotes the whole Capture on one line and hangs one `→` line per Card under
it. The arrow is per landing, so nothing in the reply is per part of the message and a person
counting arrows under a ten part message has nothing to count against.

The reply becomes per piece, `skip` pieces never rendered, three marks:

| Mark | Means | Line shows |
| ---- | ----- | ---------- |
| `✅` | The claim landed | The line the box wrote to the Card |
| `❌` | Nobody proposed anything for this claim | Your own raw words |
| `❓` | An edit was proposed and code did not write it | Your own raw words |

`❌` and `❓` are deliberately different marks for what is today one silence. `❌` says the box lost
words. `❓` says the box will ask tomorrow, which is the box working correctly, and a person who
cannot tell the two apart learns to ignore both. An `✅` line shows the Card's line because checking
the filing is the point of the acknowledgement per ADR 0024. A `❌` line has no Card line to show.

**A Capture the call proposed nothing for now gets its reply edited too.** `filled_in` is given no
Capture that reached nothing today, on the grounds that a message saying nothing new is not worth
editing. That grounds is exactly the failure this ticket found: a reply that stays quiet while every
word was dropped. Such a message is all `❌` and the reply says so.

### The Digest ask

The Digest asks about a queued Capture by showing the Capture. For a ten errand message that asks a
person to hunt for the gap a second time, and the partition already says which piece it is. So the
ask leads with the crossed words rather than the whole message.

### No code-only backstop

Answer 1 is not kept as a floor under the coverage rule. Two rules both leaning careful hold back a
long single-claim message the model covered correctly, and a person cannot then tell which rule held
it. One rule that can be read beats two that cannot.

### What this is not

Not a fix aimed at the cheap tier. Per ADR 0003 filing runs on `claude-haiku-4-5` either way, and
`L223` failed on both tiers, so a prompt improvement alone closes half of this at best. The
partition is a schema field, held to the same shape rules as every other: full `required` list,
`additionalProperties` false, an absent value written as null.

### How it lands

**One new ADR**, because the rule outlives this phase and the next reader of `_drained` needs the
reason the coverage field exists. A Capture is drained by coverage and not by writes alone. It cites
ADR 0014 for why the partition is the model's to propose, and it notes on ADR 0024 that the
acknowledgement now carries three marks per piece rather than one arrow per landing.

**Three units of work, in this order.** The spec in ticket 10 breaks them out, because nothing in
this folder is a build on its own.

1. The schema field, the reassembly check, and the second condition in `_drained`. This is the fix.
   It ships with no visible change and stops losing words the day it lands.
2. The three marks in the reply, per piece.
3. The Digest ask leading with the crossed words.

Ordered this way because 1 is the fix and 2 and 3 are how a person sees it. One combined ticket
would make the fix wait on the marks.

### Where this meets ticket 11, which is in progress

Ticket 11 changes the same function and the two do not fight, which is worth saying because they
read as though they might. Ticket 11 builds `_drained` from `sources` so a Capture the call
proposed nothing for drains instead of drawing a thumbs up on every run for the rest of the Vault's
life. This ticket adds a second condition beside it. Under both rules together such a Capture drains
only when its pieces are all `skip`, and is held back when any piece is a `claim`, which is the
distinction ticket 11 has no field to draw and so drains either way. Build order follows: ticket 11
lands first and unchanged, then unit 1 here adds the condition.

**One thing the partition makes redundant, and it is not removed here.** `distillation.py` asks the
model for a claim about nobody on purpose, so the reserved Card refuses it, so the refused edit
holds the Capture back. The comment there says in as many words not to take the refused edit out as
dead weight, because taking it out loses the words. A `claim` piece with no surviving edit holds the
Capture back directly, so the refusal is no longer the only thing keeping such a Capture in the
queue. That is an argument for simplifying the prompt later and it is out of scope here: the refused
edit also carries what the claim was into the Digest, and nothing has costed losing that. Named so
the next person does not read the two rules as duplicates and delete the wrong one.

### Live pass criteria

`L211` and `L223` are the rows. Each must end with its Capture holding no `filed::` mark and the
dropped claim visible as `❌` in the reply. And a row that files cleanly today must still drain,
which is the assertion that catches a rule holding everything back.
