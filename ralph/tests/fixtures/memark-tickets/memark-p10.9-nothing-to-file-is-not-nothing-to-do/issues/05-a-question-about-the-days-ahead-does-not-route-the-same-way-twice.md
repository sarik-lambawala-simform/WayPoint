# 05 — A question about the days ahead does not route the same way twice

**Type:** defect

**Status:** completed

**Completed at:** 2026-09-18T00:00:00Z

**What to build:** `?next week kya kya hai` reaches the same function every time it is asked, so one
question does not get two kinds of answer and two different bills depending on the run.

**Reproduces:** 1 of 7 runs sent it to Recall and 6 of 7 sent it to the Cards. Measured as
`L239:route`, 0 of 5 on `claude-sonnet-5` and 0 of 1 on `claude-opus-5` against the pass's own run,
which is the one that went the other way.

## What happens

`L239` sends `?next week kya kya hai, kuch important to nahi`, which is one of the two or three
commonest things a person asks a notes system.

In the pass, the Intent Read returned a window of 1 to 7 September. The routing rule of ADR 0033 as
amended sends a message naming a time and nobody to Recall, so Recall read a week that has not
happened, found nothing, widened it to 25 August through 14 September, and the reply said:

> You sent me nothing between 01 Sep 2026 and 07 Sep 2026, so I widened to the 21 days from
> 25 Aug 2026 to 14 Sep 2026.
>
> Next week, your notes don't actually show anything at all.
>
> Read all 3 notes and 4 dated lines from 25 Aug 2026 to 14 Sep 2026.

In six repeat runs the same question returned no window at all and every Card was read instead. The
answers were longer, cost the full read, and named six to nine lines each.

Both are defensible answers. They are not the same answer, and nothing the person did changed
between them.

## Why

The route is decided by whether the Intent Read returns a window, per ADR 0032, and `next week` is
a phrase the reading is free to call a window or not. `memark/intent.py` tells the model to give a
window where the person named one, and says nothing about a window ahead of today, so both readings
are allowed by the prompt. Neither is a malformed response, so `recall.window_said` accepts the one
that comes and code has nothing to prefer.

`recall.days_around` already made a decision in this area and wrote it down:

> A window running past today is not clipped: a day nothing was sent on is answered by saying so,
> and that is as true of tomorrow as of last year.

That is a decision about a window that runs past today. Nobody decided what a window entirely past
today means, and this row is that case.

## What to change

The Intent Read prompt says what a window ahead of today is. Whichever answer ticket 06 gives, the
reading has to be told it, so that the same question routes the same way every run.

This ticket is the stability and ticket 06 is the destination. They are separate because the
instability is a defect whatever the destination turns out to be: a box that answers one question
two ways cannot be checked by anybody, and the bill for the two differs by the whole Vault.

## Done when

- [x] The Intent Read prompt says what a window naming only days ahead of today is.
- [x] `L239` routes the same way on five runs out of five.
- [x] The row carries a hard check on which route it took, so a later change that flips it is caught.
- [x] Ticket 06's answer and this prompt say the same thing.

## What is watched rather than fixed here

When the pass's run did go to Recall, the reply said the notes show nothing at all directly under a
footnote saying three notes and four dated lines were read. Phase 10.8 saw the same shape once, on
`L195`. It did not reproduce in five further runs here, because the route never came up again, so it
is not filed. It is in `00-index.md` under **Watched, not filed** and it is the first thing to look
at once ticket 06 settles where these questions go.

## Unblocked: what ticket 06 decided

Ticket 06 is resolved, so the sentence this ticket writes is decided rather than open. A window
naming only days ahead of today is read for what is due in it: the Date File lines the window
covers, whatever their `notice::` says, and every open Task. So:

- `memark/intent.py:327` is rewritten. It today says the month after today has not happened, so a
  window inside it holds nothing and the person is told their own notes are empty. That is now
  false and is the sentence that made this row unstable.
