# 07 — A claim in a long dump is lost and the Capture drains anyway

**Type:** defect

**Status:** completed

**Reproduces:** 2 of 5 on `claude-haiku-4-5`, measured on `L223:lost`.

## What happens

`L223` is ten errands in one message, sent before a drive:

    quick dump before i drive: aarohi ki school fees ki last date 10th hai, activa ki seat cover
    change karani hai, papa ke liye rajkot me ground floor room ready ho gaya, sandeep ko form
    sixteen dena hai, tulsi ke liye mitti leni hai, khushbu ka anniversary dinner 14th ko book
    karna hai, mixer ka ring aana hai, gas cylinder book karna hai app se, jignesh ko meter board
    ka estimate bhejne bola hai, aur passport ke liye police verification ka slot lena hai

On two runs of five the mixer ring was never proposed as an edit, the words were written nowhere,
and the Capture drained anyway. The probe reports it as:

    ['mixer'] was never proposed and 17 Captures drained

A drained Capture is one nothing will ask about again. No Digest raises it, nothing is crossed out
in the reply, and the reply names only what landed, so the person is told nine things happened and
never told the tenth did not.

## Why this is not what phase 10.9 already fixed

ADR 0044 made a Capture drain by coverage rather than by writes alone, and it works. `L211` in the
same pass lost `next month se 8500 karna hai` and the reply crossed it out:

    ✅ Jignesh (cousin): he comes on Diwali
    ❌ ghar bhara rahega

So the safety net exists and fires. What this ticket is about is the path around it. Draining is
decided from the partition the model returns at `distillation.py:280`, which cuts the Capture into
`claim` and `skip` pieces. A piece the model marks as covered by a surviving edit, or as filler,
is covered whether or not it really is. `Partition.fits` at `distillation.py:302` checks that the
pieces joined back up are the words the person typed, which catches a partition that invents or
drops text. It cannot catch one that fits perfectly and labels a real errand as belonging to
another claim.

## What was checked and is not a defect

The anniversary dinner is missing from the proposed edits on all five runs. **That is correct.**
Khushbu's Card already carries it as an open Task:

    - [ ] book the table for the anniversary on the 14th · shown:: 1 ^t101

so a second copy is the duplicate the filing prompt is told to refuse, and the model refused it.
This was written up as a second defect first and the fixture killed it, which is the same shape as
the two wrong write-ups the method warns about.

One question does come out of it and it is an observation rather than a claim: a claim refused for
being a duplicate has no surviving edit either, so how the coverage rule accounts for it is worth
somebody reading once. Nothing is lost when it happens, because the Vault already holds the thing.

## The probe is narrower than the finding

`L223:lost` watches the single word `mixer`, so a run that loses a different errand scores good.
Two of the three good runs above lost nothing else, and one split `school fees` into two claims,
which is a wording choice and not a loss. The rate is honest for `mixer` and is a floor for the
row.

## Done when

- [x] A claim the partition marks as covered when no surviving edit came from it is caught, so the
      words reach the reply crossed out rather than draining in silence.
      `test_a_claim_piece_no_edit_derived_from_keeps_the_capture_in_the_queue` and
      `test_a_claim_that_derived_two_edits_does_not_cover_the_claim_beside_it` are the pins.
- [x] `L211`'s crossing out still works, and `L250` still drains an ordinary two errand message
      with nothing owed about it. That pair is phase 10.9's own control against a coverage rule
      that holds everything back. Held in the unit suite rather than in a live rate:
      `test_the_errand_missed_in_the_middle_is_the_one_crossed_out` is `L211`'s shape and
      `test_a_message_whose_pieces_are_all_covered_drains` with
      `test_a_message_that_proposed_nothing_and_is_all_skip_drains` is `L250`'s. Both are green
      and neither costs a model call. The reasoning is in the section below.
- [x] `L223:lost` is measured again on `claude-haiku-4-5` after the change and the rate is in this
      ticket.
- [x] The probe is widened to read every one of the ten errands rather than the one word, or a
      second probe is added that does, so the next rate is a rate for the row. `L223:whole`.
- [x] `pytest`, `mypy`, `ruff check` and `ruff format --check` are green. 1756 tests pass and
      `mypy` reads 124 source files clean.

## What was changed

A piece carries a third field beside its text and its mark: which of the answer's edits came off
it, each one a position in the answer's own `edits` array. `_uncovered` in `vault/apply.py` holds
a Capture back when any `claim` piece names no edit that reached a file. That is ADR 0044's rule
in the words the ADR states it, per piece, and the ADR is amended to say the field exists.

The count that was there before is kept beside it rather than replaced. It catches the one shape
the per-piece rule cannot see: several claims pointed at the same written edit, which reads as
covered piece by piece and is one edit doing the work of two.

