# 14. A follow-up counts from the day just named

**Type:** task

**Status:** completed

**What to build:** `and the day after?`, sent after an answer about Monday 28 Sep, reads Tuesday
29 Sep.

Spec: [../spec.md](../spec.md), judgement finding 14.

## What happens today

The Intent Read sends `relativedelta` fields counted from today, per ADR 0053, the model sends
`relativedelta` fields and a grain. For a day counted from another day, it has to turn `the day
after Monday 28 Sep` into a count from today, Wednesday 30 Sep. That is `days -1`. The cheap tier
often counts from the wrong end.

    you   what did I do last Monday
    bot   Monday 28 Sep 2026
          ...
    you   and the day after?
    bot   Monday 28 Sep 2026

          The day after last Monday was Tuesday 29 Sep 2026, and there's nothing in your notes
          for that day.

The body is right and the day line is wrong, so the reply contradicts itself.

## Rates

`claude-cli` mode, `the-end-of-september`, Wednesday 30 Sep 2026 20:00, `L351`.

- The second day line is wrong in 3 of 5 runs on `claude-haiku-4-5`: twice Monday 28 Sep, once a
  seven-day window.
- No `claude-sonnet-5` run was made. Make one first, as in ticket 13.

## What to change

- The Intent Read prompt says a day named relative to the day the last answer named is counted to
  a number of days from today, and gives this exchange as its example.
- If the comparison shows both tiers fail, stop and turn this ticket into a grilling question about
  whether the fields need a way to count from a day other than today.

## Done when

- [ ] A `claude-sonnet-5` comparison of 3 runs is written into this ticket under `## Comments`.
- [ ] A unit test pins the new prompt sentence.
- [ ] `L351`'s second day line is `Tuesday 29 Sep 2026` in at least 9 of 10 runs on
      `claude-haiku-4-5`.
- [ ] The unit suite, `mypy`, `ruff check` and `ruff format --check` are green.

## Comments

**`claude-sonnet-5` comparison, before the prompt change.** 3 runs of `L351` in `claude-cli` mode,
with the Intent Read moved to `claude-sonnet-5`, on the prompt as it stood before tickets 12 and 13.

| run | second reading's window | second day line |
| --- | --- | --- |
| 1 | `days -1`, grain `day` | `Tuesday 29 Sep 2026` |
| 2 | `days -9`, grain `day` | `Monday 21 Sep 2026` |
| 3 | `days -1`, grain `day` | `Tuesday 29 Sep 2026` |

`claude-sonnet-5` is right in 2 of 3. `claude-haiku-4-5` was wrong in 3 of 5 in the live pass. The
strong tier mostly carries it, so this reads as a prompt too thin for the cheap tier and not as a
shape that cannot say the day. The prompt change goes ahead.

**What the `days -9` miss was.** The first version of the sentence reached 7 of 10 on
`claude-haiku-4-5`, and all 3 misses were `days -9`, the same as the strong tier's miss. `days -9`
from Thursday 8 Oct 2026 is Tuesday 29 Sep. 8 Oct was the real date of the measuring run, and a
`claude-cli` call is a Claude Code session that is told the real date. So the model chose the right
day and counted to it from the wrong today. The prompt now also says today is the day under `Today`
and no other. A real box calls the API, which tells the model no date, so this is mostly a harness
effect. But any live rate for a count from today is exposed to it whenever the real date and the
simulated date differ, and earlier rates on window rows may carry it.

**After the change.** 10 fresh runs of `L351` on `claude-haiku-4-5` in `claude-cli` mode: the
second reading was `days -1`, grain `day`, and the second day line was `Tuesday 29 Sep 2026`, in
10 of 10.
