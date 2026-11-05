# 30. The miss check allows the day line above it

**Type:** task

**Status:** ready-for-agent

**Blocked by:** none

**What to build:** `a_miss_is_named_first` in `harness/live/checks.py` accepts a reply whose day line
sits between the echo and the miss line. The box puts it there on purpose, so the check is what is
wrong.

## What happens today

Seen in the live pass on 2026-10-08, row `L414`, message 1001, on the `claude -p` mode, during
ticket 29.

```
Recorded: what is the petrol price in Rajkot today?

Wednesday 30 Sep 2026

I have nothing on Rajkot.

Your notes don't have anything about petrol prices, ...
```

The check failed with `message 1001 states the miss in paragraph 2`. It wants the miss line in the
paragraph straight after the echo.

## Why the box is right

The question named a day and a subject, so `handler._written` took the Lookup path with a window.
There, ADR 0052, code counts a day from today and the model never does, puts the day line first:
`stated = [the_day_line(window.days, clock=clock)]`, then the answer, whose first paragraph is the
miss line. A `window_read` line can follow the day line too, where code picked the width of the
window. ADR 0028's amendment wants the miss line above the answer and above the sources, and it
still is.

Ticket 29 already taught the check one line that may sit above the miss line: the quote-back,
`READ_AS_THE_QUESTION`, which `handler._under_the_quote` puts above everything else.

## The fix

- Step over the lines code writes above the answer before it looks for the miss line: the quote-back,
  then the day line, then the `window_read` line. Match each by its fixed opening, the way
  `QUOTED_OPENS` is matched, not by a paragraph number.
- Keep the two failures the check exists for: a miss line said twice, and a miss line below the
  sources line or below the answer.
- Do not change the box. Do not edit any scenario to make the row pass.

## Done when

- [ ] `L414`'s first reply passes `a_miss_is_named_first`. The unit test
      `test_a_day_line_above_the_miss_is_green` passes on that reply, word for word. A `claude-cli`
      run of `L414` has not been made.
- [x] A unit test feeds the check a reply with a day line above the miss line, and one with the miss
      line under the answer. The first passes and the second fails.
- [ ] `MEMARK_PASS_MODE=auto python -m harness.live` stays green on every earlier row. 410 pass.
      `L141` and `L193` fail on `no model call but the reading`, with or without this change.
- [x] The unit suite, `mypy`, `ruff check` and `ruff format --check` are green.
