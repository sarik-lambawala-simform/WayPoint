# Measure the standing wording on the filing tier

Type: task
Status: resolved
Resolved by: the bundled run of 2026-09-21, inside ticket 01's session
Blocked by: 02

## Question

Nothing to decide. Ticket 02 settled what the Card holds and rewrote the bullet that was at
`distillation.py:801`. The wording is in `memark/distillation.py` and **nobody has run it**. This
ticket produces the number.

## What changed, so you know what you are measuring

The bullet no longer asks whether a claim is worth reading in a month. It asks whether the claim
says how things stand for the person, or only what happened or how they felt at one moment. It
names a preference as something that stands, it keeps the mood clause and the measurement clause,
and it ends with `Small is not the same as passing`. The reasoning is ADR 0047, the Card for the
person holds what stands, however small.

The worked example in the prompt is `I do not eat onions`, and that is deliberate. `L300` and `L301`
send `I like threptin biscuits` and `My favourite color is red`. A prompt carrying the test's own
words would score by recognition and the rate would mean nothing. Do not "improve" the prompt by
putting either row's words into it, and if a later wording attempt does, the number it produces is
void.

## How to run it

`claude-cli` mode, which is the default. Agreed in ticket 02's session: the before number was taken
there, so before and after compare directly.

    python -m harness.live.repeat L300 L301 L302:me --runs 5
    python -m harness.live.repeat L126 L153 L154 --runs 5

The probes already exist in `harness/live/repeat.py`. `L300`, `L301`, `L302:me` and `L154` read
`emitted_the_person(wanted=True)`. `L126` and `L153` read `a_mood_reached_the_card`. Nothing new is
written for this ticket.

## The bar

**0 of 15 dropped** across `L300`, `L301` and `L302:me` on `claude-haiku-4-5`. The before number is
11 of 15. Agreed in ticket 02's session: this row is a plain fact about the person with no
ambiguity, so a cheap tier that cannot hit 15 of 15 on `I like threptin biscuits` has a prompt that
is still too thin.

**No regression on the other side.** `L126` and `L153` are passing moods and must still reach no
Card. `L154` is the standing habit and must still reach one. The new wording widens what passes on
purpose, so the mood rows are where the cost of that would show. A run that fixes the preference and
loses the mood has traded one defect for another.

## What to write down

Append the two tables to [../finding.md](../finding.md) beside the before ones, in the same shape,
so the pair reads as one measurement. Record the mode, the date, and the clock the fixture ran at.

Do not run the `claude-opus-5` column. Per ADR 0003, two tiers of model, it is a diagnostic that
says which kind of defect a failure is, and the before run already answered that: 0 of 3, the rule
is sound and the wording was what failed. A second opus column measures nothing new and costs calls.

## Do not act on the result here

Whatever the number is, this ticket writes it down and stops. Ticket 07 decides what happens next.
That split is the point: a ticket that both measures and reacts will quietly re-word the prompt
until the number looks right, and the bar above stops meaning anything.

## Answer

Run on 2026-09-21 in `claude-cli` mode, bundled with ticket 01's mark probes so one pass of fifty
calls served both. The two tables are appended to [../finding.md](../finding.md) beside the before
ones. The clock and fixtures are the ones the before run used, so the pair compares directly.

    python -m harness.live.repeat L300 L301 L302:me L300:mark L301:mark \
        L126 L126:mark L153 L153:mark L154 --runs 5

**The bar is met. 0 of 15 dropped**, against 11 of 15 before. `L300`, `L301` and `L302:me` are
0 of 5 each, and every run filed `extend -> Me`.

**The mark side went with it.** `L300:mark` and `L301:mark` are 0 of 5. The silent loss the map is
named after did not reproduce once, which is what filing the claim does to it.

**One row on the other side moved.** `L153` and `L154` hold at 0 of 5. `L126` proposed an edit on
2 of 5 runs, and both times the words were `I hate mondays`. Under ADR 0047, the Card for the
person holds what stands, however small, a standing dislike stands, so this may be the row testing
a message that mixes a mood with a taste rather than the wording having gone wrong.

Per this ticket, that is written down and not acted on. **Ticket 07 decides it**, and the
`L126` branch is the one it has to rule on.

No `claude-opus-5` column was run, per this ticket.
