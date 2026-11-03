# 10 — The Cards go in the prompt unless the message names a time and nobody

**Type:** task

**Status:** completed

**Completed at:** 2026-09-17T10:05:18Z

**Blocked by:** 09

**What to build:** a question that names a subject reaches the Cards, whether or not it also names a
festival or a stretch of time.

## What happens today

Three rows of forty made no answering call at all.
[Ticket 03](03-a-question-that-names-a-festival-never-reaches-the-cards.md) holds the transcripts and
the rates. `L189` sends `ramaben ne bola diwali bonus chahiye, last year kitna diya tha` to a Vault
that holds a Card for Ramaben saying she asks for the Diwali bonus a month in advance, and the reply
is `I have no diwali on record`. The occasion wins and the question is dropped without being asked.

`L189:route` reproduces 2 of 5 on `claude-haiku-4-5`, which is the tier the box runs, and 5 of 5 on
`claude-sonnet-5`. The stronger tier is worse, because it sees `diwali` more reliably and the code
then drops the question more reliably. No prompt was going to fix this.

## What to change

**One rule over the whole answering path: the Cards go in the prompt unless the message names a time
and nobody.** Code still reads the window exactly as it does today. The window stops deciding whether
a Card is ever opened.

`_window_for` and `_occasion_window` at `memark/handler.py:903` keep reading the window and stop
deciding the answer's fate. `_written` gains the branch that puts the Cards and the window's material
in one prompt.

**What goes away.** `no_occasion` at `memark/answering.py:913` becomes unreachable and goes, with
`_not_on_record` at `memark/handler.py:976` and the `TheWindow | str | None` return that existed to
carry it. There is no route left to it: an occasion with no confirmed day now resolves to no window,
and a question with no window is a Lookup question. Nothing is lost, because a Vault that truly holds
nothing on the words is already answered for free by `found_nothing`.

**What stays.** `could_not_use_the_window`. A pair of days code cannot parse is the model returning
something code cannot use, per ADR 0032's exact match or nothing, and that is a different failure from
an occasion nobody wrote a date for.

**No line is written above the answer saying the occasion has no date on record.** Issue 12 is fixing
one sentence that argues with the paragraph under it. A second such sentence would be the same mistake
with a new cause.

**This issue does not touch a footnote.** The miss line is issue 12's and the sources line is issue
14's.

## The bill

The path that stays cheap is the only one that never needed the Cards: about 375 tokens for a day,
2,600 for a week and 11,000 for a month. Nothing on it changes.

What starts paying is the path that is free and wrong today. An occasion with no confirmed day costs
$0 now and says nothing useful, and it becomes one ordinary answering call, near 150,000 tokens and
about 30 cents on the Vault ADR 0043 costed. That is the whole of the increase. ADR 0043's month of
about $90 at ten questions a day is the same month, because these questions were always inside the ten
and were being refused rather than answered.

## Done when

- [x] A reading with a subject and a window makes one call whose prompt holds every Card and the
      window's material.
- [x] A reading with a window and no subject is Recall as it is today, with no Card in the prompt.
- [x] `subjects is None` sends the Cards.
- [x] An occasion with a confirmed day beside a subject sends the Cards and that day's material.
      This is the row no pass has exercised.
- [x] `no_occasion` and `_not_on_record` are deleted and the return type narrows with them.
- [x] `could_not_use_the_window` still fires on a pair of days code cannot parse.
- [x] Unit tests cover all six lines above.
- [x] `python -m harness.live.repeat L134:route L189:route --runs 5` reproduces 0 of 5 on
      `claude-haiku-4-5`.
- [x] No earlier phase's scenarios were edited, apart from `L72` and `L90` under
      `harness/live/README.md`'s supersession rule. Both asserted the words for an occasion the
      Vault confirmed no day for, and this issue deletes them, so both are a record of a rule the
      box no longer has rather than regression coverage. Each is rewritten to the decision that
      replaced it, and the note naming the row and saying why is in its own module's docstring.
- [x] `pytest`, `mypy`, `ruff check` and `ruff format --check` are green.
