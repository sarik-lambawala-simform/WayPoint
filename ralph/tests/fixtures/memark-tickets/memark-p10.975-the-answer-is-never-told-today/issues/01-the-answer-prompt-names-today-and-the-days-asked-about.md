# 01. The answer prompt names today and the days asked about

**Type:** task

**Status:** completed

**What to build:** the answering model is told what day it is, and which days the question is
about, so its words agree with the day line code puts above them.

Spec: [../spec.md](../spec.md), structural finding 1.

## What happens today

`answering._prompt` writes the material, the chat and the question. It writes no date.
`handler._written` and `handler._recalled` put `the_day_line` on top after the answer comes back.
So the model has to work out `yesterday` itself, which ADR 0052, code counts a day from today and
the model never does, says it must not do.

In `claude-cli` mode the model took Claude Code's own date, 1 Oct, while the box's clock said
30 Sep. In `live` mode it would have no date at all.

## Reproduction

`claude-cli` mode, `the-end-of-september`, clock Wednesday 30 Sep 2026 20:00 Asia/Kolkata.

    you   How was my mood yesterday?
    bot   Tuesday 29 Sep 2026

          Yesterday would be September 30, and your notes don't have any capture logged for
          that day, so there's nothing there about your mood.

- `L308`: 5 of 5 answers say yesterday was 30 Sep, under a right day line.
- `L354`: 5 of 5. `L346`, `L347`, `L349`, `L352`, `L353`, `L357`, `L363`, `L367`, `L378`: each
  answer body names a day the line above it does not.
- The Intent Read prompt already carries `## Today` (`intent.THE_DAY`). The answer prompt does not.

## What to change

- The answer prompt carries today, the way the Intent Read prompt does, on every road: Lookup,
  Recall, and one Card plus the window.
- Where code resolved a window, the prompt also names its days, in the words the day line uses.
- The system prompt says the days are given and are not to be worked out again.
- Code still writes the day line. Nothing here moves it.

## Done when

- [ ] A unit test shows the answer prompt holds today on the Lookup road, the Recall road and the
      one Card plus window road.
- [ ] A unit test shows a resolved window's days are in the prompt.
- [ ] A probe in `harness/live/repeat.py` reads whether an answer names another day as the day
      asked about, and `L308` meets at most 1 of 10 on it, in `claude-cli` mode.
- [ ] The unit suite, `mypy`, `ruff check` and `ruff format --check` are green.
