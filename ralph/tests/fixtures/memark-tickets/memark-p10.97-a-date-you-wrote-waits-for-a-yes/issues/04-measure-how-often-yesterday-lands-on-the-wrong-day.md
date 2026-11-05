# Measure how often yesterday lands on the wrong day

Type: task
Status: resolved

## Question

Nothing to decide. Finding C in [../finding.md](../finding.md) is two wrong days in two messages. That
is enough to file and not enough to know the rate.

Use the live-pass method in `.claude/skills/live-pass/SKILL.md`, with the Intent Read on
`claude-haiku-4-5` and the clock at 2026-09-30 20:00 Asia/Kolkata. Send each of these at least 5
times and record the `window` it returns:

- `How was my mood yesterday?`
- `How about day before yesterday?`
- `what did I do today`
- `what did I do 3 days ago`

Run the same set once on `claude-sonnet-5` as a comparison. That is a diagnostic, per ADR 0003 (two
tiers of model), and not a fix.

Also read the Intent Read's prompt and schema at `memark/intent.py:490` and `:627`. Look for
anything that could push the count back one day: the clock at 20:00, the day of the latest Capture,
or an example in the instructions.

Record the rates and anything found in the prompt.

## Answer

**The cheap tier gets the day right 8 times in 20. Every wrong day is one day short. It is never
one day long.**

Run on 2026-09-29, `claude-cli` mode, baseline fixture, clock at 2026-09-30 20:00 Asia/Kolkata.
`claude-cli` adds Claude Code's own prompt to every call, so a rate here is a hint and not the
box's rate.

### Rates on `claude-haiku-4-5`, 5 runs each

Today is Wednesday 30 Sep.

| Asked | Right day | Right | One day short | No window |
| --- | --- | --- | --- | --- |
| `How was my mood yesterday?` | 29 Sep | 3 | 2 | 0 |
| `How about day before yesterday?` | 28 Sep | 0 | 3 | 2 |
| `what did I do today` | 30 Sep | 4 | 1 | 0 |
| `what did I do 3 days ago` | 27 Sep | 1 | 4 | 0 |
| All four | | 8 | 10 | 2 |

Even `today` came back as 29 Sep once. `day before yesterday` was never right. With no window, the
question is answered from no day at all.

### The same set once on `claude-sonnet-5`

A diagnostic, per ADR 0003 (two tiers of model). It is not a fix.

`yesterday`, `today` and `3 days ago` were right. `day before yesterday` came back with no window.
So 3 of 4. The strong tier also drops `day before yesterday`.

### What the prompt holds

This is the whole Intent Read prompt for the first question:

    ## Today

    Wednesday 2026-09-30

    ## What the person just said

    How was my mood yesterday?

Nothing in it could push the count back one day:

- **The clock at 20:00.** Only the day goes in the prompt, never the hour. 20:00 in Asia/Kolkata is
  14:30 UTC on the same day, so the day in the prompt is right. `Clock.today` at
  `memark/clock.py:77` works the day out in the zone.
- **The day of the latest Capture.** The prompt holds no Capture. The baseline has no Digest, so it
  holds no numbered list either.
- **An example in the instructions.** `SYSTEM` at `memark/intent.py:239` has one worked day:
  `the 20th` asked on 27 August is 20 August. That is right and is about a bare day number. No
  example counts a relative word. `yesterday` appears only in the schema at `:627` and the
  `LooseWindow` docstring at `:490`, as an example of a day with two ends. Neither gives a day.

So the prompt gives the right day and no way to count from it. The one-day-short slip is the
model's own. A prompt fix would be an example like `yesterday` asked on 30 Sep is 29 Sep. This run
did not try one.

### Differences from finding C

Finding C had a Digest in the Vault, so its prompt held a numbered list. This run had none. The
slip is the same with or without the list.

### How it was run

A throwaway script called `read_for_intent` in `memark/intent.py` directly, 24 times, through
`harness.claude_code.ClaudeCodeClient`, on a copy of `tests/fixtures/baseline`. It sent no reply
target and made no answer call. Nothing in `harness/live/` was changed.
