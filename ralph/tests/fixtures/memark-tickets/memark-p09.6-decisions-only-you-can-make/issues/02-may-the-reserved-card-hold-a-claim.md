# 02 — May the reserved Card hold a claim?

**Type:** grilling

**Status:** resolved

**Blocked by:** none.

**Moved from:** phase 5.5 ticket 02. Renumbered, not rewritten.

**Reproduces on Haiku:** code behaviour, always. The model aimed a claim there in 6 of 10 runs.

Phase 4.6 left this as an open question and said it was not a ticket. The live pass has now watched
it happen on ordinary messages, so it is a ticket. It is a question about what a Card is for, so it
needs you and not an agent.

## What happened

`L34` sent `The wifi is still causing issues. We might want to cancel it afterall`. The model wrote
a Note rather than a Task, which is the right call and is what that row exists to check: `we might
want to` has decided nothing, and a Task off it would claim a commitment nobody made.

Then it filed the Note to `Loose Ends`, and the Note landed:

```
areas/loose-ends.md gained: ## Notes || - The wifi is still causing issues—we might want to
cancel it · from:: [[inbox/2026/08/2026-08-27#^8685]]
```

That created a `## Notes` section on the reserved Card. `L9` aimed a second claim at the same place,
`plumber quote is 4200, not 3800`. That one never landed, but only because a Contradiction elsewhere
in the same ramble held its whole batch back, which is the subject of ticket 03 in this folder.

## Why code allowed it

`memark/vault/apply.py:2083`:

```python
if edit.subject is None:
    if not (edit.task or edit.is_a_date):
        raise Refused("it names no subject and is not a Task, so it has no Card to go in")
    reserved = _loose_ends(rows)
    return Target(name=reserved.name, row=reserved)

name = edit.subject
```

The refusal that keeps a homeless claim out of the Vault is inside `if edit.subject is None`. The
reserved Card is also an ordinary Registry row, `[[areas/loose-ends.md|Loose Ends]] anything that
belongs to no subject`, and the filing call is shown the Registry. So a model that writes
`subject: "Loose Ends"` instead of `subject: null` never reaches the refusal. It falls through to
ordinary name matching, matches the row, and the claim is written.

Nothing here is a bug in that branch. Both halves do what they say. The gap is that one route into
the reserved Card is governed and the other is not, and no decision says which is right.

## What the documents say

`CONTEXT.md` gives the Card a narrower job than the code now permits:

> **Loose Ends**: The one Card reserved by name, holding anything that belongs to no subject, a
> Task the agent inferred from a Capture that named nobody, and the errand a Review Date points at
> when there is no subject to point at.

A Task and a date. Not a claim. Phase 4.6's spec said the same thing and drew the same line:
"Answering the other way would mean `areas/loose-ends.md` takes claims as well as errands, which
changes what that Card is for and belongs in `CONTEXT.md` before it belongs in code."

ADR 0034 is the other side of it. That Card already never shrinks, and the ADR is largely about the
cost of its growth: retrieval noise from unrelated vocabulary, and tokens on every filing call that
touches it. Claims would add a second kind of line that also never leaves.

## Reproduction

`python -m harness.live.repeat L34:notes L9:notes --runs 5 --also claude-opus-5`

| Row | claude-haiku-4-5 | claude-opus-5 |
| --- | ---------------- | ------------- |
| L34 | 3 of 5 | 0 of 1 |
| L9 | 3 of 5 | 0 of 1 |

Six of ten. This is not a rare path, and the code behaviour behind it holds on every call whatever
the model says. Opus wrote `subject: null` both times and had its claim refused, which is the
behaviour the prompt asks for. Per ADR 0003 filing runs on the cheap tier, so the comparison says
the prompt is thin here and never that the tier should change.

## A second route to the same question

Added 2026-09-07, and not from the pass. Found by hand while looking at a running harness, so read
the counts below as a hand probe and never as pass rows. The bundle has no scenario for this
message yet.

The message was `Mehul is my office manager. I work at Simform solutions`, typed into a harness
window on the `baseline` fixture. The filing run applied one edit and one only:

```
people/mehul.md gained: ## Facts || - office manager at Simform Solutions · from::
[[inbox/2026/09/2026-09-08#^d15a]]
```

`refused=0 held_back=0`, and the Digest said `0 rejected`. So nothing was kept back and nothing was
turned down. The second sentence simply produced no edit. Four runs of that message on
`claude-haiku-4-5`, the window plus three repeats, all came back with exactly one edit, always on
Mehul. `Simform Solutions` survived only as words inside Mehul's line or its Registry note.

Sent on its own, the same fact has no settled home. `I work at Simform Solutions and I am the
manager there`, three runs, three answers:

| Run | `subject` | `card_kind` | `heading` | What happened |
| --- | --------- | ----------- | --------- | ------------- |
| 1 | the person's own name | `person` | `Facts` | written, a new Card for the person themselves |
| 2 | the person's own name | `person` | `Notes` | refused, `Notes` offered as a Proposed Heading for `person`, the Capture left queued |
| 3 | `Loose Ends` | `area` | `Notes` | written, this ticket's path |

Discount the name in runs 1 and 2. The CLI mode guessed it from the machine's login and the box's
own prompt carries no name. What matters is the spread: one sentence, three destinations.

## Why it belongs in this ticket

The claim names nobody the Registry can hold. The person sending the Captures is the subject every
Capture is implicitly about and the one subject the Vault has no Card for, so a first-person claim
has the same problem as the wifi Note and reaches the reserved Card by the same route. Run 3 is not
the model misreading the prompt. It is the model with nowhere to put a claim, matching the one row
whose Registry note reads `anything that belongs to no subject`.

