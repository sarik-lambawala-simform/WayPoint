# 05 — A Task about somebody new files nothing, and the prompt sends it there

**Status:** needs-triage

**Reproduces on Haiku:** structural, always. No rate measured. Code refuses this on every call and
no model is needed to see it.

A Task whose subject has no Registry row is refused unless some other edit in the same batch
opens that Card. `need to ping Mehul about office seating` is one edit, it opens nothing, and the
Capture files nothing. The prompt tells the model to put a Task about a person on that person's
Card and never says a person the Registry does not carry cannot hold one.

## What happened

Not from the pass. Found on 2026-09-08 while fixing ticket 04, from a probe driving
`scheduled_run` over the `baseline` fixture with a stub model, so read it as a code-level
reproduction and not as a pass row.

One Capture, `need to ping Mehul about office seating`, and one edit: `subject` `Mehul`,
`card_kind` `person`, `heading` `Tasks`, `task` true, `registry_note` `somebody at the office`.
The run logged:

```
INFO memark.vault.apply: refused an edit about 'Mehul': `Mehul` has no Card and no Card is
opened to hold a Task, so a Task that belongs to nobody goes to Loose Ends and nowhere else
INFO memark.run: filing run: queued=1 batches=1 drained=0 cards_created=0 refused=1 held_back=0
```

No `people/mehul.md`. The block kept no `filed::`, so that evening's Digest lists it under
`**Not filed**` and the next filing slot sends it again.

The pair from ticket 04 is worse, because both halves go. Same Capture with `tomorrow` on the end
and the two edits ticket 04's fix now asks for:

```
INFO memark.vault.apply: refused an edit about 'Mehul': `Mehul` has no Card and no Card is
opened to hold a Task, so a Task that belongs to nobody goes to Loose Ends and nowhere else
INFO memark.vault.apply: refused a date proposed about 'Mehul': `Mehul` has no Card, and a dated
line names the Card it is about
INFO memark.run: filing run: queued=1 batches=1 drained=0 cards_created=0 refused=2 held_back=0
```

A date proposal is not a claim, so it does not open a Card either. Between them the two edits
name a person, an errand and a day, and nothing at all is written.

## Why code refuses it

`memark/vault/apply.py:2110`, in `resolve`:

```python
if edit.task and name not in opening:
    raise Refused(
        f"`{name}` has no Card and no Card is opened to hold a Task, so a Task that "
        f"belongs to nobody goes to Loose Ends and nowhere else"
    )
```

`opening` is built at `memark/vault/apply.py:2025` from the targets already grouped, and the
grouping resolves the claims before the Tasks so a Task can land in the Card a claim beside it
opened. That is deliberate and `CONTEXT.md` backs it: a Card is opened because something was
said about a subject, never to hold an errand, which is what `areas/loose-ends.md` is for.

So the rule is not obviously wrong. What is wrong is that nothing tells the model about it, and
the outcome when the model does not guess it is that the Capture files nothing.

## Why the model proposes it

`memark/distillation.py:328`:

```
- `task` is true when the line is something to do. A Task belongs to the subject the Capture is
about, so a Task from a Capture about a person goes on that person's Card.
```

`remind me to ping Mehul about office seating` is a Capture about a person, so that sentence
reads as saying the Task goes on Mehul's Card. The Registry rule beside it says to read the
Registry before proposing a new subject, which is about spelling and aliases and not about what
a new subject may hold. Nothing anywhere says a Task needs a Card that already exists or a claim
opening one.

## What it costs

The same as ticket 04: a delay, one wasted model call per retry, and one `**Not filed**` line in
a Digest the person already read. A Capture with no `filed::` stays in the queue per
`memark/filing.py:25`, so it is sent again at the next slot. Nothing is lost and no wrong line is
written.

It does not heal the way ticket 04's did, though. Ticket 04 healed because the model worded the
next run differently and the second wording was filable. Here every wording that names the new
person is refused, so the Capture is retried at every slot until the model gives up on the person
and sends the Task to `Loose Ends`, or until the person is mentioned again in a Capture carrying
a claim. A Capture the box files nothing for is only parked by the Digest asking about it
`PARK_AFTER` times, so the retries are not cheap.

## The decision this needs

Three answers, and this is a question about what the design intends rather than a bug to patch.

**Say it in the prompt.** A Task about somebody the Registry does not carry needs a claim beside
it that opens the Card, or it goes to the reserved Card with a null subject. This changes nothing
in code and matches ticket 04's shape. It puts a rule about `opening` into the prompt, which is
a rule about how the write path batches edits, and no other prompt rule reaches that deep.

**Let a Task open a Card when it carries a `registry_note`.** The note is the line describing the
subject, and an edit carrying one is saying who this is. This is a code change and it weakens the
rule that a Card is never opened to hold an errand.

**Send it to the reserved Card.** Code already knows the answer it wants, and the refusal message
says it out loud. Rewriting the target instead of refusing would file the errand and lose the
person's name, which is the failure `Do not answer a pronoun any other way` was written to stop.

Phase 9.6 ticket 02, [May the reserved Card hold a claim?](../../memark-p09.6-decisions-only-you-can-make/issues/02-may-the-reserved-card-hold-a-claim.md),
is the decision under this one. It asks what `areas/loose-ends.md` may hold, and the third answer
here would put more into it. This ticket is not buildable until that one is answered.

## Reproduction

No checked-in scenario covers it. `L3` sends `met sam at the school gate, he does kitchen fitting
apparently`, which is a claim and opens the Card, so it passes and says nothing about this.

The probe was `scheduled_run` over the `baseline` fixture at the noon filing slot with a
`StubModel` returning the one edit above. A live scenario would need a message naming a person
`baseline` has no row for, with an errand and no claim.
