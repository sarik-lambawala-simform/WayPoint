# Say the durability test is for the person only, and measure it

Type: task
Status: resolved
Blocked by: 10

## Question

Nothing to decide. Ticket 10 settled it: the durability test is asked of claims about the person
and of nothing else, so a claim about anybody else is never marked `skip` for it. ADR 0048, `skip`
means the words hold nothing that stands, carries the rule in its section "The test is asked of the
person only". The prompt does not say it yet.

**Change the wording.** In `memark/distillation.py`, the `skip` bullet names `a claim the question
above turned down` and drops the scope the question carries. Say the scope where the mark is
chosen. Keep the change to what the rule needs.

**The constraint from ticket 06 holds.** No test row's own words go into the prompt: not
`ramaben`, not `gpay`, not `8k`, not a payment to a house help. The example, if one is needed, is
invented.

**Then measure, five runs each, `claude-cli` mode, `claude-haiku-4-5`:**

    python -m harness.live.repeat L211:where L126:mark L153:mark L302 L300:mark L301:mark --runs 5

| row | what it guards | bar |
| --- | -------------- | --- |
| `L211:where` | a claim about somebody else marked `skip` and lost | 0 of 5 |
| `L126:mark`, `L153:mark` | a passing mood holds its Capture | at most 1 of 10, ticket 08's rate |
| `L302`, `L300:mark`, `L301:mark` | a claim about the person marked `skip` | 0 of 5 each |

Append the tables to [../finding.md](../finding.md). If a bar is missed, write it down and file a
fresh ticket. Do not re-word twice in one ticket.

## Answer

**The wording is in, five bars are met, and `L211:where` misses at 2 of 5.** Measured on
2026-09-24. The tables are in [../finding.md](../finding.md).

The change is in `memark/distillation.py`, in the two places the mark is chosen. The `skip` bullet
now says the question is asked of claims about the person and of nothing else, with an invented
example, `returned the drill I borrowed from Dev`, as a `claim` piece. The held-Capture bullet says
`a claim about the person that you read and turned down`. The code comment on `SKIP` says the same.
The unit suite is green, 1763 passed.

| row | bar | result |
| --- | --- | ------ |
| `L211:where` | 0 of 5 | **2 of 5, missed** |
| `L126:mark` + `L153:mark` | at most 1 of 10 | 1 of 10 |
| `L302`, `L300:mark`, `L301:mark` | 0 of 5 each | 0 of 5 each |

The miss is not the loss this ticket was for. The `skip:` loss went from 3 of 5 to 0 of 5. Both
failures are `covered:`, phase 10.9's shape, and one of them, run 4, filed `paid 8k for this
month` and fails only because the probe wants `gpay`.

Not re-worded, per this ticket. Filed as
[12-a-payment-covered-by-the-wrong-edit.md](12-a-payment-covered-by-the-wrong-edit.md).

## Comments

**2026-09-24, ticket 12.** The `skip:` result above does not reproduce. Ten runs on this prompt,
on the same clock as ten on ticket 10's, put the payment lost as `skip:` at 5 of 10 against 6 of 10.
The 0 of 5 here was a lucky draw. Filed as
[13-the-payment-still-comes-back-skip.md](13-the-payment-still-comes-back-skip.md).
