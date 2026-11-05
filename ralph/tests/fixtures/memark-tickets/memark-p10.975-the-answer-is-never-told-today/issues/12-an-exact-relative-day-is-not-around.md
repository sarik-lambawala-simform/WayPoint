# 12. An exact relative day is not `around`

**Type:** task

**Status:** completed

**What to build:** the Intent Read sends `around: false` for a relative day that names one day,
like `3 din pehle`, `parso` or `nethu`.

Spec: [../spec.md](../spec.md), judgement finding 12.

## What happens today

The Intent Read's window carries `around`. With `around: true`, code reads seven days round the day
and the reply says it picked the width, per ADR 0033. The cheap tier sets it on words that name one
day exactly.

    you   3 din pehle kya hua tha
    bot   Thursday 24 Sep 2026 to Wednesday 30 Sep 2026

          You did not say how wide, so I read the 7 days from 24 Sep 2026 to 30 Sep 2026.

The fields were right, `days -3` and grain `day`. Only `around` was wrong.

## Rates

`claude-cli` mode, `the-end-of-september`, Wednesday 30 Sep 2026 20:00.

| row | words | `around` set, `claude-haiku-4-5` | `claude-sonnet-5` |
| --- | --- | --- | --- |
| `L361` | `3 din pehle kya hua tha` | 3 of 5 | 0 of 2 |
| `L362` | `what did I do a week ago` | 2 of 5 | 0 of 3 |
| `L343` | `parso mood kaisa tha?` | 1 of 5 | 0 of 2 |
| `L349` | `nethu enna panninen?` | 1 of 1 | 0 of 2 |

Only the cheap tier fails, so the prompt is too thin to carry the rule. Per ADR 0003, two tiers of
model, the Intent Read runs on `claude-haiku-4-5`, and the `claude-sonnet-5` column is a diagnostic
and never a fix.

`L362` has a second question in it: `a week ago` came back as `weeks -1` with grain `week` in 3 of
5, and as `days -7` with grain `day` in 2. The row expects the week. Write down which one the prompt
now asks for, and say why, in the prompt's own words.

## What to change

- The Intent Read prompt says `around` is for words that name a point and no width, like `around
  Diwali`, and never for words that name one day.
- It gives `3 din pehle` and `nethu` as days with `around: false`.

## Done when

- [ ] A unit test pins the new prompt sentence.
- [ ] `L361` sets `around` in at most 1 of 10 runs on `claude-haiku-4-5`, in `claude-cli` mode.
- [ ] `L343`, `L349` and `L362` each set it in at most 1 of 5.
- [ ] The unit suite, `mypy`, `ruff check` and `ruff format --check` are green.