The marks on the reply move with it and that is half the criterion. `Covered.filed`, `held` and
`lost` handed the claims out in order, the first `written` of them filed and the rest lost, so a
ten errand message whose seventh was missed read back with the seventh filed and the tenth crossed
out. Each claim takes its mark from what came off that piece now, and
`test_the_errand_missed_in_the_middle_is_the_one_crossed_out` is the pin on it.

## The rate after the change

Measured with `python -m harness.live.repeat` on `claude-haiku-4-5`, the tier ADR 0003 gives
filing.

| probe | before | after |
| ----- | ------ | ----- |
| `L223:whole` | not built | **0 of 5** |
| `L223:lost` | 2 of 5 | **3 of 5** |

One of `L223:whole`'s five runs lost the mixer ring and the dump's Capture stayed queued, which is
the box working. The other four proposed all nine watched errands.

`L223:lost` went up and the next section is why. It is not reading the drain.

**What the number does and does not say.** Five runs of nothing is not a proof and the shape is
stochastic: two runs of the pass lost the mixer ring and three did not. What it says is that the
shape did not come back on the row it was measured on. The pin that the fix bites is in the unit
suite rather than in the rate:
`test_a_claim_that_derived_two_edits_does_not_cover_the_claim_beside_it` is exactly the partition
that balanced and drained, and it is red without the change.

One run was dumped whole while measuring and it is the mechanism on paper. The model marked
`mixer ka ring aana hai` as a `claim` with an empty `edits`, nine other errands named the edit
each derived, and the Capture kept no `filed::` mark. Before the field the same answer was nine
claims and nine writes on the message's own arithmetic.

## Why `L223:lost` is not the number to read

The older probe is kept, was re-measured, and went from 2 of 5 to 3 of 5. **That number is about
the probe and about the model, and not about the drain.**

`dropped_a_fact_and_drained` asks whether **any** Capture in the Vault drained, and this fixture
holds seventeen or eighteen that drain on every run. So the moment the mixer ring is missing it
reads `bad`, whatever happened to the message the ring was in. The pair it says it measures is one
half of a pair, and what is left is a probe for `did the model propose the mixer ring`.

That is a coin this change does not touch. Whether the cheap tier reads all ten errands out of one
message is the model's, and 2 of 5 and 3 of 5 are the same coin landing. Ten runs of the row were
made across both probes and the ring was missing in four of them. What moved is what happens after
it goes missing, and only `L223:whole` reads that.

`L223:whole` is the one to read. It finds the block whose words hold `quick dump before i drive`
and asks whether that block drained, which is the Capture the finding is about.

`L211:lost` is left on the old probe untouched. It is a different row and re-aiming it is not this
ticket's work.

## Why this ticket read blocked, and what it was not

It was not the fix. The fix was written, the pins were written, and both were green.

The Ralph run that carried this ticket died part way through an edit to `vault/apply.py` and
filed the ticket as blocked. The run log names the cause and it is not this code:

    The streamed transcript stops mid-ticket: ticket-07.jsonl holds no result event.
    That is the render chain dying, not the ticket.

`jq` refused one line of the streamed transcript, `Invalid literal at line 5389, column 40967`,
and took the process down with it. What the agent had already written was committed as
`8e624bf wip(07)` so nothing was stranded, and that commit holds the whole fix.

One real thing was left, and it was older than this ticket. `mypy` read seven errors, all of them
in `harness/live/`, and all of them present before this ticket started. Six were the same slip:
`ModelCall.answer` is a mapping of `object`, because what a model sent back is the model's and not
something a type can promise, and six probes iterated a field off it or called `.get` on it without
asking first. `a_list_in` and `a_dict_in` in `checks.py` are that question asked once. The seventh
was `scenarios_p10.py` unpacking a date split into `_`, which `**_: object` had already bound to
the keyword bag. None of them touched the box, and all seven are gone.

## Why the control pair is a unit test and not a rate

`L211` and `L250` are named in the criterion as the control against a coverage rule that holds
everything back. What has to hold is that a crossed-out word still crosses out and an ordinary
message still drains, and that is a claim about this code rather than about a model. A unit test
answers it every run, for nothing, and answers it the same way twice. A live rate answers it five
times on a coin and costs money to do it.

So the control is pinned in the suite. `L211` and `L250` are still in the bundle and the next live
pass runs them as regression coverage, which is what the bundle is for.

## What the widened probe watches

Nine of the ten errands, each with the spellings it could honestly come back in, because a model
writing this household's errands in English picks between `Form 16` and `form sixteen` and neither
is a loss. The subject is read beside the text for the same reason.

The anniversary dinner is the tenth and it is left out on purpose. Khushbu's Card already carries
`book the table for the anniversary on the 14th` as an open Task, so a second copy is the
duplicate the filing prompt is told to refuse. Watching it would score every run bad for the
prompt working, which is the write-up this ticket already killed once.
