# 18. AFK: this phase's rows and hard checks reach the bundle

**Type:** task

**Status:** completed

**Completed at:** 2026-10-01T04:05:21Z

**Blocked by:** 11, 12, 14, 15, 17

**What to build:** `harness/live/scenarios_p10_97.py`, with rows `L305` to `L313`, their hard checks,
and their probes in `harness/live/repeat.py`.

Spec: [../spec.md](../spec.md), "Testing decisions". Method: `.claude/skills/live-pass/SKILL.md`.

## The rows

No word from these rows goes into any prompt. No earlier row is edited.

| row | messages | clock, Asia/Kolkata | hard check, true whatever the model says |
| --- | --- | --- | --- |
| `L305` | `Remind me to order hand blender on 8th october` | 2026-09-28 20:00 | a line that landed on 2026-10-08 with the model's day matching the words is not `?`, and the reply names `08 Oct 2026` |
| `L306` | a list of several errands, one naming a day | 2026-09-28 20:00 | no errand whose piece names no day gets a confirmed line |
| `L307` | an errand with a typed day and `remind me 2 days before` | 2026-09-28 20:00 | a confirmed line carries a 2-day `notice::` and the reply says `2 days before` |
| `L308` | `How was my mood yesterday?` | 2026-09-30 20:00 | the answer's first line is `Tuesday 29 Sep` |
| `L309` | `L308`'s message, then `How about day before yesterday?` as a new message | 2026-09-30 20:00 | the second answer's first line is `Monday 28 Sep`, and its Intent Read prompt holds the mood question |
| `L310` | a Hinglish relative day, like `kal mera mood kaisa tha?` | 2026-09-30 20:00 | a window code refused gets `I could not tell which day you meant.` |
| `L311` | `what did I do last Monday` | 2026-09-30 20:00 | the answer's first line is `Monday 28 Sep` |
| `L312` | a list of what Wife likes, a list of what I like, then `Now can you merge both the lists and find common things that we both like?` | 2026-09-30 20:00 | the Chat Log holds the bot's two lists, and the third Intent Read prompt holds both |
| `L313` | `what did I do 3 days ago` | 2026-09-30 20:00 | the answer's first line is `Sunday 27 Sep` |

Pick fixtures that hold what each row needs, or seed it with earlier messages in the row. Say which
in the row's comment.

A check that reads what a model wrote is wrapped in `only_when_a_model_answered`.

## The probes

- `L305`: `a_typed_date_waited`, the hand blender line is `?`.
- `L306`: `another_errand_was_confirmed`.
- `L307`: `the_warning_was_lost`.
- `L309:mood`: the second answer is not about mood.
- `L310`: the day on the first line is not Tuesday 29 Sep.
- `L312`: the answer misses one list.
- A clash probe that counts the clash log line from ticket 14 on `L308`, `L309`, `L311` and `L313`.

## Done when

- [ ] Every row runs in the free dry run with its hard checks green or vacuous.
- [ ] Every probe is in `PROBES` and has a unit test in `tests/test_live_probes.py`.
- [ ] No earlier row is edited.
- [ ] The unit suite is green.
