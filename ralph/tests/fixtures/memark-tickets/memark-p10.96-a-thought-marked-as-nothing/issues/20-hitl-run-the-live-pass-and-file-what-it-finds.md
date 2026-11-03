# 20. HITL: run the live pass and file what it finds

**Type:** task

**Status:** ready-for-human

**Blocked by:** 19, 22

**What to do:** run the live-model pass on this phase, get reproduction rates, and file what
survives as a new phase folder between this phase and phase 11, per the live-pass skill.

This is `ready-for-human` on purpose. `run-ralph-tickets.sh` picks `in-progress` first and then
`ready-for-agent`, so it skips this one rather than failing it. The pass needs a person for the
messages, and the runner fails any ticket where no commit lands.

The method is `.claude/skills/live-pass/SKILL.md`, invocable as `/live-pass`.

## The tiers

Per ADR 0003, two tiers of model, the pass runs on `claude-haiku-4-5` for filing and
`claude-sonnet-5` for judgement. A `claude-opus-5` run is a diagnostic and never a fix.

## The bars

Ten runs a side on the same clock for any rate a decision rests on. Ticket 11's 0 of 5 was 5 of 10
on a re-run.

| row | bar |
| --- | --- |
| `L300`, `L301`, `L302:me` | 0 of 15 dropped |
| `L302`, `L300:mark`, `L301:mark` | 0 of 5 each |
| `L211:where` | 0 of 10 lost as `skip:`, at most 1 of 10 bad |
| `L303`, `L303:mark` | 0 of 5 each |
| `L153:mark` | at most 1 of 10 |
| `L153`, `L154` | 0 of 5 each |
| `L126:mark` | read and recorded, not barred |

## Say which mode it ran in

Every earlier rate on this map was `claude-cli` mode, which adds about twenty thousand tokens of
Claude Code's own prompt and tools to each call. If `MEMARK_ANTHROPIC_API_KEY` is set, run
`MEMARK_PASS_MODE=live` as well. Only that settles what the cheap tier reads as standing.

## Done when

- [ ] The whole bundle ran, and the pass counts are written down.
- [ ] Each bar above has a rate.
- [ ] What survives is filed as a new phase folder between this phase and phase 11, per the live-pass skill.
