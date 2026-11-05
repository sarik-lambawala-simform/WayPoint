# 08 — A new name is lost when the claim reads as a disagreement

**Type:** defect

**Status:** completed

**Completed at:** 2026-09-17T22:51:31Z

**What to build:** a Capture that introduces somebody by name opens their Card, even where part of
what it says rubs against a line the Vault already holds about somebody else.

**Reproduces:** 5 of 5 on `claude-haiku-4-5`, the tier ADR 0003 puts filing on. 0 of 1 on
`claude-opus-5`, which opened `people/dinesh-watchman.md` correctly. Only the cheap tier fails, so
the prompt is too thin to carry the rule rather than wrong.

All five cheap-tier runs produced the same single edit, `contradict -> Ramaben`, which says this is
one reading of the sentence rather than five different slips. A model reading it that way every time
will keep reading it that way until the prompt says otherwise.

## What happens

`L214` sends `the new building watchman is called Dinesh, he keeps the spare keys on sunday when
ramaben is off`. Two claims: a person exists and is called Dinesh, and he holds the keys on the day
Ramaben is away.

The model proposed one edit and it was a `contradict` on Ramaben's Card:

> contradict -> 'Ramaben' [Facts]: 'the new building watchman Dinesh keeps the spare keys on Sunday
> when she is off'

A `contradict` never writes, per ADR 0010, so nothing landed. There is no Dinesh Card, no Registry
row, and the name reaches the Vault nowhere. The Capture is held back on a question the Digest will
ask, which is the design working, so the words are not lost. What is lost is the Card, and with it
every later question about the watchman.

`L215` is the control and it is why this is a defect rather than a habit. `jignesh and that new
electrician suresh came together, suresh says the board work is two days` opened `people/suresh.md`
cleanly. The difference is that nothing Suresh said touched an existing line.

## Why

Ramaben's Card says `the spare key of the new flat stays with her, not with the watchman`. The new
Capture says the watchman keeps the keys on Sunday. Those two are in genuine tension, and ADR 0010
is right that the box may not settle it.

What went wrong is that one claim's tension swallowed the other claim. `the new building watchman is
called Dinesh` disagrees with nothing. It is the plainest kind of fact there is and it has its own
home. The filing prompt asks the routing question per claim, per `memark/distillation.py:41`, and
the two claims here were merged into one edit before that rule could apply.

The prompt's existing worked example for splitting is a sentence carrying a fact about the person
beside a fact about somebody else. This is a second shape of the same failure: a fact that can be
filed beside a fact that must be raised.

## What to change

The filing prompt, beside the per claim routing rule. A `contradict` covers the claim that
disagrees, and the claims beside it in the same sentence are filed on their own merits. Give the
worked example, because the rule without one is what produced this: a new person named in the same
breath as something that disagrees with an existing line.

The write path is already right and was checked before this was written. `vault/apply.py:2576` says
so in its own words:

> What is held is the edit and not its Capture. A batch's edits can share a source... the Capture is
> kept undrained there instead and the sibling lands with the question still open.

So a `create` for Dinesh and a `contradict` on Ramaben citing one Capture would both be handled
correctly: the Card would be written and the question would still be asked. The model never proposed
the `create`, so the prompt is the whole of the fix and no code on the write path changes.

## What was built

One bullet in the filing prompt and one unit test. No code on the write path changed, which is what
the ticket predicted.

The bullet sits beside the two `contradict` rules and says a `contradict` covers the one claim that
disagrees and never the claims beside it. Each claim is read against what is already written on its
own, and gets the edit it would have got had it arrived alone. Then the worked example, because the
rule stated on its own is what produced the defect: somebody else's Card already carrying `the
tablets are taken in the morning`, and a Capture reading `the new pharmacist is called Ravi, he says
the tablets are taken at night`. Two claims, two edits. The pharmacist exists and is called Ravi, which disagrees
with nothing, so it is an `extend` opening a Card for Ravi with a `registry_note`. The tablets at
night is the `contradict`. The bullet closes by saying both edits name the same Capture and that is
right, because code writes the one and leaves the question open on the other.

**The example is a pharmacist and never the watchman, on purpose.** `L214` sends the watchman
sentence, so an example carrying that sentence's own answer would let the model copy it and the
probe would score the copying rather than the rule. This is phase 10.9 ticket 03's own finding,
applied here before it could be rediscovered.

`tests/test_distillation.py` asserts the rule, the "however loudly" clause and the worked line are
in `INSTRUCTIONS`, and that `watchman` is not.

## The write path, covered rather than assumed

`tests/test_a_capture_that_files_in_parts.py` gains two tests on one Capture that names somebody for
the first time beside a claim disagreeing with a line about somebody else.

The first asserts the shape: the new Card is created with its line, the Registry carries a row
named for the new person, read through `read_registry` rather than by searching the file's text, the contradicted line is written nowhere, and the block keeps no `filed::` mark. `_held_back`
holds the edit and never its Capture, so the `contradict` does not stop the Card being created.
`_drained` reads the other way, so the Card being created does not file the block.

The second runs the same batch past the Digest hour and asserts both halves of the promise together:
the Card is on disk, the contradicted line is written nowhere, and the Capture is still put back as
a numbered line that evening.

The ticket's word for the first edit is `create`. The schema has three kinds and none of them is
that, so what the prompt and the tests carry is an `extend` naming a subject the Registry does not
hold, which is what opens a Card. The ticket's word is loose and the behaviour it names is the one
that shipped.

## The rate after the change

`python -m harness.live.repeat L214:card --runs 5` on `claude-haiku-4-5`, the tier ADR 0003 puts
filing on: **0 of 5**, down from 5 of 5. Measured twice over ten runs either side of a wording edit
the code review asked for, and both fives came back clean. Every run opened
`people/dinesh-watchman.md`.

The key question is still raised. `python -m harness.live --only L214` came back with both edits:

> proposed: extend -> 'Dinesh' [Facts]: 'the watchman at the new flat in Bopal'
>
> proposed: contradict -> 'Ramaben' [Facts]: 'the watchman keeps the spare keys on sunday when she
> is off'

The line the `extend` carries is worded differently run to run, and which two edits come back is
not. The Card was created, the `contradict` wrote nothing, and `^59f9` came out of the run carrying
`ack::` and no `filed::`. So the name is in the Vault and the question is still owed, which is both
halves of what the ticket asked for.

## Done when

- [x] The filing prompt says a `contradict` covers one claim and never its neighbours.
- [x] `L214` opens a Card for Dinesh and still raises the key question.
- [x] A unit test asserts a batch holding a `create` and a `contradict` from one Capture writes the
      Card and holds the Capture back, so the write path's promise is covered rather than assumed.
- [x] The rate is measured again after the change.
