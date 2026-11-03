# 04 — The link says the words repeat, and is named for it

**What to build:** `again-of::` becomes `same-as::` and every document and module that calls it a
returning errand is corrected, so the field and its ADR say the same thing.

**Status:** completed

**Completed at:** 2026-09-15T11:31:55Z

**Blocked by:** ticket 03, which is resolved. Read its "The decision" section first. This ticket is
the work that decision names and reopens none of it.

**Not a rate.** Nothing here reproduces, because nothing here is a model defect. `L165` already
does what was decided. What is wrong is that six files describe it as something else.

## Why the rename and not just the words

Ticket 03 decided the field means the words repeat and never that an errand was left undone. The
name `again-of::`, the module `memark/returning.py`, and one sentence of its prompt all carry the
reading that was refused. A key whose name argues with its own ADR is exactly the defect tickets 01
and 02 of this phase are about: a line that outlived its decision.

There is no Vault in production, so the key changes for the cost of an edit. No migration, no
compatibility read, and nothing accepts the old key.

## The one prompt sentence

`memark/returning.py`'s `SYSTEM` ends:

> Answer null when you are not sure. A missing link costs nothing. A wrong link tells somebody they
> have done something they have not.

The first two sentences stay and are still true. The third is the refused reading and goes. In its
place the prompt gains the case ticket 03 settled: an errand that comes round on a schedule matches
its own last closure and that link is correct. Use an errand that is not `L165`'s, because a prompt
holding the row's own words turns the row into a test that grades its own homework. The rent cheque
or the LIC premium are the ordinary shapes.

## What holds the old name

Nothing in `tests/fixtures/` writes the field, so no checked-in Vault tree changes.

| File | What is in it |
| ---- | ------------- |
| `memark/vault/grammar.py` | `AGAIN_OF` at `:150`, and the field-writing docstring at `:526` |
| `memark/vault/lint.py` | `LINK_KEYS` at `:42`, the comment at `:52` and `FOLLOWED_KEYS` at `:54` |
| `memark/vault/apply.py` | `:558`, `:1828`, `:3172`, `:3192`, `:3199`, code and prose both |
| `memark/distillation.py` | `:188` and `:202`, the edit structure that carries the link |
| `memark/filing.py` | `:530`, where the second call is described |
| `memark/returning.py` | the whole module: name, docstring, `SYSTEM`, `Returning`, `returning_errands()` |
| `memark/tasks.py` | the closed-line index |
| `tests/` | `test_returning_errands.py`, `doubles.py`, `test_grammar.py`, `test_lint.py`, `test_skip.py`, `test_filing_run.py` |
| `harness/live/` | `checks.py`, `repeat.py`, `scenarios_p05.py`, `scenarios_p10_7.py`, `scenarios_p10_7_india.py` |

`memark/unparking.py` and `memark/vault/dates.py` hit the word "returning" as ordinary English. Leave
them.

`.scratch/memark-v1/spec.md` names the old key in four places. Leave it. It is the record of what was
decided then, and the ADRs carry what is true now.

## The harness is renamed and not rewritten

Phase 10.7's rows are this phase's regression coverage and none of them is edited to make this pass.
The only change to `scenarios_p05.py`, `scenarios_p10_7.py` and `checks.py` is the field key and the
symbol name. No message, no fixture, no expected value.

`L165` is the one exception and it is not a rewrite. Its `stresses` text says the call "is printed
here rather than scored" because ticket 03 was open. Ticket 03 is closed, so the row gains the hard
check it was always going to get: the link fills, naming the closed line on Nikhil's Card.

## Done when

- [ ] `same-as::` is the only key written. `grammar.py`, `lint.py` and `apply.py` carry no
      `again-of` and nothing reads the old key.
- [ ] `memark/returning.py` is `memark/same_errand.py`, `Returning` is `SameErrand`,
      `returning_errands()` is `same_errands()`, and `tests/test_returning_errands.py` follows.
- [ ] The module docstring says what the field means: the words repeat, and never that an errand was
      left undone. The next reader must not be able to take the monthly link out as a false positive.
- [ ] The `SYSTEM` prompt loses "A wrong link tells somebody they have done something they have not"
      and gains a scheduled-errand example that is not `L165`'s.
- [ ] ADR 0034 carries a third amendment: the meaning, the rename, and the Digest rule. The Digest,
      when it ever reads the field, says the person has written this before and never that they did
      not finish something. Nothing already on that page is deleted.
- [ ] ADR 0026 has the key swapped in place, in both the ticket 20 amendment and the enumerated
      field set.
- [ ] CONTEXT.md's `Task` entry no longer says an errand that returns. It says a new Task that is the
      same errand as a closed one points back at it, and that the link says the words repeat. No new
      glossary term.
- [ ] `L165` in `harness/live/scenarios_p10_7_india.py` is scored, asserting the link fills, and its
      `stresses` text says why the link is correct rather than that the question is open.
- [ ] `python -m harness.live.repeat L165 --runs 5` reports 5 of 5 filling on `claude-haiku-4-5`.
- [ ] `L162`, `L163` and `L164` still fill, and `L166` and `L167` still pass. Those four are what the
      prompt change is most likely to cost.
- [ ] `pytest`, `mypy`, `ruff check` and `ruff format --check` are green.
