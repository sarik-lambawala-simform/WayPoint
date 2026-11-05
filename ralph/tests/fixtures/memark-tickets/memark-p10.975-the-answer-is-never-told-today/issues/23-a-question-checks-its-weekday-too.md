# 23. A question checks its weekday too

**Type:** task

**Status:** completed

**Completed at:** 2026-10-08T05:31:41Z

**Blocked by:** 20, 21, 22

**What to build:** `what did I do on Thursday 9th Oct?` is answered about 09 Oct 2026, and the answer
adds `09 Oct 2026 is a Friday, not a Thursday.`

Spec: [../spec.md](../spec.md), "Strand 4". Decided in
[What does the box do when a weekday and a date disagree?](11-a-weekday-that-disagrees-with-its-date.md).
The rule is ADR 0059, a weekday that disagrees with its date is named in the reply.

Blocked by 20 for the year, 21 for the Intent Read window shape, and 22 for the two `clock.py`
functions it reuses.

## What to change

- **The Intent Read schema and prompt**, `memark/intent.py`: the same optional `weekday` field on
  each end of the window.
- **`memark/handler.py`**: after the window is known, check each end against its field with ticket
  22's functions, and add the short line under the answer. The year checked is the one ticket 20
  took.

## Done when

- [ ] `what did I do on Thursday 9th Oct?` with the field on the reading adds the Friday line.
- [ ] Each end of a range is checked on its own.
- [ ] A matching weekday and no field add nothing.
- [ ] The unit suite, `mypy`, `ruff check` and `ruff format --check` are green.
