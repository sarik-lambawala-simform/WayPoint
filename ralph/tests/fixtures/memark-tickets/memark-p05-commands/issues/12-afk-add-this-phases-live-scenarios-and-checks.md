# 12 — AFK: add this phase's live scenarios and checks

**What to build:** the live bundle learns what phase 5 made true, so the next pass can catch it
breaking.

The unit suite writes the model's answer itself, so it proves the code around the call and never the
call. That is why every phase ends with a live-model pass, and this ticket is the wiring for it. The
method is in `.claude/skills/live-pass/SKILL.md`.

Draft scenarios for what this phase added into `harness/live/scenarios_p05.py` and append the module to
`ALL` in `harness/live/__main__.py`. Add a hard check to `harness/live/checks.py` for anything this
phase made newly true, the Command path being the obvious one: a typed Command costs no model call, and
a message that fails the resolution rule is saved rather than refused. Add a probe to
`harness/live/repeat.py` for anything worth measuring.

Never edit an earlier phase's scenarios to make this phase pass. They are the regression coverage.

**Blocked by:** 03 — Several Commands travel one per line, all or nothing; 04 — A Command replying to an
older Digest resolves against that Digest; 05 — The silent failures this design creates are counted;
06 — `skip N` stamps the occurrence it dealt with; 08 — `no N` against an inbox block writes
`filed:: declined`; 09 — A Proposed Heading is offered, asked about, and approved from the chat;
10 — A returning errand carries `again-of::`.

**Status:** completed

**Completed at:** 2026-09-04T14:40:03Z

- [ ] `harness/live/scenarios_p05.py` holds this phase's scenarios and is listed in `ALL`.
- [ ] `harness/live/checks.py` gains a hard check for what this phase made newly true.
- [ ] `harness/live/repeat.py` gains a probe for anything worth a reproduction rate.
- [ ] No earlier phase's scenarios were edited.
- [ ] `MEMARK_PASS_MODE=auto python -m harness.live` is green, costs nothing and makes no model call.
