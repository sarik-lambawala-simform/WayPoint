# 01 — Six checks cannot read the footnote phase 10.9 lengthened

**Type:** defect

**Status:** completed

**Reproduces:** every run, and not a model defect.

## What happens

Phase 10.9's ticket 25 added a sentence to the end of a recalled answer's footnote, per ADR 0045,
Recall reads forward. An answer that carried open Tasks now ends like this:

    Read all 3 notes and 1 dated line from 07 Aug 2026 to 27 Aug 2026. Your 2 open errands were read too.

The checks that read that footnote were not told. `_a_sentence_pattern` in
`harness/live/checks.py:1793` builds each pattern as `^` + the sentence + `$`, so the sentence
appended after it makes the whole line stop matching. The failure prints as `names no window this
format can read`, which reads like the box wrote something malformed. The box wrote exactly what
ADR 0045 asked it to.

Proved without a model:

    >>> from harness.live.checks import _matched_window, A_RECALLED_WINDOW
    >>> line = "Read all 3 notes and 1 dated line from 07 Aug 2026 to 27 Aug 2026."
    >>> _matched_window(line, A_RECALLED_WINDOW) is not None
    True
    >>> _matched_window(line + " Your 2 open errands were read too.", A_RECALLED_WINDOW) is not None
    False

Both trailing sentences do it, `TASKS_READ` and `ONE_TASK_READ`, at `memark/answering.py:564`
and `:565`.

## Why it matters more than one red row

`_matched_window` is what six checks see the window through. Two of them are in `COMMON`, so every
row of every phase is held to them:

| Check | Where |
| ----- | ----- |
| `a_recall_window_was_read_whole` | `checks.py:2609`, in `COMMON` |
| `a_wider_window_was_always_stated` | `checks.py:2742`, in `COMMON` |
| `a_widened_answer_names_the_window_it_read` | `checks.py:2681`, in `COMMON` |
| `an_answer_never_empties_a_window_it_read` | `checks.py:2471` |
| `a_count_says_what_it_was_read_from` | `checks.py:2918` |
| `_window_of`, which the first three read the window through | `checks.py:2564` |

So an answer that carried open errands is scored by checks that cannot see the one line they are
about. The ones that fail go red for the wrong reason. The ones that read the line only to compare
it get `None` and pass, which is worse: `a_widened_answer_names_the_window_it_read` compares the
window the reply names against the one `recall.widened` gives, and a `None` on the left of that
comparison is an assertion that stopped asking.

This is ticket 01 of phase 10.9 again, the harness's own eyes, and it arrived the same way: a phase
changed a sentence and the checks that read it were not changed with it.

## Where it was found

`L117` and `L140`, both in `scenarios_p09.py`, both forward or widened windows on the baseline
Vault. Neither row is new. Both passed before ADR 0045 landed.

## Done when

- [x] A footnote carrying `TASKS_READ` or `ONE_TASK_READ` is read by `_matched_window` exactly as
      the same footnote without it is, with the same window and the same counts.
- [x] The Task sentence is read from the sentence in `answering.py` rather than written out again
      here, the way `_a_sentence_pattern` already derives the others, so the next rewording of it
      breaks out loud instead of breaking in silence.
- [x] `L140`, `L195` and `L280` are re-run and none fails on `names no window this format can
      read`. `L54` is green too, by ticket 06.
- [x] `pytest`, `mypy`, `ruff check` and `ruff format --check` are green.

## Three rows are still red and all three are ticket 02, not this

The re-run of eight rows came back 5 pass, 3 fail. Every one of the three fails on the same check
with a footnote that has a hole in it:

    L117  Read all  from 12 Sep 2026 to 18 Sep 2026. Your 2 open errands were read too.
    L252  Read all  from 01 Sep 2026 to 30 Sep 2026. Your 9 open errands were read too.
    L253  Read all  from 21 Sep 2026 to 27 Sep 2026. Your 9 open errands were read too.

The tail is stepped over correctly now. What cannot be parsed is the hole where the count belongs,
because `(?P<read>.+?)` needs at least one character and the count is the empty string. That is
ticket 02, and all three go green when ticket 02 does. Nothing here is widened to accept an empty
count: a check that could read a footnote with a hole in it would be a check that never reports
one.

This is also the measurement that says how much of ticket 02 there is. Every forward window in the
re-run that carried errands and no notes printed the hole, which is three of eight rows rather than
the one the pass first showed.
