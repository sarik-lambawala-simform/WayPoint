# 02 — A forward window with only errands in it prints a footnote with a hole

**Type:** defect

**Status:** completed

**Completed at:** 2026-09-19T17:39:17Z

**Reproduces:** every run for a window of that shape, and not a model defect.

## What the person reads

`L117` asked `?what was going on around the middle of this month` and the reply ended:

    Read all  from 12 Sep 2026 to 18 Sep 2026. Your 2 open errands were read too.

`Read all  from` has two spaces and no count. The sentence that is supposed to say how much was
read says nothing, and the gap is where the number was meant to be.

## Why

`_the_window_was_read` in `memark/answering.py:677` builds the count from two halves:

    counted = [
        one
        for one in (
            _counted(len(found.recalled), one=ONE_NOTE, many=NOTES),
            _counted(len(found.dated), one=ONE_DATED_LINE, many=DATED_LINES),
        )
        if one is not None
    ]
    said = _about_the_window(READ_A_DAY, READ_A_RANGE, window, clock=clock, read=AND.join(counted))

`_counted` returns `None` for a count of zero, at `answering.py:694`. When a window holds no notes
and no dated lines, both halves are `None`, `counted` is empty, `AND.join([])` is the empty string,
and `READ_A_RANGE` is formatted with `read=""`.

Before ADR 0045 this could not be reached. A window holding nothing was widened or refused, so the
line was never written over an empty one. ADR 0045 made an open Task travel with any window
touching today or later, so a forward window can now hold nothing but Tasks, reach this line, and
have nothing to put in it.

## What is not wrong here

The Task sentence is right and belongs where it is. ADR 0045's own note at `answering.py:559` says
why a Task is counted in a sentence of its own: the first sentence ends by naming the window, and
a Task falls on no day, so counting it in there would say an errand is due inside days it has
nothing to do with. The fix is the empty half of the first sentence, not the second one.

## The second half of this row, which is a different ticket

The same reply read September on a Vault whose today is 27 August, so `middle of this month` went
forward a month. That is phase 10.9's ticket 12 shape and it is filed separately.

## Done when

- [ ] A window that holds no notes and no dated lines never produces a sentence with an empty
      count in it.
- [ ] What it says instead states plainly that the days themselves held nothing, and is still one
      sentence code wrote, per ADR 0028's rule that the footnote is code's and never the model's.
- [ ] The Task sentence after it is unchanged, and a window carrying Tasks still says so.
- [ ] A unit test covers a forward window holding no note, no dated line and at least one open
      Task, asserting the exact sentence.
- [ ] `pytest`, `mypy`, `ruff check` and `ruff format --check` are green.
