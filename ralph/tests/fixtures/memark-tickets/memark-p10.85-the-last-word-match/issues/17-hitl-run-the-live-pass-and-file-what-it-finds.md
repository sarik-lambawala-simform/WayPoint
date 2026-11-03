# 17 — HITL: run the live pass and file what it finds

**Type:** task

**Status:** completed

**Blocked by:** 16

**What to build:** a live model pass over this phase's work, with reproduction rates, and whatever
survives filed as the next bug phase.

## Why a person runs it

The unit suite writes the model's answer itself, so it proves the code around the call and never the
call. The method is `.claude/skills/live-pass/SKILL.md`, invocable as `/live-pass`.

`ready-for-human` is deliberate. `run-ralph-tickets.sh` picks `in-progress` first and then
`ready-for-agent`, so it skips this one rather than failing it. The runner is unattended, the pass
needs a person for the messages, and the runner fails any ticket where no commit lands, which a
findings-only pass often will not produce.

## What this pass is the first to do

It is the first pass measured on the box's own tiers, per
[ticket 05](05-the-pass-runs-on-models-the-box-does-not.md): filing on `claude-haiku-4-5` and
judgement on `claude-sonnet-5`. A row that goes red there is a finding of its own and never a reason
to raise the tier back.

## What to watch, beyond the pass or fail

- The three rows this phase exists for: `L134`, `L188` and `L189` all reach the Cards.
- No reply opens with a sentence that contradicts the paragraph under it.
- `L182` still names `Falguni`.
- `L194` still resolves Holi off the Vault's own 4 March line.
- The bill on the "time and nobody" path.
- The two entries under **Watched, not filed** in `00-index.md`, plus ticket 02's gap where a subject
  the model skipped has its word written in the Vault. A real row for any of them turns a watched item
  into a ticket.

## Done when

- [x] The pass has run in `claude-cli` mode over the whole bundle. 246 rows, 227 pass, 19 fail.
- [x] Anything suspicious has a reproduction rate from `python -m harness.live.repeat`. **Thirteen of
      sixteen findings do.** The three that do not are named below.
- [x] Whatever survives is filed as `.scratch/memark-p10.9-nothing-to-file-is-not-nothing-to-do/`,
      seventeen tickets.
- [x] The watched items are either still watched with a reason, or filed with a row behind them.

## What the pass found

Sixteen findings and a spec ticket. The five worth naming here:

**`L200` went off.** This phase wrote it three tickets ago as the guard for its own cost argument,
and it fired on the first real run after the phase shipped. `?holi pe kya kiya tha` names nobody,
Hinglish drops the pronoun, the Intent Read answered `Me`, and all 34 Cards went down the path this
phase costed at a day's tokens: 2,705 against 375. 3 of 5 on both tiers. Phase 10.9 ticket 13.

**A Capture nobody proposed anything for is never drained.** `vault/apply.py:_drained` builds its
list from the edits that wrote, so a message with nothing to file takes no `filed::` mark, for ever.
Every run, and no model involved. Ticket 01.

**Three checks cannot see a citation whose block id is not hex.** 48 of the 212 ids in
`tests/fixtures/` are hand written as `m205` and `h101`, so three checks in `COMMON` have been partly
blind on the Vault the last three phases were measured on. Ticket 11.

**A bare day number resolves into the future.** `the 20th` on 27 August became 20 September. Ticket
12.

**Eight earlier rows assert rules this phase replaced.** Six want a `From:` line under a recalled
answer, two count a Recall prompt from before the merged branch. All eight are green in the free dry
run, because their assertions go silent when no model answered. Ticket 14.

## The watch list, each one checked

| Watched | What the pass saw |
| ------- | ----------------- |
| `L134`, `L188` and `L189` reach the Cards | all three pass |
| `L182` still names `Falguni` | `I have nothing on Falguni.` |
| `L194` resolves Holi off the Vault's own 4 March line | resolved to `04 Mar 2026` |
| No reply contradicts the paragraph under it | **broken twice**, tickets 15 and 16 |
| The bill on the "time and nobody" path | **broken**, ticket 13 |
| The two `Watched, not filed` entries and ticket 02's gap | one became ticket 07, one became ticket 05, the third produced no row in 48 and stays watched |

**The bill itself is unchanged.** `harness/live/bill.py` over the 48 new rows gives $0.0086 a
question on this Vault, $0.301 carried up to the 150,000 tokens ADR 0043 costed, and $90.38 a month
against its "about $90". That is 1.00 times the number the decision was taken on. What ticket 13
breaks is the cheap path alone, where a question that should cost about $0.0015 pays $0.0085.

## The three findings with no rate

Tickets 15, 16 and 17 of phase 10.9 carry one observed run each and no reproduction rate. Their
probes are written and registered in `harness/live/repeat.py`. The run measuring them was stopped
part way, because a ticket runner had begun phase 10.9's ticket 01 and committed partial work to
`apply.py`, `distillation.py` and `checks.py`, and a rate spanning a moving codebase says nothing.

All three are `ready-for-human` rather than `ready-for-agent`, because the first thing each asks for
is its rate and a rate that comes back clean means there is nothing to build. `run-ralph-tickets.sh`
fails any ticket where no commit lands, so an unattended runner would fail all three for doing the
right thing.

**This is the one criterion above that is met with an exception rather than outright.**
