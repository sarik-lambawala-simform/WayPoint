# 02 — Should the miss line have survived the picker?

**Type:** grilling

**Status:** completed

**Blocked by:** none

## Question

ADR 0043's rule 1 took word matching out of the Lookup. The miss line kept it. Decision 9 of phase
10.8 says so outright: "The miss line keeps its check without an index. Asking whether any unit
carries a word is a boolean, and code already holds the text."

The live pass says that boolean now answers a question nobody is asking.

`memark/lookup.py:680` asks whether any word of a subject is written anywhere in the Vault. When a
picker chose the material, a word nothing carried really did mean there was nothing to answer from,
and the line was the honest half of ADR 0028: finding nothing is an absolute rather than a weak
answer. The model is now handed every Card. It answers about the thing whether or not the person's
word for it is written down. So the line no longer reports what it says it reports: it reports
whether the Vault happens to spell a thing the way the question spelled it.

Ticket 01 takes out the easy half, which is common nouns reaching the line at all. What it cannot
take out is this:

> `?what did dr shah say about the crown` on a Vault whose Card says `the dentist wants to redo the
> cap`. `Dr Shah` is a real name in the Registry and `crown` is a real thing the notes hold under
> another word. The line fires on `crown` and the answer below it describes the cap.

That is the same failure with a name in it, and no prompt rule about subjects removes it.

**So the question is what the line is for now.** Three answers, and the pass gives evidence for
each rather than settling between them.

**Keep it as it is.** The stranger case is real and it is story 60: `L182` sent
`?Falguni ne tiffin vishe shu kahyu hatu` and the reply named Falguni, who this Vault has never
heard of. A person needs to know that. The cost is the false halves this pass found six of.

**Compute it after the answer rather than before it.** The answer names the Card lines it used and
code already checks each one exists. A subject none of those lines is about is a subject the answer
really had nothing for, whatever words the Vault spells it with. That makes the line a statement
about the answer instead of a statement about the vocabulary. It also makes the line depend on the
model, which ADR 0028's rule that code writes the line and the model never does was written to
prevent, and ADR 0043 kept.

**Ask the model, in the answering call, which of the named subjects it found nothing for.** Same
reading, one field, no second call. Same objection: the line stops being code's.

What has to come out of this is a decision, not a preference, because the reopen it touches is
named in a live ADR and the two rules it sits between were both written down on purpose.

## What the pass saw

Six rows of thirty one carried a false miss line. `L168:miss` reproduces 5 of 5 on
`claude-haiku-4-5` and 1 of 1 on `claude-opus-5`. The transcripts are in ticket 01.

One row carried a true one. `L182` named a stranger the Vault has nothing on, in the same sentence
shape, and that is the case any answer here has to keep.

## Where it goes

Answered here, in this phase, as its own ticket. It was first routed to the
[p09.6 map](../../memark-p09.6-decisions-only-you-can-make/map.md), whose ticket 07 took word
matching off the Lookup and whose ticket 09 wrote ADR 0043. That map is finished and its answers
are already built into p10.7 and p10.8, so reopening it would reopen work that shipped. The
decision this ticket reaches amends ADR 0043 from here instead.

## Answer

**The line stays, and it stops being a statement about the vocabulary. It becomes a statement about
the answer.** None of the ticket's three options is what gets built, because the second one does not
work and the third gives away more than it has to.

### What the line now promises

It promised "no Card and no Capture writes this word". A person read it as "the answer below has
nothing on this". Those were one fact while a picker chose the material, and ADR 0043, the model
reads the whole Vault, split them apart when it deleted the picker. Six rows of thirty one are that
split.

For a name the two promises are still the same fact, because a person has one name and a Vault that
never writes it holds nothing about them. For a common noun they come apart, because the thing has
other words. That is why every false line this pass found is a common noun and the one true line is
a name.

The line now promises coverage. The answer below found nothing on this.

### Why option 2 was rejected

It cannot be built as written. It says code checks whether the cited Card lines are about a subject.
Code cannot tell what a line is about without matching words, so `crown` against `the dentist wants
to redo the cap` fails exactly as it does today, one step later and at the same rate. Option 2 is
option 3 with the work hidden.

### Why option 3 was rejected

