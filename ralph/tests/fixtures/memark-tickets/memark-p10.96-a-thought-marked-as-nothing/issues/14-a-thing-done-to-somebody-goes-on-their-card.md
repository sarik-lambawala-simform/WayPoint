# A thing done to somebody goes on their Card, and measure it

Type: task
Status: resolved
Blocked by: 13

## Question

Nothing to decide. Ticket 13 settled it: a thing the person did to or for somebody else is a claim
about that somebody. It gets an edit on their Card under `Facts`, and the line keeps the words the
person typed. ADR 0048, `skip` means the words hold nothing that stands, carries the rule in its
section "The test is asked of the person only". The prompt does not say it yet.

**Change the wording.** In `memark/distillation.py`, say where such a claim goes, next to the
durability test bullet, and say whose claim it is where the mark is chosen. The drill example in the
`skip` bullet asserts the reading without giving the edit, so fix it or replace it. Keep the change
to what the rule needs.

**The constraint from ticket 06 holds.** No test row's own words go into the prompt: not `ramaben`,
not `gpay`, not `8k`, not a payment to a house help. Any example is invented.

**Then measure, `claude-cli` mode, `claude-haiku-4-5`:**

    python -m harness.live.repeat L211:where L126:mark L153:mark --runs 10
    python -m harness.live.repeat L302 L300:mark L301:mark --runs 5

| row | what it guards | bar |
| --- | -------------- | --- |
| `L211:where` | a thing done to somebody else, lost | 0 of 10 lost as `skip:`, at most 1 of 10 bad |
| `L126:mark`, `L153:mark` | a passing mood still turned down | at most 1 of 10 together, per ticket 08 |
| `L302`, `L300:mark`, `L301:mark` | a claim about the person marked `skip` | 0 of 5 each |

Also read the `L211:where` detail lines and count how many runs wrote the payment as an edit. Today
it is 0 of 20.

Append the tables to [../finding.md](../finding.md). If a bar is missed, write it down and file a
fresh ticket. Do not re-word twice in one ticket.

## Answer

**The wording is in, the payment is written, and one bar is missed.** Run on 2026-09-25. The tables
are in [../finding.md](../finding.md), under "Ticket 14: a thing done to somebody goes on their Card".

**What changed in `memark/distillation.py`.**

- A new bullet after the durability test. A thing the person did to or for somebody else is a claim
  about that somebody: a payment, a loan, a thing lent, a thing handed back. The durability test is
  never asked of it. It gets an edit on their Card under `Facts`, and the line keeps the typed words.
  The invented example is `lent Tara my camera for her trip`. `I went to the gym today` is the
  counter-example, because nobody else is in it.
- The drill example in the `skip` bullet now gives the edit: an edit on Dev's Card under `Facts`, and
  a `claim` piece naming it.

No test row's words are in either one. The unit suite is 1763 passed.

**What the runs say.**

| row | bar | result |
| --- | --- | ------ |
| `L211:where` | 0 of 10 lost as `skip:`, at most 1 of 10 bad | **0 of 10**, met |
| `L126:mark` + `L153:mark` | at most 1 of 20 | **5 of 20**, missed |
| `L302`, `L300:mark`, `L301:mark` | 0 of 5 each | 0 of 5 each, met |

The payment was written as an edit on 10 of 10 runs, against 0 of 20 before. All five mood misses
are `I hate mondays` marked `claim`. The plain mood clauses were `skip` on every run.

Per this ticket the wording was not changed twice. The miss is
[15-i-hate-mondays-held-on-half-the-runs.md](15-i-hate-mondays-held-on-half-the-runs.md).
