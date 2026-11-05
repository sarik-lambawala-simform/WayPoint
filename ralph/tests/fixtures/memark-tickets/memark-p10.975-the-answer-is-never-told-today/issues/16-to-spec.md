# 16. Consolidate every answer into one spec

**Type:** task

**Status:** resolved

**Blocked by:** 01, 02, 03, 04, 05, 06, 07, 08, 09, 10, 11, 12, 13, 14, 15

## Question

Nothing to decide. This is the last ticket of the folder, per the house rule that an issue folder
ends with a spec ticket.

Read the `## Answer` on tickets 07, 08, 09, 10, 11 and 15, and the map's Decisions so far. Then
extend `../spec.md` with the `to-spec` skill. Keep the findings, the bars and "What worked" that are
already there. Add what ships, and the work broken into numbered issues for every decision that
still needs a build.

End the new issue list with the two the house rule requires: the AFK one that adds this phase's
rows and hard checks to `harness/live/`, and the HITL one that runs the live pass.

The rows a later live pass must carry are already in the bundle: `L307`, `L316`, `L319`, `L321`,
`L329`, `L335`, `L337`, `L351`, `L353`, `L355`, `L356`, `L357`, `L358`, `L361`, `L362`, `L368`,
`L371`, `L375` and `L377`. Their hard checks are what this phase adds.

## Answer

Written on 2026-10-08. [../spec.md](../spec.md) now has "The build" after "What worked". The
findings, the bars and "What worked" are kept as they were.

- A code check at `77d0dae` found all six decisions unbuilt. Tickets 01 to 06 and 12 to 14 are built.
- The work is four strands and seven tickets, 17 to 23:
  - 17, ADR 0055, a typed date may come off more than one piece.
  - 18, ADR 0056, an errand with no Card goes to `Loose Ends`, and a Task may open `Me`.
  - 19, ADR 0060, a month-first date is guarded only where English collides.
  - 20, ADR 0058, a question date with no year takes the nearest one.
  - 21, ADR 0057, the model picks the fixed word and code counts it. Blocked by 20.
  - 22, ADR 0059, the weekday check on filing. Blocked by 17.
  - 23, ADR 0059, the weekday check on a question. Blocked by 20, 21 and 22.
- 24 is the AFK ticket for `harness/live/`. The earlier rows are never edited, so it adds twin rows
  from `L379` in `harness/live/scenarios_p10_975.py`. It also covers `L326`, `L327`, `L370` and
  `L376`, which tickets 07 and 08 named.
- 25 is the HITL live pass.
- The spec settles three details the tickets left open: the range wording of the year line, the tie
  rule for the other weekday, and that a Proposed Date gets no weekday line.