It asks the model which subjects it found nothing for. That is a question about absence, and
`memark/answering.py:85` already says why the model is not asked one: "a model asked to notice its own
silence is a model asked to be sure about what it does not hold." A confident model answers it by
saying nothing, and a line that is sometimes missing is one nobody can read the absence of. The
failure direction is wrong: today's bug prints a warning that is not owed, and option 3 drops one
that is.

The other half of that same sentence has died and should be recorded as dead. "The model is shown
the material and never the gap" was true of a picker and is false of ADR 0043: the material is now
the whole Vault, so absence from the material is absence from the Vault. The rule survives on its
second reason alone.

### What gets built

**Ask the model what it covered, never what it missed.** Code already holds the subjects, from the
Intent Read, per ADR 0032, intent is read by a model and applied by code. Code puts that list in the
prompt and the answering call hands back the ones it answered about, in one new field beside `lines`.
The question is positive, so nothing is asked of the model about absence.

**Code prints the miss line for a subject only when both are true.** The model did not report covering
it, and no word of it is written anywhere in the Vault. `_nothing_on` at `memark/lookup.py:680` is
untouched and keeps computing the second condition. It stops being what fires the line and becomes
one of two conditions on it.

That walks the two cases the pass measured. `crown` is absent from the Vault and covered by the
answer, so no line. `Falguni` is absent and covered by nothing, so the line fires, and it fires from
code rather than from the model's willingness to mention it.

**ADR 0028's rule that code writes this line and the model never does is kept whole.** It is not
amended and not bent. The shape is the one ADR 0043 already gave the sources line: the model names,
code confirms against the Vault, code writes the text. The new field is read the way `_lines_named`
at `memark/answering.py:290` reads `lines`, and anything not on code's own subject list is dropped.

**A missing or malformed field means the model covered nothing.** Every absent subject then gets a
line, which is today's behaviour and today's bug for that one reply. The direction is chosen and not
conceded: a warning too many is a nuisance a person can see, and a warning too few is the `L182` case
failing in silence. It is the posture `_lines_named` already takes, where a malformed footnote costs
the footnote and never the answer.

**The prompt block at `memark/answering.py:650` stays and changes what it claims.** It is headed
`## Already written above your answer` and that heading becomes false, because code no longer knows
the line before the call. It is not deleted: the word check still runs before the call, and showing
the model which words the Vault never writes is what keeps it from inventing a `Falguni`. Only the
claim changes, from a line already printed to a fact about the notes.

### What this does not touch

**Recall.** `nothing_on` is built in one place, `memark/lookup.py:416`, on the Lookup path. A recalled
window never had a miss line and gains none.

**The empty-Vault path.** `found_nothing` at `memark/answering.py:667` prints the miss line instead of
an answer and makes no call, so there is no coverage report to read and code stays alone there. It is
already right: a Vault that reached nothing covered nothing.

**The cheap tier.** The answering call runs on the strong tier per `memark/answering.py:248`, so the
new field is asked of `claude-sonnet-5` and carries none of ticket 01's cheap-tier risk.

**`CONTEXT.md`.** No word changes. The miss line has no entry there and needs none: what changed is
when a line is printed, not what anything is called.

### Where it is written down

ADR 0043's own paragraph, "The miss line keeps its check and loses its index", is what this ticket
found wrong, and it is amended in place. Nothing here overturns a decision. ADR 0043 deleted the
picker everywhere except that paragraph and missed it, and this completes the rule rather than
reversing it. A new ADR would file the correction away from the decision it corrects.

The amendment and the code are both work for
[ticket 08](08-turn-this-phases-answers-into-a-spec.md), which consolidates every answer in this
phase into one spec.

### What was raised and not built

A subject the model did not cover whose word the Vault does hold gets no line, because the second
condition blocks it. Under the old promise that was right and under the new one it is a gap. It was
left open on purpose: it needs the model to ignore something written in front of it, and nothing in
the pass shows that happening. `L184` at `harness/live/scenarios_p10_8_india.py:319` is named "one
question about two subjects at once". It asks about the society paperwork and the passports in one
sentence and was answered on both. Closing the gap means
dropping the second condition, and a model that under-reports what it covered would then print a
warning that argues with the answer below it, which is the measured bug this ticket exists to kill.
It is watched rather than filed, in `00-index.md`.
