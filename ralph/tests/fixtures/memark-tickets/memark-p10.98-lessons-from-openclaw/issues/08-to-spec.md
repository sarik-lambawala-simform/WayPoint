# Consolidate every answer into one spec

Type: task
Status: open
Blocked by: 01, 02, 03, 04, 05, 06, 07

## Question

Write `../spec.md` from every answer in this folder, with the `to-spec` skill at
`~/.claude/plugins/cache/claude-plugins-official/mattpocock-skills/1.2.3/skills/engineering/to-spec`.

The spec says what to build and in what order. It names every ADR it changes and what that ADR
decided. It says which parts wait on the p10.97 build of the Recent Exchange.

Break the spec into build issues per `docs/agents/issue-tracker.md`. The last two are the fixed
pair: add this phase's scenarios to `harness/live/` (AFK), then run the live pass (HITL).
