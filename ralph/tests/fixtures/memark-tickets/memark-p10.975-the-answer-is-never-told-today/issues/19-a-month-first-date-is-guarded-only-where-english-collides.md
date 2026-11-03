# 19. A month-first date is guarded only where English collides

**Type:** task

**Status:** completed

**Completed at:** 2026-10-08T04:11:30Z

**What to build:** `Oct 8th order hand blender` states a date and files as a Review Date on 8 Oct.
`can may 3 people come` still states none.

Spec: [../spec.md](../spec.md), "Strand 2". Decided in
[May a month that is no English word come first, before a word?](15-a-month-first-date-before-a-word.md).
The rule is ADR 0060, a month-first date is guarded only where English collides.

## What happens today

The month-first branch of `A_DATE` in `memark/written_dates.py` carries `ENDS_A_PHRASE` for every
month. A word after `Oct 8th` blocks the date. `L371` waited in 2 of 3.

## What to change

Split the month-first branch of `A_DATE`:

- An ordinal day (`st`, `nd`, `rd`, `th`) carries no `ENDS_A_PHRASE`.
- A bare day carries `ENDS_A_PHRASE` only for `may`, `march`, `mar`, `august`, `june`, `april`,
  `jan`. Keep the list as one named tuple with a comment on why each is there.
- Keep the named groups, so `recall._day` and `the_day_named` read the match unchanged.
- The bare-ordinal branch, `the 3rd`, keeps its guard.

Rewrite the comment above `ENDS_A_PHRASE` and `A_DATE` to say which months collide and why an
ordinal ending is safe.

## Done when

- [ ] `Oct 8th order hand blender`, `Oct 8 order blender` and `May 8th order cake` state a date.
- [ ] `can may 3 people come`, `is the march 5 miles`, `ask jan 2 questions`, `may 8 order cake` and
      `the 3rd time` do not.
- [ ] `Oct 8th order hand blender` filed through the run lands a Review Date on 08 Oct 2026.
- [ ] The unit suite, `mypy`, `ruff check` and `ruff format --check` are green.
