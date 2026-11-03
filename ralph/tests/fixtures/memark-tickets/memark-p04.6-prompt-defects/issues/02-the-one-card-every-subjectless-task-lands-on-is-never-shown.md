# 02 — The one Card every subjectless Task lands on is never shown to the model

**Status:** completed

Status: resolved

**Completed at:** 2026-09-04T07:04:16Z

**Owned by:** phase 3. `_cards_named_by` in `memark/filing.py`.

**Found by:** the live-model pass, scenarios L10 and L13.

## What happens

`_cards_named_by` shows a Card's body when the Card's Registry name, or an alias its row carries,
appears in the words of a Capture in the batch. Nothing else is shown.

`areas/loose-ends.md` is the reserved Card. Per `apply.py:1409` every edit with a null subject that
is a Task or a dated line goes there, and code picks it rather than the model. So it is the Card that
receives every errand belonging to nobody, and it is also the Card whose name nobody ever types. A
person writes `need to renew the car insurance`, not `loose ends`. The name never appears, so the
body never ships.

The result is that the one Card guaranteed to collect Tasks from unrelated Captures, week after week,
is the one Card the model can never read before adding to it.

This is the failure the module docstring already names as the reason bodies are shown at all:

> showing none is what the phase before this one did: the model proposed a line from a Registry row
> alone and could not tell it was repeating one the Card already carried.

That is still true for `areas/loose-ends.md`.

## Reproduction

The L13 prompt, sent for the Capture `need to renew the car insurance`:

```
## Cards these Captures name

(none of these Captures names a Card that exists)

## Captures

- ^5bc4 2026-08-27 09:14 need to renew the car insurance
```

The baseline `areas/loose-ends.md` carries an open Task at that moment. The model is not shown it,
and the edit it returns lands there.

L10 is the consequence end to end. The baseline carries `chase the plumber for the quote` on Loose
Ends. A Capture saying `chase the plumber for the revised quote` was filed as a second Task on the
same Card, and that evening's Digest listed both:

```
**Open**
2. book the deep clean the week after next
3. chase the plumber for the revised quote
4. chase the plumber for the quote
```

## What should happen

The filing prompt already carries the rule:

> The Cards below are shown as they stand now, so read one before you add a line it already carries.

The rule is right. It cannot apply to a Card that is never below. Because code, not the model, is
what routes a null subject to `areas/loose-ends.md`, code is what knows the Card is in play, and it
knows it before the call rather than after.

The cost objection is answered by work already done. ADR 0002's cost ladder is why bodies are narrow,
and Loose Ends is the Card most likely to grow. But bodies already arrive through `vault/view.py`,
which strips closed Tasks per ADR 0034, and `filing.py`'s own docstring notes that the ticked half of
`areas/loose-ends.md` is never paid for. What would ship is its open Tasks, which is bounded by the
number of errands actually outstanding.

## Done when

- [ ] `areas/loose-ends.md` is shown to the filing call, through `vault/view.py` like every other
      body, whether or not a Capture in the batch names it.
- [ ] A Capture proposing a Task that the reserved Card already carries does not produce a second
      near-identical Task. Which existing path settles it, a `contradict` or the model simply not
      proposing, is the model's call and this ticket does not force one.
- [ ] Every other Card is still shown only when the batch names it. This ticket adds one reserved
      Card and does not widen the rule.
- [ ] A Vault whose Registry has no Loose Ends row still files. `_loose_ends` already refuses by
      name, and adding a body must not turn that refusal into a raise before the call.
- [ ] A Loose Ends Card that will not parse is left out and logged, the same as any other unreadable
      Card, rather than costing the batch.
- [ ] A test at the filing seam asserting the reserved Card's body is in the prompt for a batch whose
      Captures name nothing.
