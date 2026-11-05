# 04 — A festival date is never the model's to know

**What to build:** the Intent Read stops working out what day a festival falls on, so a guessed
date cannot reach code dressed as a window the person asked for.

**Status:** completed

**Reproduces:** 2 of 5 on `claude-haiku-4-5`, the tier ADR 0031 puts the Intent Read on, for
`L189:route`. Both failing runs returned the same invented window. 0 of 1 on `claude-opus-5`.

## What happens

`L189` sends `?ramaben ne bola diwali bonus chahiye, last year kitna diya tha` to a Vault whose
newest Captures are from August 2026 and which holds no Date File line for Diwali in any year.

Two runs in five came back with this reply:

> You sent me nothing between 12 Sep 2025 and 18 Sep 2025. I widened to the 21 days from 05 Sep 2025
> to 25 Sep 2025 and you sent me nothing in those either, so I have nothing from them.

Nothing in the message says September, or 2025, or any date at all. The reading returned that window
in `from` and `to`. The only way to get it is to know roughly when Diwali falls and to count back a
year from `last year`. It is also wrong: Diwali 2025 was in October.

## Why it is a defect and not a judgement call

ADR 0012 and ADR 0033 both decided this, and `memark/handler.py:903` says it in a comment:

> The day comes from the Vault's own confirmed line, per ADR 0012, and never from a table of
> festivals, whichever of the two readings named it. Where nothing was confirmed the reply says so
> and no call is made: a guessed day would be a confident answer about a day nobody ever marked,
> and that is as true of a name a model read as of one code read.

That guard is on the `occasion` field. A festival name arriving as `occasion` is looked up in the
Vault and refused when no day is on record, which is right, and `L194` proves the good half: asked
`?what did we do on Holi this year`, the box found the Vault's own 4 March line and read that day.

There is no guard on `from` and `to`, because there cannot be a useful one: `2026-08-17` is a
perfectly good window for `pichle hafte` and code cannot tell which arithmetic produced it. So the
rule has to hold in the prompt, where the reading is made.

## What to change

`memark/intent.py`'s window instruction. A festival, a religious day or any named occasion goes in
`occasion` in the person's own words, and never into `from` and `to`. The model does not work out
what day it falls on, in this year or any other, because the Vault is the only thing that knows
which day this household kept it on.

The instruction already has the shape for it: the `occasion` field exists precisely so the name can
come back unresolved. What is missing is the sentence saying that computing the date yourself is
not an alternative way to answer the same question.

## Not this ticket

Whether an occasion with no day on record should still let the question be answered is ticket 03,
and it is a grilling ticket because phase 10.8's spec put the routing question on the map rather
than in the code. This ticket is only about where a date may come from, which is already decided.

## Done when

- [x] `memark/intent.py`'s window instruction says a named occasion is returned as `occasion` and
      never converted to a date by the model, with the reason named: the Vault holds which day this
      household kept it on.
- [x] `python -m harness.live.repeat L189:route --runs 5` returns no run whose reply names a window
      no word of the message asked for. 0 of 5 on `claude-haiku-4-5`, and every one of the five
      reached the Cards.
- [x] `L194` still resolves `Holi` to the Vault's own 4 March line, so the good half is not lost.
      3 of 3 on `claude-haiku-4-5`: the reading returns `occasion: Holi` with no days, and the
      reply quotes the 4 March line.
- [x] A unit test covers a reading that returns both an occasion and a window, so the refusal has a
      home in `tests/` and not only in the live bundle.
- [x] No earlier phase's scenarios were edited.
- [x] `pytest`, `mypy`, `ruff check` and `ruff format --check` are green.
