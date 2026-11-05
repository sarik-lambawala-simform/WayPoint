# 13. A correction of the day just asked about is a question

**Type:** task

**Status:** completed

**What to build:** `no no, I meant monday`, sent right after a question, is read as that question
asked again about Monday, and answered.

Spec: [../spec.md](../spec.md), judgement finding 13.

## What happens today

    you   How was my mood yesterday?
    bot   Tuesday 29 Sep 2026

          ...
    you   no no, I meant monday
    bot   Recorded: no no, I meant monday

The Intent Read got the first question in its Recent Exchange, per ADR 0051, a message carries its
Recent Exchange. It still sent `question: null`. So the message was saved as a note and never
answered. The person asked twice and got one answer, about the wrong day.

## Rates

`claude-cli` mode, `the-end-of-september`, Wednesday 30 Sep 2026 20:00, `L353`.

- No question read: 5 of 5 on `claude-haiku-4-5`. In 4 of 5 the window was null as well.
- No `claude-sonnet-5` run was made. Make one before changing the prompt, so the ticket can say
  whether the prompt is wrong or too thin.

## What to change

- The Intent Read prompt says a message that corrects the last question's day, or its subject, is
  that question asked again, with the correction in it.
- It gives `no no, I meant monday` after a question about yesterday as its example.

## Done when

- [ ] A `claude-sonnet-5` comparison of 3 runs is written into this ticket under `## Comments`.
- [ ] A unit test pins the new prompt sentence.
- [ ] `L353` reads a question in at least 9 of 10 runs on `claude-haiku-4-5`, and its second answer
      opens on `Monday 28 Sep 2026`.
- [ ] The unit suite, `mypy`, `ruff check` and `ruff format --check` are green.

## Comments

**`claude-sonnet-5` comparison, before the prompt change.** 3 runs of `L353` in `claude-cli` mode,
with the Intent Read moved to `claude-sonnet-5`, on the prompt as it stood before ticket 12.

| run | second reading's `question` | second reading's window | second day line |
| --- | --- | --- | --- |
| 1 | null | weekday `MO(-1)`, grain `day` | none, no answer |
| 2 | null | weekday `MO(-1)`, grain `day` | none, no answer |
| 3 | null | weekday `MO(-1)`, grain `day` | none, no answer |

`claude-sonnet-5` read the right day in 3 of 3 and still sent no question in 3 of 3. So both tiers
fail on the question, and the prompt is wrong rather than too thin. It tells the model a thought
written down is not a question, and says nothing about a correction of the last one. The day is
not the problem. The fix is the sentence this ticket asks for.

**After the change.** A first version of the sentence read a question in 5 of 5 on
`claude-haiku-4-5`, and one of the 5 opened on `Friday 28 Aug 2026`: it read Monday as `day 28` and
`months -1`. So the sentence now also says Monday there is weekday `MO(-1)` and grain `day`, and
never a day of the month. On that version, 10 fresh runs of `L353` on `claude-haiku-4-5` in
`claude-cli` mode read the question `no no, I meant monday` in 10 of 10, and the second answer
opened on `Monday 28 Sep 2026` in 10 of 10.

**After review.** A regression run after ticket 14 copied `How was my mood yesterday? no no, I
meant monday` as the question in 1 of 2. Code drops a quote the message does not hold, so that run
went unanswered. The sentence now says to copy the new message and nothing from the chat above it.
On the final prompt, 10 more runs of `L353` on `claude-haiku-4-5` read `no no, I meant monday` and
opened on `Monday 28 Sep 2026` in 10 of 10.
