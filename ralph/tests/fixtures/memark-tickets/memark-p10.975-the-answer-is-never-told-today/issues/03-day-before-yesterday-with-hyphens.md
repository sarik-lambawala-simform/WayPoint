# 03. `day-before-yesterday` with hyphens is two days back

**Type:** task

**Status:** completed

**What to build:** code reads `day-before-yesterday` as the day before yesterday, and never as
`yesterday`.

Spec: [../spec.md](../spec.md), structural finding 3.

## What happens today

`written_dates.A_FIXED_WORD` joins `day`, `before` and `yesterday` with `\s+`. Hyphens are not
whitespace, so the `before` group does not match. The `yesterday` group matches the last word
instead. Per ticket 14 of phase 10.97, code's day then beats the model's.

## Reproduction

`claude-cli` mode, `the-end-of-september`, Wednesday 30 Sep 2026 20:00.

    you   day-before-yesterday mood?
    bot   Tuesday 29 Sep 2026

          Day before yesterday, 29 Sep, you were in a great mood.

The clash line: code read `days -1` as 29 Sep, the model sent `days -2` as 28 Sep, and code's days
were used. `L355`: 1 of 1, and it is code.

## What to change

- The `before` group accepts a hyphen or whitespace between its words, in any mix.
- `day-before yesterday` and `day before-yesterday` read the same.

## Done when

- [ ] A unit test reads each spelling as `days -2` on Wednesday 30 Sep 2026.
- [ ] `L355` opens on `Monday 28 Sep 2026`.
- [ ] The unit suite, `mypy`, `ruff check` and `ruff format --check` are green.
