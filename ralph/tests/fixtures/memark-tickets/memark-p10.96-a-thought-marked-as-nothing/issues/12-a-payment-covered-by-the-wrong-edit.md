# A payment covered by the wrong edit

Type: grilling
Status: resolved
Blocked by: 11

## Question

Ticket 11 fixed the `skip` loss on `L211` and a second loss showed up in its place. On 2 of 5
runs the payment sat in a `claim` piece that named an edit, the reassembly check passed, and the
Capture drained. That is phase 10.9's `covered:` shape, and ticket 10 saw it on 0 of 10. The runs
are in [../finding.md](../finding.md), under "Ticket 11: the scope said where the mark is chosen".

Two questions, in this order:

1. **Is run 4 a loss?** The edit was `paid 8k for this month`. The probe `L211:where` keys on
   `gpay`, so it scored `bad`. If a payment filed without how it was paid counts as filed, the probe
   is too strict and the real rate is 1 of 5. Changing the probe's words is a change to the guard,
   so it is decided here and not done quietly.
2. **What does the box do about run 2?** One `claim` piece over the whole message named only the
   wage edit, `monthly wage is 8500, was 8000`. Is this ticket 11's wording pushing the payment into
   a `claim` piece that another edit then covers, or phase 10.9's defect coming back at its own
   rate? A same-clock run against ticket 10's prompt answers that before anything is re-worded.

The constraint from ticket 06 holds: no test row's own words go into the prompt.

## Answer

**Run 4 is a loss, and run 2 is not this map's.** Decided on 2026-09-24. The runs are in
[../finding.md](../finding.md), under "Ticket 12: the same clock, ten runs a side".

1. **The probe stays strict.** `L211:where` keeps keying on `gpay`, so a payment filed without how
   it was paid scores `bad`. Two reasons. The row's own hard check, `the dropped claim is crossed
   out`, keys on `gpay` and belongs to phase 10.85, so it cannot change, and a looser probe would
   measure something the gate does not. And `gpay` is a word the person typed: a Lookup for it
   finds nothing if the edit left it out. Ticket 11's rate stands at 2 of 5.
2. **Nothing is done about run 2.** Ten runs a side on the same clock put `covered:` at 0 of 10 on
   ticket 11's prompt and 0 of 10 on ticket 10's. It is phase 10.9's defect at its own low rate,
   not ticket 11's wording pushing the payment into another edit's piece.

The same run turned up what matters more. Ticket 11's `skip:` fix does not reproduce: 5 of 10 on
its prompt against 6 of 10 on ticket 10's. That is a new question, filed as
[13-the-payment-still-comes-back-skip.md](13-the-payment-still-comes-back-skip.md).
