# Act on the rate ticket 06 measured

Type: grilling
Status: resolved
Blocked by: 06

## Question

Ticket 06 produces a number and stops. This ticket reads it and decides. There are three outcomes
and the right move differs for each, so write the branch you took and why, not just the change.

**The bar, from ticket 02's session:** 0 of 15 dropped on `L300`, `L301` and `L302:me` on
`claude-haiku-4-5` in `claude-cli` mode, with `L126` and `L153` still reaching no Card and `L154`
still reaching one.

## If the bar is met

Nothing to change. Close this ticket with the number, and say in one line that the preference rows
are now regression coverage like every other row in the bundle. They are never edited to make a
later phase pass, per the standing rule on `harness/live/`.

## If the preference is still dropped

The wording is still too thin and it gets one more attempt, not an open-ended loop. Before writing
anything, read the returned partitions rather than the rates. The failure has two shapes and they
want opposite fixes.

- **The model marks the piece `claim` with no edits.** It read a claim and could not place it. That
  is not the durability test at all, it is the heading or the routing, and the fix is not in this
  bullet.
- **The model marks the piece `skip`.** It read no claim in the words. That is the durability test
  still failing, and the bullet is what changes.

If it is the second, ticket 02's session already named the fallback: keep the standing axis and add
worked examples, rather than restating the axis a third time. The constraint from ticket 06 holds
and it is the one most likely to be broken here. Never put `I like threptin biscuits` or
`My favourite color is red` into the prompt. A prompt carrying the test's own words scores by
recognition and voids the measurement.

If a second attempt also misses, stop and write it up as a finding rather than a third attempt. Per
ADR 0003, two tiers of model, a rule the cheap tier cannot carry after two honest wordings is
evidence about the tier and belongs in a map of its own, not in more prose.

## If a mood row regressed

`L126` or `L153` reaching the Card is worse than the defect this fixes and it takes priority.
The map holds a standing preference: the durability test earns its place, and no ticket here may
quietly delete it to make the finding go away. A wording that writes every passing mood to the Card
has deleted it in practice.

Revert the bullet to what ADR 0047 describes and narrow the widening instead. The likely culprit is
the last sentence, `Small is not the same as passing`, read as permission to write anything. It can
be bound to the axis rather than dropped: small and standing goes on, small and passing does not.

## What this ticket does not reopen

**ADR 0047 stands whatever the number says.** It decides what the Card holds. The measurement says
whether the cheap tier can be told, and those are different questions. A dropped preference does not
become the right answer because a model is bad at reading one.

**`CONTEXT.md`'s Durability Test entry stands too**, for the same reason. It describes the rule, not
the prompt.

**Card bloat stays out of scope.** If the fix lands and a real Vault later drowns in small
preferences, that is the follow-up ADR 0047 already names, and it is a question about how a Card is
presented rather than about what the model writes.

## Added by ticket 08: the `L126` branch has a third data point

Ticket 08 measured the mark side after the `skip` wording landed. `L126:mark` came back 1 of 5, and
the failing run cut `I hate mondays` out of the mood and marked that piece `claim` with no edit.

That is the same words and the same reading as the two `L126` edits ticket 06 recorded. Three
failures on this row now, across two measurements and both probes, and every one of them is
`I hate mondays`. Nothing else on `L126` has ever failed. Whatever this ticket rules, rule it on
that clause rather than on the row.

## Answer

**The bar is met, and no prompt changes.** Decided with the user on 2026-09-24.

### The branch taken

The first one. Ticket 06 measured **0 of 15 dropped** on `L300`, `L301` and `L302:me`, against 11 of
15 before. `L153` and `L154` held at 0 of 5. The preference rows are now regression coverage like
every other row in `harness/live/`, and they are never edited to make a later phase pass.

The mood branch was read and not taken. `L126` looked like a regression: 2 of 5 runs proposed an
edit in ticket 06, and 1 of 5 held the Capture in ticket 08. Every one of those three failures is the
clause `I hate mondays`. The mood clauses, `I am knackered` and `today was a slog`, never failed on
any run.

### The ruling on `I hate mondays`

**Both readings are allowed.** In this message the clause can be a grumble about today or a taste
the person holds. ADR 0047, the Card for the person holds what stands however small, asks whether the
person would still say it next month, and for `I hate mondays` they would. So a model that files it
as a taste is following the rule, not breaking it.

So the ticket's mood branch does not apply. That branch is for a passing mood reaching the Card, and
the part of `L126` that is plainly a mood never did. Narrowing `Small is not the same as passing`
would put the 0 of 15 at risk to fix a row that is ambiguous, not wrong.

### What this hands to the spec

- **`L126` stays as it is.** Its message is not edited, per the standing rule on `harness/live/`.
  Its `I hate mondays` edits and holds are expected, and a reader of its rate reads them as that.
- **The build adds one mood row with no taste clause in it**, for example a message like `I am
  knackered, today was a slog`. That row carries the no-regression check `L126` was meant to carry,
  at a bar of 0 of 5. It is a new row, so it edits nothing earlier.

### What this ticket did not reopen

ADR 0047 and the **Durability Test** entry in `CONTEXT.md` stand. No ADR is written and no word
changes: "both readings are allowed" is a ruling on one row, not a rule of the domain.

### Raised in this session and sent to its own effort

The user proposed a Card section that holds a state for a while and is checked later, for example
`going through a rough patch`. At month end the box would ask whether it still holds, keep the line
if yes, and remove it if no.

It finds a real gap. ADR 0047 has two boxes, what stands and what passes, and a state that lasts
weeks fits neither. But it needs a review loop the box does not have: only the daily Digest exists,
and the weekly Reflection is not built. Ticket 04's "no" still holds for a moment like `I am tired
today`. The idea is written down in
[../../memark-a-state-that-lasts-weeks/idea.md](../../memark-a-state-that-lasts-weeks/idea.md) to be
charted as its own map.
