# Measure the new `skip` wording on the filing tier

Type: task
Status: resolved
Blocked by: 01
Resolved by: the run of 2026-09-21; the bar is missed by one run and two rows go to fresh tickets

## Question

Nothing to decide. Ticket 01 settled what mark a turned-down claim carries and changed two bullets
in `memark/distillation.py`. The wording is in the prompt and **nobody has run it**. This ticket
produces the number.

This is the same split ticket 02 made when it handed its measurement to ticket 06, and for the same
reason: a ticket that measures and reacts will re-word the prompt until the number looks right.

## What changed, so you know what you are measuring

Two bullets, changed as a pair, per ADR 0048, `skip` means the words hold nothing that stands.

- The `skip` bullet no longer says the words "carry no claim at all". It says they hold nothing that
  stands, and it names a turned-down mood beside the greeting and the connective.
- The `claim`-with-no-edits bullet no longer says it is right "whenever you read a claim you could
  not place". It says it is right when you read something that stands and could not place it, and it
  says a claim you read and turned down is `skip` instead.

The code comment on `CLAIM` and `SKIP` moved with them. Nothing in the schema changed and there is
no third mark.

## How to run it

`claude-cli` mode, which is the default, so the before numbers compare directly.

    python -m harness.live.repeat L126:mark L153:mark --runs 5
    python -m harness.live.repeat L211:lost L223:lost L302 --runs 5

The probes already exist. `L126:mark` and `L153:mark` read `a_mood_held_the_capture`, written in
ticket 01's session. `L211:lost` and `L223:lost` read `dropped_a_fact_and_drained`. `L302` reads
`marked_a_claim_as_skip`. Nothing new is written for this ticket.

## The bar

**0 of 10 held** across `L126:mark` and `L153:mark` on `claude-haiku-4-5`. The before number is
8 of 10. A mood should leave every piece marked `skip` and drain its Capture.

**No regression on the other side, and this is the half that matters.** The change narrows what
`claim` with no edits covers, and the risk is that a model narrows it too far and starts marking a
real unplaced claim `skip`. That is the silent loss ADR 0044 exists to stop.

- `L211:lost` and `L223:lost` are the phase 10.95 rows where a fact was dropped and the Capture
  drained anyway. They must stay at their current rates.
- `L302` must stay at 0 of 5. A real preference must never come back `skip`.

## What to write down

Append the tables to [../finding.md](../finding.md) beside the others, in the same shape. Record the
mode, the date, and the clock the fixture ran at.

No `claude-opus-5` column. Per ADR 0003, two tiers of model, it says which kind of defect a failure
is, and this is a wording change on the tier that files.

## Do not act on the result here

Write the number down and stop. If the bar is missed, or a regression row moves, that is a fresh
grilling ticket, and it starts by reading the returned partitions rather than the rates. ADR 0048
stands whatever the number says: it decides what the mark means, and the measurement says whether
the cheap tier can be told.

## Answer

Run on 2026-09-21 in `claude-cli` mode, twenty-five calls in the two passes this ticket names. The
tables are appended to [../finding.md](../finding.md) beside the earlier ones, same fixtures and
same clock, so they compare directly.

**The bar is missed by one run. 1 of 10 held**, against 8 of 10 before. `L153:mark` is 0 of 5.
`L126:mark` is 1 of 5, and the failing run cut `I hate mondays` out of the mood and marked that
piece `claim`. Those are the same words, the same row and the same reading as the two `L126` edits
ticket 06 recorded, so the miss sits on ticket 07's branch rather than on the `skip` bullet.

**The half that matters is clean.** `L302` holds at 0 of 5. Every run marked both preference pieces
`claim`, so the narrowing never reached a claim that stands.

**One regression row moved.** `L211:lost` went from 3 of 5 to 5 of 5, the same `gpay` payment
dropped every time. The before rate is phase 10.9's, taken before ticket 02's bullet as well as this
one, and nothing measured the row in between, so the move is real but unattributable from here.
`L223:lost` went 3 of 5 to 2 of 5 over the same gap.

Per this ticket, written down and not acted on. Both the `L126` miss and the `L211` move are fresh
tickets, and each starts by reading the returned partitions rather than the rates. ADR 0048 stands.

No `claude-opus-5` column was run, per this ticket.