That widens the question below rather than changing it. Whichever of the three ways is taken has to
cover a claim about the person as well as a claim about nothing, and those are not obviously the
same case: the wifi Note belongs to no subject, while `I am the manager at Simform Solutions`
belongs to a subject the Vault has decided not to have. Someone answering this may want to weigh a
fourth shape, a Card for the person themselves, and that is a decision for you and not for an
agent.

## Reproducing the second route

No checked-in scenario covers it. The probe was a `LiveDriver` on `baseline`, clock at
`2026-09-08T09:00:00+05:30`, one `send`, then `step(FILING)`, reading `driver.edits()` and the run's
own log line. Anyone who wants a rate rather than a spread should add the two messages to
`harness/live/scenarios_p05.py` and run them through `harness.live.repeat`.

## Question

Three ways to go, and they are not equally cheap.

**The Card takes claims.** `## Notes` on `areas/loose-ends.md` becomes a real section, `CONTEXT.md`
is amended to say so, and the answer to phase 4.6's open question is yes. It gives a homeless
thought somewhere to live, which today it has nowhere to be. It also adds a second kind of
never-shrinking line to the one Card ADR 0034 already worries about the size of.

**The Card takes only a Task or a date, and code enforces that.** The refusal moves off
`subject is None` and onto the destination, so a claim aimed at the reserved Card is refused
however it got there. Then a thought like the wifi one is refused and unfiled, and the person's
words stay in the inbox and reach no Card. That is what happens today for a null subject, so this
choice makes the two routes agree rather than changing what anyone can file.

**The prompt is told to stop naming it.** Cheapest, and weakest. It leaves the route open and
depends on the cheap tier following an instruction it followed 4 times in 10 here.

One question sits under all three. When a person says something that names nobody and asks for
nothing, is that a thing this system keeps, or a thing it deliberately drops? Answer that and the
rest follows. Nothing should be implemented until it is answered, and an agent must not answer it.

## Answer

**The second way. The Card takes only a Task or a date, and code enforces that.** A homeless claim is
refused, and the refusal moves off `subject is None` and onto the destination, so a claim aimed at
`areas/loose-ends.md` is refused however it got there. Both routes into that Card then agree, which is
the gap this ticket found.

### Why dropping is not losing

Nothing is thrown away, so "drop" is the wrong word for what happens. A refused claim is unfiled, and
an unfiled Capture stays in the queue, so the Digest asks about it. ADR 0037, an unanswered question is
parked never abandoned, sets that rhythm and it is unchanged here: the Digest asks up to fourteen times,
then the block Parks and the asking stops. The words are never deleted or moved. ADR 0028, conversation
finds Cards by matching words, already ranks over inbox Capture blocks as well as Card bodies, so the
wifi sentence stays findable by word and by date whether or not any Card holds it.

So the refusal hands the thought to the Digest instead of to a Card. It does not discard it.

### Why the Card must not take claims

ADR 0034, a closed Task is hidden from the model and never reopened, records that this Card never
shrinks, and ticket 20's amendment to ADR 0028 already had to strip closed Task lines out of the search
corpus, because `areas/loose-ends.md` is the one Card guaranteed to be a grab bag of unrelated
vocabulary and left whole it becomes a permanent noise floor that can outrank the Card holding the
answer.

That strip works only because a Task closes. **A Note never closes.** Claims on this Card would rebuild
the same noise floor out of lines that no strip can ever remove, and this time with no way back. That is
the argument phase 4.6 was missing when it left the question open.

### The person is a subject after all

The second route in this ticket asked a wider question and it is answered the other way. `I like ice
cream` names nobody the Registry holds, but it is not homeless. It is about the one subject the Vault
had no Card for.

**The person gets a reserved Card, and the routing rule is: put the claim on the subject it names; the
person is the subject only when the claim is about them and names nobody else.** So `Mehul is my office
manager` still goes to Mehul. `I work at Simform Solutions` still goes to Simform. `I like ice cream`
goes to the person's Card. `The wifi is still causing issues` is about nobody, so it is refused and the
Digest asks.

Decided in principle here because this ticket had to cover it. The shape, the name, the Registry row and
the `CONTEXT.md` wording are ticket 05 in this folder.

### What changes

- `memark/vault/apply.py:2083`. The refusal moves onto the destination. A claim naming `Loose Ends` is
  refused the same way a claim with a null subject is.
- `CONTEXT.md`. The Loose Ends definition stands as written, a Task and a date and not a claim, and
  gains a sentence saying a claim aimed at it by name is refused rather than matched.
- Ticket 03 in this folder is unblocked. Its fourth state is named against a Vault that does not keep a
  homeless claim.
- [Phase 5.5 ticket 05](../../memark-p05.5-days-and-the-reserved-card/issues/05-a-task-about-somebody-new-files-nothing.md)
  is unblocked.

- **Amended by [ticket 03](03-should-a-capture-be-filable-in-parts.md).** The "dropping is not losing"
  argument above holds only when the refused claim is its Capture's only edit. A Capture drains when any
  one of its groups writes, at `memark/vault/apply.py:1906`, so a homeless claim sent in the same message
  as one fact that files is dropped in silence and no Digest ever asks about it. Ticket 03 closes that: a
  Capture now drains only when nothing derived from it is owed an answer. Nothing about where a homeless
  claim goes changes. What changes is that it stays asked about, which is what this answer assumed.

### What did not change

The fourteen-Digest count stands. It was raised in this session and left alone on purpose, so this
ticket decides what the Vault keeps and not how often the box asks.

### Rejected

**The Card takes claims.** Rejected for the never-closing Note argument above.

**Tell the prompt to stop naming it.** Rejected. It leaves the route open and rests on the cheap tier
following an instruction it followed 4 times in 10 here. Per the map's standing preference the prompt is
still worth improving, but it is not the answer.
