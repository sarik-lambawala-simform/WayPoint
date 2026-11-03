# 15. The answer's first line names the day

**Type:** task

**Status:** completed

**Completed at:** 2026-10-01T03:25:52Z

**Blocked by:** 13

**What to build:** an answer about a day starts with `Tuesday 29 Sep`, written by code, so a wrong
day is easy to see.

Spec: [../spec.md](../spec.md), "The answer's first line". Decided in
[Who counts yesterday: code or the model?](05-who-counts-yesterday.md). The rule is ADR 0052, section
"The answer names the day".

## What happens today

The answer model writes the whole reply. An answer can name only `the 28th`.

## What to change

- On the Recall path, code writes the first line before the model's words. One day:
  `Tuesday 29 Sep`, from `clock.display_day`. A range: `Monday 21 Sep to Sunday 27 Sep`.
- When the model sent a window code refused, or neither end could be read, the reply is
  `I could not tell which day you meant.` and no answer call is made.
- A message where neither code nor the model found any window takes the Lookup path, as today.

## Done when

- [ ] A one-day answer and a range answer each start with the day line.
- [ ] A refused window gets `I could not tell which day you meant.` and the model is not asked.
- [ ] A Lookup question gets no day line.
- [ ] The unit suite is green.
