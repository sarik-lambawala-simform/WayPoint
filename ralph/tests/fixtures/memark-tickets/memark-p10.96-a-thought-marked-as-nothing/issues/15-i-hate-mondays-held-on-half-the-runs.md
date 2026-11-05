# I hate mondays is held on half the runs

Type: grilling
Status: resolved
Blocked by: 14

## Question

Ticket 14's wording writes the payment on 10 of 10 runs of `L211:where`, and no claim about the
person came back `skip`. It missed one bar. `L126:mark` and `L153:mark` together were 5 of 20
against a bar of at most 1. All five failures are `L126:mark` marking `I hate mondays` as `claim`,
so the Capture is held and the evening Digest asks about it. The runs are in
[../finding.md](../finding.md), under "Ticket 14: a thing done to somebody goes on their Card".

Two things are open, and the first decides how to read the second.

1. **Did ticket 14's wording move the rate?** Before it, `L126:mark` was 1 of 5 twice. Those runs
   were on other days, so they do not settle it. Run `L126:mark` ten times a side on the same clock:
   ticket 13's prompt, which is ticket 14's two edits taken back out in a scratchpad copy, against
   ticket 14's prompt. This is the method of "Ticket 12: the same clock, ten runs a side".
2. **Does a hold on `I hate mondays` count against the bar?** Ticket 07 ruled that both readings
   are allowed, because the person would still say it next month. A taste marked `claim` with no
   edit is held, so the Digest asks the person each time. Is that the allowed reading or a cost?

The answer names one of: keep ticket 14's wording and read the `L126:mark` misses as ticket 07's
reading; or change the wording, with the bar it must meet. The payment's 0 of 10 must not move.

The constraints hold. No test row's own words go into the prompt (ticket 06). `L126` is not edited
(the map's standing preference). ADR 0014, the model proposes edits and code applies them.

## Comments

**Part 1 is measured: ticket 14's wording did not move the rate.** Ten runs a side on the same
clock, 2026-09-25. `I hate mondays` was marked `claim` on 6 of 10 runs of ticket 13's prompt and 4
of 10 of ticket 14's. No other clause failed on any run. The table is in
[../finding.md](../finding.md), under "Ticket 15: `I hate mondays` on the same clock".

Part 2 is open and needs the user.

## Answer

**Keep ticket 14's wording, and read the `L126:mark` misses as ticket 07's reading.** Decided with
the user on 2026-09-25.

**Did ticket 14's wording move the rate? No.** On the same clock, ticket 13's prompt held `I hate
mondays` on 6 of 10 runs and ticket 14's on 4 of 10. The clause is held on about half the runs
whatever the wording, and no other clause of the mood failed on any of 20 runs.

**Does a hold on `I hate mondays` count against the bar? No.** Ticket 07 ruled that both readings
are allowed: the person would still say it next month, so it can be a taste. A taste marked
`claim` is held, and the evening Digest asks about it once. That is the allowed reading, not a
cost worth a new wording. A wording that calls a complaint about a day a passing mood would put
two measured wins at risk: 0 of 15 preferences dropped, and the payment written on 10 of 10 runs.

**What this hands to the spec.**

- The prompt stays as ticket 14 left it.
- The mood bar is not read off `L126:mark`. Its `I hate mondays` holds are expected. The mood
  row with no taste clause, which ticket 07 handed to the spec, carries the no-regression check.
- `L126` is not edited, per the map's standing preference.

No ADR is written and no word in `CONTEXT.md` changes. This repeats ticket 07's ruling on one row.
