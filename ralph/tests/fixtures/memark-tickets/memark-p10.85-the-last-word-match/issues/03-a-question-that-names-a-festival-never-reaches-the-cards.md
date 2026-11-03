# 03 — A question that names a festival never reaches the Cards

**Type:** grilling

**Status:** completed

**Blocked by:** none

## Question

Phase 10.8's spec put this out of scope in as many words:

> **How a question that is half when and half what gets routed.** `what did I decide about the flat
> that week` reaches Recall's window and never `places/flat.md`. Ticket 11 called that the Intent
> Read's problem rather than Recall's. Fog on the map, and it needs real misroutes to look at.

Here are the real misroutes. Three rows of forty made no answering call at all.

**`L134`, the phase's own problem statement.** `?when was the last time I had Italian food` on the
Vault whose Card says `the pasta there is the best in the city`. The reading returned
`occasion: "Italian food"`, `handler._occasion_window` found no confirmed day for it, and the reply
was `I have no Italian food on record for 2026 or any year before it.` The Card never entered a
prompt. This is the row the phase exists for.

**`L188`.** `gaadi is making that noise again on the left side`, then
`?what did the garage say about it last time`. The reading returned `occasion: "last time"`. The
reply was `I have no last time on record for 2026 or any year before it.`

**`L189`.** `?ramaben ne bola diwali bonus chahiye, last year kitna diya tha`. The reading returned
subjects `["ramaben", "diwali bonus"]`, a question, **and** `occasion: "diwali"`. The occasion won
and the question was never answered, on a Vault that holds a Card for Ramaben saying she asks for
the Diwali bonus a month in advance every year.

`L189` is the sharp one because nothing was ambiguous about it. The reading itself said the message
names a subject and asks a question. `memark/handler.py:903`'s `_occasion_window` guards only one
case, which is an occasion name that is itself a Registry subject, and `diwali` is not one.

**So the question is what wins when one reading holds an occasion and a question.** Today the
occasion wins and, where no day is on record, the question is dropped without being asked.

Answers to weigh, none of them free:

**Answer the question when the occasion is not on record.** The reply then says both: no day for
Diwali is written down, and here is what the notes hold about the bonus. It costs one answering
call on a path that costs none today, which is what the no-record sentence was written to avoid.

**Answer the question whenever there is one**, and treat the occasion as material for it. Simpler
rule, larger change, and it makes the cheap no-record path unreachable for any message carrying a
question mark.

**Leave it, and change the reading instead** so that a festival word beside a question is not an
occasion. That keeps code as it is and pays the price in the tier ADR 0003 puts the reading on,
which ticket 04 shows is where the other half of this already lives.

## Rates

Measured with `python -m harness.live.repeat`, which forces the tier onto a named model.

| Probe | `claude-haiku-4-5` | `claude-sonnet-5` | `claude-opus-5` |
| ----- | ------------------ | ----------------- | --------------- |
| `L134:route` | 0 of 5 | 1 of 5 | 0 of 1 |
| `L189:route` | 2 of 5 | 5 of 5 | 0 of 1 |

The tier that matters is `claude-haiku-4-5`, per ADR 0003 and ADR 0031. `L189` fails there two runs
in five, so this is a live defect on the production tier rather than an artefact of the harness.
`L134` does not fail there at all: it failed on `claude-sonnet-5`, which is what
`harness/session.py:98` defaults the filing tier to. That has a consequence worth stating in the
same breath, and it is ticket 05.

## Answer

**The Cards go in the prompt unless the message names a time and nobody.** One rule over the whole
answering path. Code still reads the window the way it does today, and the window stops being the
thing that decides whether a Card is ever opened.

- The Intent Read named a subject: every Card goes in the prompt, per ADR 0043, the model reads the
  whole Vault. Where code also resolved a window, that window's Captures and Date File lines go in
  beside them and the answer is one call over both.
- The Intent Read named no subject and code resolved a real window: Recall as it is today. The
  window's material, no Cards.
- There was no reading at all, which is `subjects is None` rather than the empty tuple: the Cards go
  in. Where nothing is known about the message the box reads more rather than less.

### The three options in the ticket were the wrong three

