# 24. AFK: this phase's rows and hard checks reach the bundle

**Type:** task

**Status:** completed

**Completed at:** 2026-10-08T05:59:05Z

**Blocked by:** 17, 18, 19, 20, 21, 22, 23

**What to build:** `harness/live/scenarios_p10_975.py`, appended to `ALL`, with one new row for each
earlier row below, its hard checks, and its probes in `harness/live/repeat.py`. Then prove the wiring
with `MEMARK_PASS_MODE=auto python -m harness.live`.

Spec: [../spec.md](../spec.md), "Testing decisions". Method: `.claude/skills/live-pass/SKILL.md`.

## Why new rows

The earlier rows are in phase 10.97's files and are never edited. So each new row, numbered from
`L379`, sends the same words, fixture and clock as the row it mirrors, and says which in its comment.
The earlier rows keep running as regression cover.

No word from these rows goes into any prompt.

## The rows

A hard check is true whatever the model chose. A check that reads what a model wrote is wrapped in
`only_when_a_model_answered`. Where the check depends on the model's day, it applies only when the
model's day matches the words.

| mirrors | hard check |
| --- | --- |
| `L307` | no Task is refused for having no Card; a confirmed 15 Oct line carries a 2-day `notice::` |
| `L316` | no Task is refused for having no Card; 20 Oct is confirmed when the model's day is 20 Oct |
| `L319` | no Task is refused for having no Card; no line is confirmed, because `tmrw` is relative |
| `L321` | no Task is refused for having no Card; 04 Oct is confirmed when the model's day is 04 Oct |
| `L326` | the two Tasks are filed, not held; the birthday waits for its tap |
| `L327` | no line is confirmed on 10 Oct |
| `L329` | each reply line that names a day is the line of the piece that typed it |
| `L335` | 09 Oct is confirmed; when the filing answer sent `weekday` Thursday, the reply holds the Friday line under that errand |
| `L337` | at most one Review Date line for the hand blender |
| `L351` | when the reading sent a word or fields, the first line names the day code counted from them |
| `L353` | the correction gets an answer, not only the echo |
| `L355` | the first line is Monday 28 Sep |
| `L356` | every word the reading sent is in the message; the first line names the day code counted |
| `L357` | the same as `L356` |
| `L358` | the first line is Sunday 27 Sep to Tuesday 29 Sep |
| `L361`, `L362` | when the reading sent `around: false`, the window is the one day or week counted |
| `L368` | the reply holds no `❌ undo`, and the Digest lists no `undo` under **Not filed** |
| `L370` | no Task is refused for having no Card; 02 Oct is confirmed when the model's day is 02 Oct |
| `L371` | 08 Oct is confirmed when the model's day is 08 Oct, whatever the cut |
| `L375` | 03 Nov is confirmed when the model's day is 03 Nov |
| `L376` | no line is confirmed on 05 Oct |
| `L377` | the first line is Thursday 01 Oct 2026 to Wednesday 07 Oct 2026, and the year line is there |

Add one row with no earlier twin: `what did I do on Thursday 9th Oct?` on the Recall clock. Hard
check: the first line is Friday 09 Oct 2026, and when the reading sent `weekday` Thursday, the Friday
line is there.

## The probes

One per bar in the spec's "Testing decisions" that a hard check cannot settle:

- `the_warning_was_lost` on the `L307` twin.
- A typed date waited, on the `L316`, `L371` and `L375` twins.
- The Friday line is missing, on the `L335` twin.
- The first line names the wrong day, on the `L356` and `L357` twins.
- An exact relative day was read as `around`, on the `L361` and `L362` twins.
- A clash probe that counts ADR 0057's new log line across the Recall rows.

## Done when

- [ ] Every new row runs in the free dry run with its hard checks green or vacuous.
- [ ] Every probe is in `PROBES` and has a unit test in `tests/test_live_probes.py`.
- [ ] No earlier row is edited.
- [ ] The unit suite is green.
