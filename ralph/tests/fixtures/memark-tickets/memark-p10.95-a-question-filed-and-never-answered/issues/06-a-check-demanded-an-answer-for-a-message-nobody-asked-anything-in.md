# 06 — A check demanded an answer for a message nobody asked anything in

**Type:** defect

**Status:** completed

**Reproduces:** every run, and not a model defect.

## What happened

`L54` sends two plain thoughts and asks nothing:

    dentist week after next, ring them
    my wifes cousin is getting married in the spring so keep a weekend free

The row went red on `an occasion with no day reached the Cards`, printing
`'spring' wanted 1 answering calls and got 0`.

## Why

`an_occasion_with_no_day_reached_the_cards` at `harness/live/checks.py:3012` puts a reading in
scope when two things are true: the reading named at least one subject, and the window it returned
names an occasion the Vault confirms no day for. The second message satisfies both. Its reading
was:

    {'subjects': ['my wifes cousin', 'Me'], 'question': None,
     'window': {'from': None, 'to': None, 'occasion': 'spring', 'around': False}}

`question` is `None`, so nothing was asked and nothing was owed an answer. The check counted it
anyway and then demanded a call that had no reason to be made.

The finding the check was written for is a question that reached no call. Its own docstring names
the message: `ramaben ne bola diwali bonus chahiye, last year kitna diya tha`, which is a question.
Being a question was part of the rule from the start and was never part of the test.

## What was done

`question` is now part of what puts a reading in scope, and the docstring says so and names this
row. Nothing else about the check moved: an occasion beside a subject in a real question still owes
its call, per ADR 0033 as amended, and the free path for a Vault holding nothing is untouched.

## Done when

- [x] A reading with no question in it is out of this check's scope.
- [x] The docstring names the row and says why, so the next reader does not narrow it further.
- [x] A question naming a subject beside an occasion with no confirmed day still owes an answering
      call, which is the finding the check exists for.
- [x] `pytest`, `mypy`, `ruff check` and `ruff format --check` are green.
- [ ] `L54` is re-run and does not fail on this check.