Every one of them argued about which of the two doors a message goes through. The two doors are the
defect. ADR 0033 decided that Lookup answers what and Recall answers when and that neither is a mode
of the other, and that is right about the two functions and wrong about the prompt: `ramaben ne bola
diwali bonus chahiye, last year kitna diya tha` is both, and any rule that picks one of them throws
half the message away. So the pick is deleted rather than tuned, which is the same move ADR 0043 made
on ADR 0028's picker one decision earlier.

`_occasion_window`'s existing guard at `memark/handler.py:903` was already this rule, written once for
one case. It returns None when the occasion name is itself a Registry subject, so the question falls
to the Lookup. The comment beside it says why: answering that the Kitchen is not on record would be a
false line about a Card this Vault holds. That argument was never about the occasion name. It was
about the message naming something the Vault has a Card for, and the guard reads the wrong half of the
message to find out.

### What each row does

| Row | Subject | Window | Sent | Was |
| --- | ------- | ------ | ---- | --- |
| `L134` `?when was the last time I had Italian food` | none | none resolves | every Card | `I have no Italian food on record` |
| `L188` `?what did the garage say about it last time` | none | none resolves | every Card | `I have no last time on record` |
| `L189` `?ramaben ne bola diwali bonus chahiye...` | `ramaben` | none, Diwali unrecorded | every Card | `I have no diwali on record` |
| `?pichle hafte kya kya hua tha` | none | 17 to 23 August | that week's material | unchanged |
| `holi pe ramaben ko kitna diya tha` | `ramaben` | 4 March, on record | every Card plus 4 March | 4 March alone, Card unread |

The last row is the hole this session found and it is not in the ticket. A confirmed occasion date
hides the Cards exactly the way a missing one does, and it does it on the branch the pass never
exercised because `L194` asked about Holi and named nobody. Any answer that fixed only the missing
date would have left it for the next pass to find again.

### The bill

Measured against `harness/live/bill.py` and ADR 0043's own arithmetic.

A question naming a time and nobody is the only question that never needed the Cards, and it is the
only one that stays cheap: about 375 tokens for a day, 2,600 for a week and 11,000 for a month, per
[p09.6 ticket 11](../../memark-p09.6-decisions-only-you-can-make/issues/11-what-recall-does-when-nothing-ranks.md).
Nothing on that path changes.

What starts paying is the path that today is free and wrong. An occasion with no confirmed day costs
$0 today and says nothing useful, and it now costs one ordinary answering call, near 150,000 tokens
and about 30 cents on the Vault ADR 0043 costed. That is the whole of the increase, and it buys the
three rows back. ADR 0043's month of about $90 at ten questions a day is the same month, because these
questions were always inside the ten and were being refused rather than answered.

Merging the prompt on every question was considered and rejected on this number alone. It would send
150,000 tokens of Cards to `what happened last week`, which is roughly fifty times what that question
costs today and buys nothing, because a question that names nobody has no Card to reach for.

### What this deletes

`no_occasion` at `memark/answering.py:913` becomes unreachable and goes, with `_not_on_record` at
`memark/handler.py:976` and the `TheWindow | str | None` return that existed to carry it. There is no
route left to it: an occasion with no confirmed day now resolves to no window, and a question with no
window is a Lookup question.

Nothing is lost by that. A Vault that truly holds nothing on the words is already answered for free by
`found_nothing` in `_written`, which is an absolute rather than a threshold, so the honest version of
the sentence survives and the version that was false about the Cards does not.

`could_not_use_the_window` stays. A pair of days that is not a window is the model returning something
code cannot use, per ADR 0032's exact match or nothing, and that is a different failure from an
occasion nobody wrote a date for.

No line is written above the answer saying the occasion has no date on record. This phase's ticket 02
is open on a sentence that contradicts the paragraph under it, and adding a second such sentence while
that argument is running would be the same mistake with a new cause.

### The risk, stated rather than deferred