- The new sentence tells the model to give a window for days ahead the same way it does for days
  behind, because the box reads what is due in them.
- The routing arm changes with it: a message naming days reaches Recall whether or not it also
  names somebody, so `next week` and `Mohan next year` take the same door.

The rest of ticket 06's answer is Recall's own work and is not this ticket. Read the answer in
`06-should-a-question-about-the-days-ahead-reach-recall.md` before writing the prompt.

## What was built

**The sentence.** `memark/intent.py` said the month after today has not happened, so a window
inside it holds nothing. That is gone. In its place: days ahead of today are given the same way
days behind it are, `next week`, `agle hafte`, `is mahine ke end tak` and `next one year` each name
a window, and the box reads one ahead for what is due in it. Two sentences above it that said "a
stretch of the past" now say "a stretch of days", and the window field in `intent_schema` says
"behind today or ahead of it". Ticket 12's rule is untouched and is now fenced in its own words: a
bare day number with no month is still the most recent one carrying it, and that rule is said to
reach nothing else.

**The route was not changed and did not need to be.** `L239` names nobody, so the arm that sends a
time and nobody to Recall already carried it once the reading returned a window. The wider routing
change ticket 06 decided, a message naming days reaching Recall whether or not it names somebody,
travels with the named subject's Card riding along, and that Card is Recall's own work. Splitting
them would have taken `?25 tarikh ko jignesh ne meter ke baare me kya bola tha` to Recall and left
Jignesh's Card behind, which is `L238` going red on a box doing half a decision. Ticket 10 is where
both halves are planned together.

**`recall.pulled_back` says the decision out loud.** Its docstring said where a forward question
belongs is a decision nobody has made. Ticket 06 made it, so the comment now names it and says why
this function still leaves a forward window where the reading put it.

**The hard check.** `checks.the_question_was_recalled`, on `L239` through
`only_when_a_model_answered`. It reads the road off the answering prompt, because a recalled prompt
holds no Card and that is the whole of the difference between the two. The window each reading
returned is printed either way.

**The probe was flipped.** `L239:route` scored Recall as bad, because it was written when the Cards
were what six of seven runs did. Recall is the good outcome now.

## The rate, and a defect found in taking it

**5 of 5 on `claude-sonnet-5`.** Every run read a window. Not one reached the Cards, against 6 of 7
before.

Two measurements were thrown away first and both said the same thing about the instrument.

The first scored 4 of 5 bad, three of them with no answering call at all. Those three were taken
while the unit suite was running on the same laptop. A `claude-cli` call starts a whole Claude Code
session and times out at 240 seconds, per ticket 09, so a busy machine manufactures findings. The
second, taken idle, scored 1 of 5 with one such run left.

**The probe reported those as `NO_READING_DETAIL`, which says the reading failed.** On this probe
that sentence is a guess about which call broke, and it is the wrong guess: a reading that fails
leaves `subjects is None`, which routes to the Cards and still makes an answering call. No
answering call at all is a different event. `ModelCall.failed` holds what actually happened and the
probe was dropping it. It now prints every failed call and what it failed with, so the next person
reads a timeout as a timeout rather than as a finding about the box.

This is the same lesson the index already draws about `L239:window`: read the detail, not the
tally. Two probes on this one row have now been wrong in a way the tally could not show.

## What this leaves for ticket 18, which is now reachable

The Recall route used to come up once in seven runs. It now comes up every run, so ticket 18 is
measurable, and one live run already showed it whole. The reply read 01 to 07 September, found it
empty, widened **backwards** to 25 August through 14 September, and then opened `Next week has two
things actually set. On 25 Aug there's the society AGM`. August is not next week. Ticket 06 already
decided the rule that closes it: `recall.widened` applies to a window wholly in the past and to no
other, so a forward window holding nothing is answered as empty. That is Recall's work and it is
ticket 10's to plan.
