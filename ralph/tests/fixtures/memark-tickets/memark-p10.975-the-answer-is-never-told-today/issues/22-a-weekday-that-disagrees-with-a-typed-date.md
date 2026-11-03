# 22. A weekday that disagrees with a typed date is named in the reply

**Type:** task

**Status:** completed

**Completed at:** 2026-10-08T05:16:30Z

**Blocked by:** 17

**What to build:** `PTM at school on Thursday 9th Oct, both of us need to go` confirms 09 Oct 2026,
and under that errand's reply line the reply says `09 Oct 2026 is a Friday, not a Thursday. If you
meant Thursday 08 Oct, send undo and send it again with that date.`

Spec: [../spec.md](../spec.md), "Strand 4". Decided in
[What does the box do when a weekday and a date disagree?](11-a-weekday-that-disagrees-with-its-date.md).
The rule is ADR 0059, a weekday that disagrees with its date is named in the reply.

Blocked by 17 because both change how a typed date reaches the reply.

## What happens today

Nothing reads the weekday. `L335` confirmed 9 Oct and said nothing.

## What to change

- **The filing schema and prompt**, `memark/distillation.py`: an optional `weekday` string on a
  dated edit. Send it only when a weekday word is attached to that date, in any language or short
  form, written as the English name.
- **`memark/clock.py`**: one function turns the field into a weekday, or nothing. One function takes
  a date and a weekday and returns the warning, or nothing when they match. The other day is the
  nearest day on the typed weekday. A tie goes back. A field code cannot read is dropped and logged.
- **`memark/acknowledge.py`**: the warning goes under the piece's line, through `_per_piece`, only
  for a confirmed date. A Proposed Date gets no line.

## Done when

- [ ] `Thursday 9th Oct` with `"weekday": "Thursday"` confirms 9 Oct and the reply holds the Friday
      line under that errand.
- [ ] A matching weekday, no field, and a field code cannot read each add no line. The last logs once.
- [ ] Two errands, the weekday on the second, keep the line under the second.
- [ ] A Proposed Date with a disagreeing weekday adds no line.
- [ ] The unit suite, `mypy`, `ruff check` and `ruff format --check` are green.
