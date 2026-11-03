# 10 — AFK: add this phase's live scenarios and checks

**What to build:** the live bundle learns what phase 6 made true, so the next pass can catch it
breaking.

The unit suite writes the model's answer itself, so it proves the code around the model call and never
the call. That is why every phase ends with a live-model pass, and this ticket is the wiring for it.
The method is in `.claude/skills/live-pass/SKILL.md`.

Draft scenarios for what this phase added into `harness/live/scenarios_p06.py` and append the module to
`ALL` in `harness/live/__main__.py`. Add a hard check to `harness/live/checks.py` for anything this
phase made newly true. The obvious ones are the pairing rule, a day with no inbox file costing no
model call and staying open, and the journal never sending anything. Add a probe to
`harness/live/repeat.py` for anything worth a reproduction rate, an entry's handling of a Question
being the candidate.

Never edit an earlier phase's scenarios to make this phase pass. They are the regression coverage.

**Blocked by:** 02 — What the model sees of the day; 03 — The pairing rule: no inbox file, no entry, no
call; 04 — Backfill: past days without an entry, oldest first; 05 — A day with an entry is closed to
new Captures; 06 — `catchup` asks first, then clears the whole backlog; 07 — The Canary counts the days
the journal and the inbox disagree; 08 — The seeding interview's day is stated rather than narrated.

**Status:** completed

**Completed at:** 2026-09-07T23:54:27Z

- [ ] `harness/live/scenarios_p06.py` holds this phase's scenarios and is listed in `ALL`.
- [ ] `harness/live/checks.py` gains a hard check for what this phase made newly true.
- [ ] `harness/live/repeat.py` gains a probe for anything worth a reproduction rate.
- [ ] No earlier phase's scenarios were edited.
- [ ] `MEMARK_PASS_MODE=auto python -m harness.live` is green, costs nothing and makes no model call.
