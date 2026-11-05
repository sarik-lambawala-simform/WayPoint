# 01 — A Capture that names a thing comes back as an event

**What to fix:** the journal's system prompt in `memark/journal.py`, so that a Capture naming a
thing is written as the note it was rather than as something that happened.

**Status:** completed

**Reproduces:** 4 of 5 on `claude-sonnet-5`, which is the judgement tier per ADR 0003. 3 of 3 on
`claude-opus-5`. Measured by `python -m harness.live.repeat L46 --runs 5 --also claude-opus-5`.

## What happens

`L46`'s day opens with a Capture sent at 07:41 that reads, in full:

    bin men

Two words. No verb. It is a note to remember the bins, the way a person actually writes one. The
entry the journal wrote for that day opened, on four of five runs, with one of these:

    Bins went out first thing, and I made a note to tell my wife about the parking permit.
    Bins went out first thing.
    The bin men came early.

Nobody wrote that the bins went out, that anything happened first thing, or that the bin men came,
let alone that they came early. The fifth run wrote this instead, and it is what the prompt asks
for:

    Bins this morning.

## Why it matters

The prompt already forbids it, in as many words, at `memark/journal.py:104`:

    Write only what the Captures say. Never invent an event, a name or a feeling that is not in
    them, and never guess at what happened between them.

So this is not a rule that needs deciding. It is a rule the prompt states and the model breaks four
times in five.

What makes it worth a ticket rather than a shrug is where the sentence lands. An entry is frozen
once written and immutable to the agent, per ADR 0027, and nothing in the system ever reads one
back. No Card claim may cite it, and it joins no retrieval corpus. So the sentence is never
corrected by a later run and never contradicted by anything. Story 1 of the phase 6 spec is that a
fortnight later somebody can "scroll back and read the days rather than only the facts they left
behind", and they have no way to tell "Bins went out first thing" from the things that did happen.
Story 2 asks for a journal that is "evidence rather than a guess", and it says that about a missing
entry rather than about the prose. The principle is the same one and this ticket borrows it.

The inbox file keeps every byte of `bin men`, per ADR 0001, so nothing is lost. What is wrong is
that the journal folder now says something the inbox does not.

## Why the fix is the prompt

Both models do it, so per `.claude/skills/live-pass/SKILL.md` the prompt is what changes. The
comparison run is a diagnostic and never the answer. ADR 0003 puts judgement on `claude-sonnet-5`,
and that is the model the prompt has to carry. Do not read the `claude-opus-5` column as a fix.

The model is capable of the faithful answer. Run 3 wrote `Bins this morning.` unprompted, so this is
a prompt too thin to carry the case rather than a model that cannot do it.

The prompt forbids inventing an event. It never says what to write instead when a Capture holds no
event to report. "Write the day up as it was" and "a few short paragraphs of plain prose" both pull
towards giving every sentence a verb. One added sentence naming the case is the smallest fix that
closes it. Something in this shape, in the prompt's own voice:

    Some Captures name a thing and say nothing happened to it. Write one as the note it was, and
    never give it a verb it did not have.

## What the probe is and is not worth

`invented_an_event` in `harness/live/repeat.py` reduces the sentence naming the bins to the content
words the day did not hold. It is noisy on a day full of misspellings. It flags `before` because the
day wrote `befre`. So read the quoted sentences above as the evidence and the rate as support. The
raw table says 5 of 5 because the run that wrote `Bins this morning.` flagged the plural `bins`.
Plurals are folded now, and the honest rate is 4 of 5.

This is a judgement finding measured through `claude-cli`, so it is one step short of proof. A run
with `MEMARK_PASS_MODE=live` would settle it, and the fix is worth making either way.

## What the fix measured

The prompt now carries three sentences for this case rather than the one the ticket sketched: the
case itself, a worked example on a Capture reading `dentist`, and a line saying the arrival time
says when they wrote it and nothing more. The one-sentence version was tried first and measured 4
of 5, which is the rate before the fix, so it changed nothing.

| prompt | runs | reproduced |
| ------ | ---- | ---------- |
| before | 5 | 4 of 5 |
| one sentence, as sketched above | 5 | 4 of 5 |
| the case plus the `dentist` example | 5 | 1 of 5 |
| plus a ban on go, come, arrive, start | 5 | 2 of 5 |
| shipped: the case, the example, the time line | 5 | 2 of 5 |
| shipped, larger sample | 10 | 4 of 10 |

So the honest rate is 4 of 10 against 4 of 5 before. The wording halves it and does not close it.
The three variants after the example sit inside each other's noise at five runs, which is why the
ten-run number is the one to read.

What still comes back is the same sentence in new clothes: `Bins went out first thing.`, `Woke up
and put the bins out.`, `Bin men came early enough to catch.` The model does not need a rule it
does not have. It has the rule and writes past it on four days in ten.

**Done when is not met.** The 0 of 5 the ticket asked for was not reached by wording, and three
rounds of wording moved the rate 80 to 40 and then stopped. A fourth round of sentences is not
worth the words in the prompt. What is left is a decision the ticket cannot make for itself: either
this rate is what a prompt can buy and the ticket closes at 40 percent, or the case needs something
that is not a prompt.

## How it closed

The ticket closes at 40 percent. The user took that call on 2026-09-08 and deferred the rest to v2.

The reasoning is that 4 of 10 is what a prompt can buy here. Three rounds of wording bought the
first half and the fourth round bought nothing, so more sentences in the system prompt are not the
lever. Closing the case needs something the prompt is not: a check that reads the written entry,
spots a verb the day's Captures never held, and asks the model again. That is new code and a new
decision about whether the journal may be rewritten before it freezes, so it is not this ticket and
not this phase.

What ships is the 4 of 10 rate and the wording that bought it. The residue is a bare Capture that
picks up a verb on about four days in ten. Nothing reads a journal entry back, per ADR 0027 which
freezes an entry once written, so the sentence is never cited by a Card claim and never enters a
retrieval corpus. The cost is that a person scrolling back a fortnight, which is story 1 of the
phase 6 spec, cannot tell that sentence from a day that happened. The inbox file still holds every
byte of `bin men`, per ADR 0001, so the evidence to correct it by hand is there.

Carried to v2 rather than phase 7.

## Done when

- [x] The journal's system prompt in `memark/journal.py` says what to do with a Capture that names
      a thing and reports no event.
- [x] A unit test in `tests/test_journal.py` pins the new prompt text, the way the existing tests
      pin what comes off the day.
- [x] `python -m harness.live.repeat L46 --runs 5` reports 0 of 5, and the rate before and after is
      written into this ticket. The rates are written in. The 0 of 5 was not reached: it is 4 of 10,
      and the ticket closes at that rate. See "How it closed".
- [x] `pytest`, `mypy`, `ruff check` and `ruff format --check` are green.
- [x] No earlier phase's scenarios were edited.
