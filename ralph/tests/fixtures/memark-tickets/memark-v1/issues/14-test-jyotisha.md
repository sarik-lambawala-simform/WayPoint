# Test whether jyotisha produces accepted festival dates

Map: [map.md](../map.md)
Type: task
Status: closed — out of scope

## Question

Nothing to decide. Ticket 09 names this as "the single most valuable follow-up experiment available",
and ticket 10 cannot honestly choose between a checked-in table and a computed source without it.

`jyotisha` + `adyatithi` is the only surveyed option that models the actual doctrine rather than
hand-copying a website — `adyatithi` encodes each festival's kaala and priority rules in TOML, with the
classical citations. Ticket 09 never ran it, because its dependency tree pulls in Flask, `astropy`,
`scipy`, `pandas`, `python-telegram-bot` and `discord.py`, which was disproportionate to the question at
the time. It is proportionate now.

Do:

- Install `jyotisha` in a throwaway virtualenv (not the project's). Record what it actually pulled in,
  its total install size, and whether any part of it needs network access at run time.
- Generate Rakshabandhan and Diwali for a span covering the years where ticket 09's naive rule
  disagreed with published dates — at minimum 2029 and 2032 for Rakshabandhan (where Drik Panchang
  contradicted the sunrise rule) and 2024 for Diwali, plus the two intercalary-month years 2004 and
  2023 that broke the naive implementation by a whole month.
- Compare against Drik Panchang and against the `holidays` table. Report agreement per year, not in
  aggregate.
- Establish whether it exposes **regional or sampradaya variance** as a setting, or silently picks one
  tradition. This is the question that matters most: a library that lets you say which convention you
  follow is a different proposition from one that decides for you.
- Establish whether it can emit dates far enough ahead to be useful — ticket 09 found published tables
  stop at 2035, and ADR 0016's notice windows mean dates must exist in the Vault more than a festival-year
  before they fire.
- Note whether it can be used as a *generator* run once (writing dates into the Vault and then
  uninstalled) rather than a runtime dependency. That would let the doctrine be borrowed without the
  dependency tree being adopted, which is likely the only shape in which it is acceptable here.

Record the results as the ticket's answer, including a plain statement of anything that could not be
made to run. A library that cannot be installed reliably is itself a finding.

## Closed — out of scope

Ruled out of scope, not resolved. Festival dates are now **asked of the human** rather than computed
(see [10 — How a moving date is represented](10-moving-date-representation.md)).

`jyotisha` was only worth testing because a computed date has to be doctrinally correct — nobody checks
it, so the library carries the whole burden of being right for this particular household. Once every
festival date is confirmed by a human before it counts, correctness stops being the library's job. What
remains is the far weaker requirement of producing a plausible *guess* for the human to confirm, which
`holidays` already satisfies within its range and which degrades safely to a bare ask outside it.

Nothing here is worth revisiting unless the decision to ask is reversed.
