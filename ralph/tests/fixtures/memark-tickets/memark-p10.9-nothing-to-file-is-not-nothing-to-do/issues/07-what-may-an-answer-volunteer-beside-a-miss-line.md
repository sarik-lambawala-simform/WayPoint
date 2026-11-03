# 07 — What may an answer volunteer beside a miss line?

**Type:** grilling

**Status:** completed

## Question

`L242` sends `?badminton coaching ki fees kitni thi club me`. Nobody in this Vault plays badminton
and nothing names a club, so the honest answer is that there is nothing. The miss line said exactly
that. Then the same reply went on:

> I have nothing on badminton coaching or club.
>
> Your notes do hold plenty about the household money side of things. Ramaben asks for her Diwali
> bonus a month in advance every year, the SIP goes out five thousand on the fifth of every month,
> and the credit card bill date has moved to the 18th after the last statement.
>
> From: "she asks for the Diwali bonus one month in advance every year" on Ramaben, "the SIP goes
> out on the fifth of every month, five thousand" on Money, "the credit card bill date moved to the
> 18th after the last statement" on Money

Three lines cited, none of them about what was asked. The sources line is code's and it is read as
evidence for the answer above it, so this is a footnote vouching for a paragraph that answers a
different question. The word `fees` reached `money` and the model followed it.

Phase 10.8 watched the general shape of this and did not file it: `?what suffers if we are out of
town for a few days` came back with the tulsi, then the spare key, then the SIP and the credit card
bill, and the note said whether a wider answer is helpful or noisy is a judgement one pass cannot
settle. This row is the sharp end of that question rather than the same one. Here the box has
already said it holds nothing, so everything after is by its own account not an answer.

So: what may an answer carry beside a miss line?

**Nothing.** A miss line and then silence. Clean, and it throws away the case where the person asked
about the wrong thing and the near miss is what they needed.

**Only what the question's own words reach.** The money Cards are here because `fees` is a money
word, which is the ranking ADR 0028 removed doing its old job from inside the model instead of from
code. Saying so in the prompt is cheap and vague.

**Anything, but never under a sources line.** The footnote is what makes the volunteered material
read as an answer. Separating the two says "nothing on this, but here is what is nearby" without the
evidence sentence underneath.

The third is the smallest change and it may be the wrong one, because it keeps the noise and only
relabels it. That is the decision, and an agent must not answer its own side of it.

## What the pass saw

`L242` is the row. It reproduces 4 of 5 on `claude-sonnet-5`, which is the tier ADR 0003 puts an
answer on, and 1 of 1 on `claude-opus-5`. Both tiers do it, so no model is weak here. The prompt
allows it, which is what makes this a decision rather than a defect.

The fifth run is worth reading rather than counting. It scored good because it stated no miss line
at all, not because it stopped volunteering. So four runs in five put a footnote under material
nobody asked for, and the fifth dropped the honest half instead. Neither is the reply this box
should send.

`claude-opus-5` cited five lines rather than three: the SIP, the credit card bill, the LIC premium,
the rent rise and the packers' quote. A stronger model volunteers more, not less, which says again
that the rule has to be written down rather than waited for.

`L226` is the row on the other side of the same rule, and it is the reason this is a question rather
than a ban. Asked whether Aarohi has a peanut allergy, the box said the notes hold nothing about
Aarohi and then volunteered that the peanut line belongs to Khushbu. That volunteering is the best
answer in the whole pass. Any rule written here has to keep it.

## Answer

**After a reply says the Vault holds nothing on a subject, it may add only material that answers the
question that was asked, about a different subject. Adding it is never required. What survives is
cited in the sources line like any other answer.**

Two of the ticket's own three options were refused. Nothing but a miss line was refused because it
throws away `L226`. Anything under a separate heading was refused because it keeps the noise and
only relabels it: a person still reads four lines of money talk to learn nothing.

**The tie is the question, not the words.** `L226` and `L242` look alike and are not. `L226`
answered the question that was asked, a peanut allergy, about a person nobody named. `L242` answered
a different question, household money, because `fees` sounds like a money word. The first is the
best reply in the pass. The second is the failure. So the rule names the question and says nothing
about nearness, which is the thing that let `fees` reach `money`.

**Adding it is optional, and the box never hunts.** The miss line and silence is a complete and
correct reply. There is no instruction to look for a near match, no second pass over other subjects,
and no expectation that something is always found. The added material is a good thing to have when
it is already in front of the model, and never a thing the reply owes. This matters more than it
reads: a rule that permits volunteering without saying it is optional is a rule a model will treat
as a job, and `claude-opus-5` already volunteers five lines where `claude-sonnet-5` volunteers
three.

**What survives the rule is the answer, so it is cited.** No special case in the sources line. The
`L226` reply carries `I have nothing on Aarohi` on top, the Khushbu fact, and a `From:` line naming
the Khushbu peanut line under it. Stripping proof off the best reply in the pass would be the wrong
trade.

**The badminton reply keeps its bottom line.** With nothing to add, `L242` becomes the miss line and
then `From: no line of your notes I can name.`, which `memark/answering.py:468` already writes. ADR
0043, the model reads the whole Vault, rejected dropping the sources line because a reply with no
footnote reads as more sure of itself rather than less. That reason holds here unchanged.

**This is a prompt rule and code enforces nothing.** One code check was looked for and it fails. The
obvious shape is that a reply covering no subject may cite no line, which kills `L242` and kills
`L226` with it, because Aarohi was the only subject the message named and she was missed too.
Whether added material answers the question asked is a meaning judgement, and ADR 0002,
deterministic code selects what the model sees, is about selection rather than about meaning. So
nothing in code moves and the rule lives in the answering prompt.

**Two hard checks carry it instead.** `L242` must end with `From: no line of your notes I can
name.`, and `L226` must still cite the Khushbu peanut line. Both are string checks, so a run passes
or fails rather than being scored. `L226` is the important one: it is the guard that stops a later
session fixing badminton by banning volunteering outright.

**The rule covers only a reply that admits a gap.** Phase 10.8 saw a reply with no miss line wander
the same way: `?what suffers if we are out of town for a few days` came back with the tulsi, the
spare key, the SIP and the credit card bill. That is a different question and it is out of scope for
this map. Here the box has said it holds nothing, so everything after is by its own account not an
answer. There the box is answering, and whether a wider answer is helpful or noisy is a judgement
nobody has settled.

**The run with no miss line at all is its own defect, filed as ticket 19.** The fifth run scored
good because it printed no miss line, which means the model put `badminton coaching` into its
`covered` list and code stayed quiet. Per ADR 0043 as amended, the miss line fires only when the
model leaves the subject out of `covered` and no word of it is in the Vault. A model that can put an
uncovered subject into that list can switch the miss line off for any question, not only this one.
That is bigger than volunteering and it needs a reproduction rate of its own.

**One new ADR.** It records what a reply may carry after it admits a gap. ADR 0043 is about what the
model reads and does not own this.

### Work this creates

1. The answering prompt states the rule, including that adding is optional and nothing is hunted for.
2. `L242` gains a hard check that its bottom line is `From: no line of your notes I can name.`
3. `L226` gains a hard check that the Khushbu peanut line is still cited.
4. One new ADR.
