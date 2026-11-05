# 25. HITL: run the live pass and file what it finds

**Type:** task

**Status:** ready-for-human

**Blocked by:** 24

**What to do:** run the live-model pass on this phase, get reproduction rates, and file what
survives as a new phase folder between this phase and phase 10.98, per the live-pass skill.

The method is `.claude/skills/live-pass/SKILL.md`, invocable as `/live-pass`.

`ready-for-human` is deliberate, per `docs/agents/issue-tracker.md`. The runner skips it. A person
supplies the messages, or waives step 1 of the skill in writing on this ticket.

## The tiers

Per ADR 0003, two tiers of model, the pass runs on `claude-haiku-4-5` for filing and the Intent Read,
and `claude-sonnet-5` for judgement. A stronger model run is a diagnostic and never a fix.

## The bars

Ten runs a side on the same clock for any rate a decision rests on. Rows named here are ticket 24's
twins.

| row | what it guards | bar |
| --- | --- | --- |
| `L307` | a stated warning is lost | at most 1 of 10 |
| `L316`, `L375` | the typed date waits for a yes | at most 1 of 10 each |
| `L319`, `L321`, `L370` | an errand is held `❓` for having no Card | 0 of 5 each |
| `L337` | the errand sent twice is not one confirmed date | 0 of 5 |
| `L327`, `L376` | the day taken back is confirmed | 0 of 5 each |
| `L371` | `Oct 8th order hand blender` waits for a yes | 0 of 5 |
| `L335` | no Friday line under the confirmed 09 Oct | at most 1 of 10 |
| `L356`, `L357` | the first line names the wrong day | at most 1 of 10 each |
| `L308`, `L309`, `L311`, `L313` | the first line names the wrong day | 0 of 5 each |
| `L377` | not 01 to 07 Oct 2026, or no year line | 0 of 5 |
| `L361`, `L362` | an exact relative day is read as `around` | at most 1 of 10 each |
| `L351` | the follow-up lands on the wrong day | at most 1 of 10 |
| `L353` | the correction is not answered | at most 1 of 10 |
| `L308` | the answer names another day as the day asked about | at most 1 of 10 |

Record ADR 0057's clash line count. It is not barred.

## Say which mode it ran in

Every rate on this map so far was `claude-cli` mode. If `MEMARK_ANTHROPIC_API_KEY` is set, run
`MEMARK_PASS_MODE=live` as well.

## Done when

- [ ] The whole bundle ran, and the pass counts are written down.
- [ ] Each bar above has a rate.
- [ ] Every red earlier row is checked against `77d0dae` before it is called a regression.
- [ ] What survives is filed as a new phase folder between this phase and phase 10.98.
