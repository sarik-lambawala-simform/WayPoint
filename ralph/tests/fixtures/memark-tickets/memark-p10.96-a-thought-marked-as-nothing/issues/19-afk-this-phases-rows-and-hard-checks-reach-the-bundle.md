# 19. AFK: this phase's rows and hard checks reach the bundle

**Type:** task

**Status:** completed

**Completed at:** 2026-09-25T10:51:46Z

**Blocked by:** 16, 17, 18

**What to build:** the live bundle carries this phase's new row and hard check, and the dry run
proves the wiring before a real call is made.

Spec: [../spec.md](../spec.md). The method is `.claude/skills/live-pass/SKILL.md`.

## The new row

`L303`, a passing mood with no taste clause in it. Tickets 07 and 15 handed it to the spec. `L126`
mixes a mood with `I hate mondays`, which ticket 07 allowed to be read as a taste, so `L126` cannot
carry the no-regression check for moods. This row does.

- In `harness/live/scenarios_p10_96.py`, after `L302`, on the baseline fixture like `L126`.
- Its words are in no earlier row and in no prompt. Add them to ticket 17's absent-words test.
- In `PROBES`: `L303` gets `a_mood_reached_the_card` and `L303:mark` gets `a_mood_held_the_capture`.
- `L300`, `L301` and `L302` are not edited. `L126` is not edited.

## The new hard check

In `COMMON`, because it is a statement about the box and holds on every row: for every Capture whose
filing answer carried a usable cut, the reply carries `Nothing to file.` exactly when every piece
was `skip`. A Capture with no usable cut is skipped by it. Import the string from
`memark/acknowledge.py`, from ticket 16.

It reads what code did with whatever the model said, so it holds in `auto` as well. Read `L221` and
`L222` before you trust it: both send messages with nothing in them to file.

## Done when

- [ ] `L303` is in `scenarios_p10_96.py` and its two probes are in `PROBES`.
- [ ] The `COMMON` check is in `harness/live/checks.py`.
- [ ] No earlier row is edited, except `L211` by ticket 18.
- [ ] `MEMARK_PASS_MODE=auto python -m harness.live` is green, with no `--only`.
- [ ] It commits.
