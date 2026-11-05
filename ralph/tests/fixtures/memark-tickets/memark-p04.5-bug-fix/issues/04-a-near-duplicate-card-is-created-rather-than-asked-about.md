# 04 — A subject that case-folds onto an existing name or alias creates a second Card

**Status:** completed

**Completed at:** 2026-09-03T12:05:34Z

**Owned by:** phase 3. `memark/vault/registry.py`, and the write path in `memark/vault/apply.py`.

**Found by:** the phase 1 to 4 integration pass, scenario B29.

## What happens

`rows_named` matches a subject exactly, which is right: ADR 0015 decided a near match is asked about
and never guessed. What is missing is the asking. A subject that reaches no row is treated as a
subject the Vault has never heard of, so `apply` creates a Card and adds a Registry row, even when the
name differs from an existing row only in case.

The baseline Registry carries `Priya (colleague)` with `aka:: priya, prya`. A filing call that returns
the subject `Priya` or `PRIYA` with a `registry_note` gets a new `people/priya.md` beside
`people/priya-colleague.md`, and a second Registry row. Nothing asks, nothing is held back, nothing is
counted, and `lint` passes: two Cards about one person, and the next Capture about her lands on
whichever spelling the model happens to use that afternoon.

The evidence code needs is already on the row. `priya` is an alias, and `Priya` case-folds onto it.

## Reproduction

```python
from lib import Driver
from b_filing import edit, file_with, one_capture

drive = Driver()
block = one_capture(drive, "priya mentioned the santoku again")
file_with(
    drive,
    [
        edit(
            "extend",
            "Priya",
            "person",
            "Facts",
            "she mentioned the santoku",
            [block],
            registry_note="works with me",
        )
    ],
)

assert "people/priya.md" in drive.files()  # beside people/priya-colleague.md
assert "|Priya]]" in drive.read("registry.md")  # a second row for the same person
assert drive.lint()["ok"] is True  # and nothing flags it
```

`PRIYA` behaves the same way. `priya` resolves to the existing row and extends it, which is correct.
A subject with only leading or trailing whitespace is stripped and resolves, which is also correct.

A near-miss with no `registry_note` is refused twice over, once for having no row to describe it and
once because the path already exists, so it writes nothing and stays undrained. That refusal is the
behaviour this ticket wants for the case that does have a note.

## What should happen

`.scratch/memark-p03-filing-run/spec.md`, story 5:

> (16) As someone who has seen note systems rot, I want the agent to consult a Registry before
> creating a Card, so that the same person never ends up split across near-duplicate files.

And its implementation decision, which claims more than the code delivers:

> **The Registry ships whole on every filing call.** Every Card adds a row and every call carries all
> of them, so the model always sees every existing subject and cannot create a duplicate. That
> guarantee is arithmetic rather than hope, and v1 buys it rather than optimising it away.

Shipping the Registry whole is what stops the model guessing. It is not arithmetic: whether a
duplicate is created depends on the model spelling the subject exactly, and nothing in code checks a
new Card's name against the names and aliases already in the Registry. The arithmetic the sentence
promises is one case-folded comparison on the write path, before a Card is created.

This is not the Merge Proposal case that the First Loop leaves out. ADR 0025 covers a misheard
spelling the Registry cannot see as a duplicate, `Prya` for `Priya`. Here the Registry can see it: the
alias is on the row and the incoming name folds onto it.

## Actual behaviour

| subject the call returned | result |
| ------------------------- | ------ |
| `Priya (colleague)` | extends the existing Card. Correct. |
| `priya`, `prya` | alias resolves, extends the existing Card. Correct. |
| ` Priya (colleague) ` | stripped, resolves, extends. Correct. |
| `Priya` with a note | creates `people/priya.md` and a second Registry row. |
| `PRIYA` with a note | creates `people/priya.md` and a second Registry row. |
| `PRIYA (COLLEAGUE)`, `Priya  (colleague)`, `WIFE` | refused, undrained, the Digest asks. Correct. |

## Done when

- [ ] An edit whose subject differs from an existing Registry name or alias only in case creates no
      Card and adds no Registry row.
- [ ] It is held back rather than dropped in silence: the Capture stays undrained and the Digest asks
      about it. Which existing ask path it joins is the implementer's call, and it has to be one of
      them rather than a new store, per ADR 0020.
- [ ] The exact spellings still resolve and still extend the Card they name: the Registry's own name,
      every `aka::` alias on the row, and a name carrying leading or trailing whitespace.
- [ ] A genuinely new name still creates one Card in the folder its `card_kind` names and one
      Registry row, per scenario B27.
- [ ] Two batches in one run proposing the same new subject still end in one Card and one row, per
      phase 3's own test case.
- [ ] A subject matching two rows exactly is still the Ambiguous Subject of ADR 0015 and is
      unchanged.
- [ ] The hold-back is counted, so the Canary shows it rather than the day reading clean.
- [ ] A checked-in fixture holds a Registry whose alias a near-miss name folds onto.
- [ ] A test at the scheduled run seam.
