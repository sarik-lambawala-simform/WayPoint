# 07. Which pieces may a typed date come off?

**Type:** grilling

**Status:** resolved

## Question

ADR 0050, a typed date is tested on its piece and code works out its day, confirms a date only when
**exactly one** claim piece names the date edit, and that edit cites **one** Capture. This is the
guard that stops a list of ten errands from confirming nine guesses. See `_typed_on_their_piece`
in `memark/vault/apply.py`.

The live pass found the guard refusing dates the person plainly typed. The model often cuts a
warning, or the date, into a piece of its own, and names the date edit on both pieces:

    P 'Pay the property tax on 15th october'  claim [0, 1]
    P ', '                                     skip
    P 'remind me 2 days before'                claim [1]

Edit 1 came off two pieces, so the date waits for a yes and the warning schedules nothing. Only one
of the two pieces states a date.

| row | words | date waits for a yes |
| --- | --- | --- |
| `L307` | `Pay the property tax on 15th october, remind me 2 days before` | 7 of 15 |
| `L316` | `Diwali ki shopping 20th Oct ko, ek hafta pehle yaad dilana` | 3 of 5, and 3 of 3 on `claude-sonnet-5` |
| `L375` | `Nov 3rd ku gas booking pannanum, 2 naal munnadi sollu` | 3 of 3 |
| `L321` | `meeting with CA on the 4th, carry form 16 and PAN copy` | 2 of 3 on `claude-sonnet-5` |
| `L337` | the hand blender errand sent twice, one batch | 3 of 3, because one edit cites two Captures |

This is most of why `L307` fails its bar of at most 1 of 10. Both tiers do it, so a prompt change
alone is unlikely to hold.

Which of these, if any, may confirm a date?

- **An edit that came off several pieces of one Capture, where exactly one of them states a date,**
  and that date is the edit's day. The other pieces state no date.
- **An edit that cites several Captures, where every cited Capture's piece states the same day.**
  The same errand sent twice.
- **Neither.** Keep the guard, and change the filing prompt so the date edit names only the piece
  with the date in it.

Settle also:

- Does the safety argument in ADR 0050 still hold for the first option? A list where the model
  names one errand's date edit on another errand's piece and on the date's piece would now confirm.
- What `L327` and `L376` need, where the next message corrects the day. Today the taken-back day
  was confirmed in 1 of 3 runs.

## Answer

Grilled on 2026-10-01. Written down as ADR 0055, a typed date may come off more than one piece,
when code can prove whose it is: [../../../docs/adr/0055-a-typed-date-may-come-off-more-than-one-piece.md](../../../docs/adr/0055-a-typed-date-may-come-off-more-than-one-piece.md).

- **Several pieces of one Capture: yes, with a check.** Exactly one piece states a date, and code
  reads the model's day from it. Every other piece the edit came off names only edits the dated
  piece names too. Fixes `L307`, `L316`, `L375`. Refuses `buy milk, call mom on 8 oct` when the
  milk date edit is named on both pieces, because the milk piece names the milk Task.
- **Several Captures: yes.** Each cited Capture passes alone, and all give the same day. Fixes
  `L337`.
- **No prompt change.** Both tiers make the cut. The check makes it harmless.
- **Two days for one errand: both asked.** Two dated edits in one batch with the same `subject`
  and `heading` but different days are both Proposed Dates. Fixes the old day in `L327` and
  `L376`. The new day is asked too, because the fix message holds two date shapes. That is
  accepted, not a bug.
- **ADR 0050's safety argument holds.** Anything no rule names stays a Proposed Date, so a case
  nobody has met costs one Digest question and never a wrong reminder.
- `CONTEXT.md` is unchanged. No new domain word: a piece is a filing detail, not a domain term.

Build: `_typed` in `memark/vault/apply.py`. The `L376` bar in `harness/live/` expects no
confirmed day, and the new day waiting for a yes is a pass.
