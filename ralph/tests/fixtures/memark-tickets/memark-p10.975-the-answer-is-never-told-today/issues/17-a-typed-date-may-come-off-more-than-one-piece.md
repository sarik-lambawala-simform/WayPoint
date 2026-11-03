# 17. A typed date may come off more than one piece

**Type:** task

**Status:** completed

**Completed at:** 2026-10-08T03:34:55Z

**What to build:** `Pay the property tax on 15th october, remind me 2 days before` lands a Review Date
on 15 Oct with a 2-day notice, however the model cuts the warning off. The same errand sent twice
lands one Review Date.

Spec: [../spec.md](../spec.md), "Strand 1". Decided in
[Which pieces may a typed date come off?](07-which-pieces-may-a-typed-date-come-off.md). The rule is
ADR 0055, a typed date may come off more than one piece, when code can prove whose it is.

## What happens today

`_typed` in `memark/vault/apply.py` skips an edit that cites more than one Capture, or that more
than one claim piece names. So the date waits for a yes. `L307` 7 of 15, `L316`, `L375`, `L337`.

## What to change

In `_typed`:

1. **Several pieces.** Collect every claim piece that names the edit. Exactly one must pass
   `states_a_date`, and code reads the day off that one. Each other piece must name only edits the
   dated piece also names.
2. **Several Captures.** Run the one-Capture test for each cited Capture alone. All must pass with
   the same day.
3. **Two days for one errand.** Once every edit has a verdict, group the passing dated edits by
   `subject` and `heading`. A group with two different days leaves the typed set whole.

Anything else is a Proposed Date, as now. Rewrite the docstring to name ADR 0055.

## Done when

- [ ] `L307`'s cut confirms 15 Oct with a 2-day notice, and the reply says `2 days before`.
- [ ] `buy milk, call mom on 8 oct`, with the milk date edit on both pieces, leaves milk a Proposed Date.
- [ ] Two dated pieces naming one edit leave it a Proposed Date.
- [ ] One edit citing two Captures with the same day is one Review Date. With different days it is a Proposed Date.
- [ ] `L327`'s two dated edits for one errand are both Proposed Dates.
- [ ] The unit suite, `mypy`, `ruff check` and `ruff format --check` are green.
