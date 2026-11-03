# 03 — A question is answered with nothing and the person is told nothing

**Type:** defect

**Status:** completed

**Completed at:** 2026-09-19T17:50:18Z

**Reproduces:** `L242` 3 of 5 and `L82` 4 of 5 on `claude-sonnet-5`. `L82` 1 of 1 on
`claude-opus-5`. Six rows of the pass hit it.

**Both tiers fail, so the prompt is wrong rather than too thin to carry it.** Per ADR 0003 the
comparison run is a diagnostic and never a fix: filing and answering run on the tiers that Box
Setting names either way, so what changes is the prompt. The prompt half is ticket 05.

## What the person sees

They ask a question. The reply is the ordinary echo and nothing else:

    Recorded: ?badminton coaching ki fees kitni thi club me

That is the same reply a message with nothing to answer gets. Nothing says the question failed,
nothing says the notes hold nothing, and nothing says to try again. A judgement call was made and
paid for.

## The chain, read off the call log

1. The Intent Read reads the question correctly. For `L242` it returned
   `question: 'badminton coaching ki fees kitni thi club me'` and
   `subjects: ['badminton coaching', 'club']`.
2. The Lookup finds material, so `found.anything` is true and `found_nothing` at
   `answering.py:896` returns nothing. The call is made.
3. The judgement call comes back as `{"answer": "", "lines": [], "counted": false, "covered": []}`.
   The schema at `answering.py:329` types `answer` as a plain string with no floor under it, so an
   empty one satisfies it.
4. `answering.py:381` refuses it:

       said = written.get("answer")
       if not isinstance(said, str) or not said.strip():
           raise MalformedAnswer("the answering call came back with no answer in it")

5. `handler.py:742` catches every exception on that path, logs
   `a Question was recorded and could not be answered`, and returns. The acknowledgement is never
   edited, so the echo stands.

The guard at step 5 is right about what it protects. Its own docstring says the Capture is on disk
and answered for, and a raise would have Telegram resend a thought that is already recorded. What
it does not do is say anything to the person.

## Six rows, in four shapes

| Row | Message | Fixture |
| --- | ------- | ------- |
| `L72` | `what happened at Holi?` | baseline |
| `L81` | `was the badminton coaching fee paid at the club?` | baseline |
| `L82` | `what did Jignesh decide?` | baseline |
| `L182` | `?Falguni ne tiffin vishe shu kahyu hatu` | an Indian household |
| `L234` | `?मम्मी की तबीयत कैसी है अब` | an Indian household |
| `L242` | `?badminton coaching ki fees kitni thi club me` | an Indian household |

Four of the six are questions the Vault holds little or nothing on. That is the shape to read
twice: the honest reply to those is the miss line and `From: no line of your notes I can name.`,
per ADR 0046, and the model is writing nothing at all instead. A model with nothing to say appears
to be treating the empty string as a way of saying so.

## Two halves, and only one of them is this ticket

**The model returning an empty answer** is a prompt problem and it is ticket 05. `SYSTEM` at
`answering.py:195` tells the model to say plainly where the notes do not answer the question, and
never tells it that the answer field is always prose. `claude-opus-5` returned an empty answer on
its one run too, so this is the prompt being wrong and not the cheap tier being weak.

**Code turning that into silence** is this ticket and it is the worse half. Whatever the model
does, a question that cost a call and produced no answer must not look like a message that was
merely filed. This is the one a person notices, because from the outside a broken answer and a
recorded thought are the same three words.

## Done when

- [ ] A Question whose answering call comes back with no answer in it gets a reply saying so, in
      code's own words, and never the bare `Recorded:` echo.
- [ ] That reply is distinguishable from the reply for a Vault that genuinely holds nothing, which
      is `found_nothing` at `answering.py:896`. One is the box failing and one is the notes being
      empty, and a person acts differently on each.
- [ ] The log line at `handler.py:742` still fires, so a failure is still recorded for the Canary.
- [ ] Nothing else on that path starts raising out of `_answer`. The guard's reason, that a raise
      would resend a thought already on disk, is unchanged.
- [ ] A unit test covers an answering call returning `{"answer": ""}` and asserts the exact reply.
- [ ] `pytest`, `mypy`, `ruff check` and `ruff format --check` are green.

## Build this before ticket 05, not after

A prompt change alone would drop the rate and leave the silent path exactly where it is, and the
next model that returns an empty answer would find it again. Code that says what happened is also
what makes ticket 05 measurable, because a run that failed would then be visible in the chat
rather than only in a log line.