The rule leans on the subject read, and that read runs on `claude-haiku-4-5` per ADR 0003, hosted
models over local inference, which chose a cheap tier for mechanical filing. Nothing has measured how
reliably that tier names subjects. The gap is already written down as **What the cheap tier actually
does with subjects** in the
[p09.6 map's](../../memark-p09.6-decisions-only-you-can-make/map.md) fog, and this decision adds a
third thing to that same measurement rather than a new one.

Two things bound it. This phase's
[ticket 01](01-a-common-noun-is-not-a-subject.md) shows the cheap tier naming **too many** subjects
rather than too few, and an extra subject sends the Cards, which costs money and never an answer. And
`subjects is None` sends the Cards, so a reading that failed altogether fails toward reading more.

The standing preference from the p09.6 map holds and is untouched: a stronger model is a diagnostic
and never the answer. It is worth saying that this ticket is the case that preference was written
for, read backwards. `L189` fails 2 of 5 on `claude-haiku-4-5` and 5 of 5 on `claude-sonnet-5`, so the
stronger tier is worse, because a stronger model sees `diwali` more reliably and the code then drops
the question more reliably. No prompt was ever going to fix it.

### Rejected

**Answer the question only when the occasion is not on record**, which is the ticket's first option.
It is this decision with the last row of the table left broken, and the session found that row by
asking what happens when the date **is** written down.

**Answer the question whenever there is one**, the ticket's second option. Every reply that reaches
`no_occasion` is already a question, because the only producer is on the path `_answer` runs, so this
rule is not a wider version of the first one. It is the same rule with the subject gate removed, and
the gate is what keeps `what happened last week` cheap.

**Change the reading so a festival word beside a question is not an occasion**, the ticket's third
option. The rates refuse it: `diwali` is a real occasion and the reading that names it is correct. A
prompt telling the model to hide a true reading would be paying the cheap tier to be wrong on purpose,
and `L189` proves the stronger tier obeys it less.

**Let the model choose the days too.** Considered in session and rejected on two counts. All Captures
is 2.7 MB near 675,000 tokens after five years, already past ADR 0043's own reopen line of about half
the window, and a model choosing which days to read for `at Diwali` has nothing to place Diwali with
except its own memory of when Diwali falls. That is what ADR 0012, a date the agent found is confirmed
by the human, refuses, and it is this phase's
[ticket 04](04-a-festival-date-is-never-the-models-to-know.md) made unfixable by construction.

### What has to be written

- **ADR 0033**, a day is recalled from its Captures, is amended rather than superseded. Recall stays a
  second function beside the Lookup. What changes is that a window no longer decides whether the
  Cards are read, and the amendment carries the one-line rule and the last row of the table above.
- **ADR 0043**, the model reads the whole Vault, gains the case its rules did not cover: a question
  carrying a window reads every Card too when it names a subject, and the window's material joins the
  prompt rather than replacing it.
- **`CONTEXT.md`**'s Recall entry says its prompt holds the date material and no Cards. That is no
  longer true for a question naming a subject, and line 395 is where it is written.
- **`docs/stack/dates.md`** and **`docs/stack/search.md`** carry the routing path.

### The other half of `L134` and `L188`

Both rows are fixed by the routing change alone, and neither reading is corrected by it. `Italian
food` is still read as an occasion and `last time` is still read as a name. They now reach the right
answer because an occasion with no confirmed day resolves to no window, and a question with no window
reads every Card, which is what those two messages needed.

**No prompt ticket is filed for them.** The split agreed earlier in this session was made before
version 5 existed, and version 5 removes what the split was for. A wrong occasion name costs nothing
now: there is no free refusal for it to trigger and no window for it to narrow the answer to. What is
left is a reading that is untidy rather than harmful, and a prompt change tightening it would buy no
row on this pass and risk the readings that are right.

One case is left watched rather than filed. A wrong occasion name that happens to match a day the
Vault **did** confirm would narrow a question to that day. Nothing in this pass produced one, and it
needs a real row before anybody writes a rule for it.

## Where it goes

Answered here, in this phase, as its own ticket. The ticket first routed this to the
[p09.6 map](../../memark-p09.6-decisions-only-you-can-make/map.md), whose ticket 11 named the fog and
asked for real misroutes. The misroutes are here and the map is finished: every one of its tickets is
resolved and its answers already shipped as p10.7 and p10.8, so reopening it would reopen work that
is built. The fog patch **How a question that is half when and half what gets routed** is answered by
this ticket and cleared from that map, with a pointer to here.
