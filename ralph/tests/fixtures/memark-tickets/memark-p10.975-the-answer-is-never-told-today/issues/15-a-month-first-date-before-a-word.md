# 15. May a month that is no English word come first, before a word?

**Type:** grilling
**Status:** resolved

## Question

`written_dates.ENDS_A_PHRASE` guards every month-first date: a word after `Oct 8th` means the number
counts that word. The comment says why. `may`, `march`, `august` and `mar` are English words too, so
`can may 3 people come` must not read as 3 May.

The guard also stops dates no sentence could be confused with:

    'Oct 8th order hand blender'   states_a_date: False
    'Oct 8th'                      states_a_date: True
    '8th oct order blender'        states_a_date: True

`L371`, `Oct 8th order hand blender`: the date waited for a yes in 2 of 3 runs. It was confirmed only
when the model cut `Oct 8th` into a piece of its own. Month-first is how a bank SMS, an Amazon
delivery notice or an American colleague writes a date.

Which of these?

- **Guard only the month names that are English words**, and read `Oct 8th order hand blender` as
  8 Oct.
- **Keep the guard for every month**, as now.

## Answer

Grilled on 2026-10-07. Written down as ADR 0060, a month-first date is guarded only where English
collides:
[../../../docs/adr/0060-a-month-first-date-is-guarded-only-where-english-collides.md](../../../docs/adr/0060-a-month-first-date-is-guarded-only-where-english-collides.md).

- **An ordinal ending lets any month through.** `Oct 8th order hand blender` is 8 Oct, and
  `May 8th order cake` is 8 May. A number with `th` names a day and never counts a thing.
- **A bare number lets a month through unless the month collides.** Blocked: `may`, `march`, `mar`,
  `august`, and the first names `june`, `april`, `jan`. So `Oct 8 order blender` is 8 Oct, and
  `may 8 order cake` and `ask jan 2 questions` stay blocked.
- The bare-ordinal guard (`the 3rd time`) is unchanged.
- Names are blocked too because a blocked date costs one yes (ADR 0012) and a wrong date costs a
  wrong reminder.
- `CONTEXT.md`: no change. No new term.

Build: split the month-first alternative in `written_dates.A_DATE`, rewrite its comment, and add a
`harness/live/` bar for `L371` that expects 08 Oct confirmed with no wait.
