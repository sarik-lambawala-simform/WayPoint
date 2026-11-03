# 05 — The prompt never states which edits have no home, so the model writes ones code must refuse

**Status:** completed

Status: resolved

**Completed at:** 2026-09-04T07:29:52Z

**Blocked by:** 01 — A bare pronoun is resolved to a person, and ADR 0015's safeguard cannot see it

**Owned by:** phase 3. `INSTRUCTIONS` in `memark/distillation.py`.

**Found by:** the live-model pass, scenario L17.

## What happens

`apply.py:1409` refuses an edit with a null subject that is neither a Task nor a dated line:

```python
if edit.subject is None:
    if not (edit.task or edit.is_a_date):
        raise Refused("it names no subject and is not a Task, so it has no Card to go in")
```

The refusal is correct and it is named, so nothing is lost or silent. The Capture is held back and
the refusal is counted.

The prompt never states the constraint. It says:

> When a Capture names nobody and nothing, write `subject` as null. A Task from it goes to the Card
> reserved for anything that belongs to no subject, and code puts it there.

That describes what happens to a Task. It does not say that a null subject is only ever allowed for a
Task or a line naming a day, so a model reading it honestly can return a null-subject claim.

L17 did. Sent `what was the plumber's number again` and `found it, it's on the fridge`, the model
returned one edit: `subject: null`, `heading: Notes`, `task: false`. It had no home, it was refused,
and both Captures in the batch were held back.

## Why this is small, and why it is still worth a ticket

The cost is a wasted edit and a Capture held back for a reason the person cannot see from the chat.
It is not data loss. It is worth fixing because the fix is one sentence in a prompt and the current
wording invites the mistake.

## Why this is blocked by 01

Ticket 01 teaches the model to ask rather than resolve a pronoun it cannot pin to one person. A model
told to stop naming a person has an obvious wrong turn available: return a null subject instead. That
is exactly the shape this ticket forbids. The two sentences have to be written against each other and
tested together, so 01 lands first.

## Scope

This ticket is the prompt sentence only. It does not change what `areas/loose-ends.md` is for.

There is a larger question behind it, and it is deliberately not here: a null-subject claim is a real
thing a person says. `found it, it's on the fridge` belongs to nobody and is not an errand, and today
it has nowhere to go at all. Whether the reserved Card should accept a claim as a Note is a change to
what that Card means, which is a decision for a person. It is recorded in
[../spec.md](../spec.md) under open questions and must not be answered by implementing this ticket.

## Done when

- [ ] The filing prompt states that a null `subject` is allowed only for a Task or for an edit naming
      a day, and that a claim about nobody is not proposed.
- [ ] A live-model scenario sending a subjectless claim, `found it, it's on the fridge`, returns no
      edit that `apply` would refuse for having no home, on `claude-haiku-4-5`, five runs out of five.
- [ ] A Capture with no subject that is an errand still returns a Task with a null subject and still
      lands on the reserved Card. This ticket must not stop the case that already works.
- [ ] A Capture with no subject that names a day still returns a dated edit with a null subject.
- [ ] The refusal in `apply.py` is unchanged. The prompt stops the edit being proposed; code stays the
      thing that refuses it if one arrives anyway.
- [ ] A test at the filing seam with a scripted null-subject claim, pinning that it is refused by name
      and that the Capture is held back rather than drained.
