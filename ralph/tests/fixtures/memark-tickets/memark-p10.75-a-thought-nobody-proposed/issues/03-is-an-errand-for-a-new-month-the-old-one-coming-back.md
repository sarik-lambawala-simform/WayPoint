# 03 — Is an errand for a new month the old one coming back?

**Type:** grilling

**Status:** resolved

**Blocked by:** none. Ticket 04 waits on it, because 04 is the work this decision names.

## Question

`again-of::` now fills. That is the win of phase 10.7 and it is worth saying first: the field went
from 0 of 24 under the old string match to filling on every row that should fill, including across
files and across folders. `L162` linked "activa insurance renewed" to the closed "renew the two
wheeler insurance". `L163` linked a Rajkot ticket on Mummy's Card. `L164` linked a packers quote on
a project Card with none of the same words in it.

`L165` fills it too, and that is the question. The message is:

> must send nikhil the september estimate sheet before the review

Nikhil's Card carries a closed Task, "share the estimate sheet with him", ticked on 2026-08-21 for
last month's estimate. The model answered `finished: e330` and the new Task went in carrying
`again-of:: [[people/nikhil-simform#^e330]]`.

By wording it is the same errand. By intent it is not: one sheet was August's and one is
September's. A monthly errand, a quarterly filing, a yearly renewal, the LIC premium, the
two-wheeler insurance, a bus ticket to Rajkot, all of these come round again and will match
themselves every single time.

So: what should `again-of::` mean?

Two readings, and the phase does not pick between them:

**It means the words repeat.** Then `L165` is correct and the field is cheap and honest, and the
work is all in the Digest: it has to say "you have said this before" and never "you did not finish
this". The Digest's wording is explicitly out of phase 10.7, which is where this lands.

**It means the errand came back undone.** Then `L165` is a false positive, the prompt needs a test
the model can actually apply to tell a repeat from a return, and the reading a person gets from an
errand that recurs on a schedule is wrong every time it recurs.

A third thing to weigh. ADR 0042 already carries recurrence as `RRULE`, so a monthly errand has a
shape in the Vault that is not a closed Task at all. Whether a repeat that matches itself should
read as a returning errand or as a rule nobody has written yet is part of the same question.

This one needs the Vault's owner, because the answer is what they want to read in a Digest, and no
rate settles it. `L165` prints its link and scores nothing until it is answered.

## The decision

**The field means the words repeat. It is renamed `same-as::`.**

`L165` is correct and stays correct. The link says two Card lines are the same errand and says
nothing about whether anything was left undone.

The second reading was refused for a reason the model cannot argue with: it has no way to know. It
is shown a closed line and a new one and asked whether they are the same errand. Whether August's
estimate sheet was really sent, and whether September's is therefore a fresh job, is not in
anything it reads. ADR 0034 as amended already put this judgement on the model because no rule over
letters can make it. Asking that same call for a fact it was never given is a different thing, and
it would fail silently on exactly the errands that repeat most.

So the honest field is the cheap one, and what has to be careful is the sentence a person reads.

**The Digest rule, written before the Digest line exists.** `memark/digest.py` reads the field
nowhere today, which is why nothing has gone wrong yet and why the rule is cheap to write now. When
the Digest does show a `same-as::` link it says the person has written this before. It never says
they did not finish something. Phase 9.6's ticket 04 left this open in as many words, and this
closes it.

**The name changes because nothing is in production.** There is no Vault out there holding the old
key, so the rename costs an edit and no migration. `again-of::` is the write-side half of the
reading being refused, and a field whose name argues with its own ADR is the shape of defect that
produced tickets 01 and 02 of this phase: a line that outlived its decision.

`same-as::` over `repeat-of::` because ADR 0042 already spends `repeat::` on the iCalendar rule of
a recurring Review Date, and two keys built on the same word in one grammar is a trap. `same-as::`
over `said-before::` because every other key in ADR 0026 describes the line, not the person.

**`L165` stops printing and starts scoring.** An unscored row protects nothing, and this is the row
a later reader is most likely to "fix" back. The monthly example added to the prompt is a different
errand from `L165`'s, so the row still measures the model rather than the prompt.

## What this changes outside this ticket

**ADR 0034 is amended a third time.** The meaning, the rename, and the Digest rule. The two
sentences under "Closing is terminal" that this touches stay on the page. The amendment is appended
rather than edited in, because the reason the field meant two things is the finding of `L165` and
deleting it would delete the finding.

**ADR 0026 is edited in place.** It enumerates the field keys and nothing more, so the key is
swapped.

**CONTEXT.md gains no term.** No field key has a glossary entry and this one does not start. The
Task entry's sentence about an errand that returns is reworded.

**The Python names follow the field.** `memark/returning.py`, `Returning` and `returning_errands()`
all speak the reading that was refused.

**Not decided here, and deliberately.** After the third `same-as::` on one errand the box could
offer to write it as a repeating Review Date under ADR 0042, confirmed by one tap. That is real and
it is not this phase: it needs a count, a new Digest offer and a tap flow. It is recorded in
`map.md` as fog with a name, and it is nobody's ticket yet.

**Ticket 04 has its input.** The shape it needs is: rename the field and the module, cut the one
prompt sentence that carries the refused reading and add a monthly example, amend ADR 0034, edit
ADR 0026, reword CONTEXT.md, score `L165`.
