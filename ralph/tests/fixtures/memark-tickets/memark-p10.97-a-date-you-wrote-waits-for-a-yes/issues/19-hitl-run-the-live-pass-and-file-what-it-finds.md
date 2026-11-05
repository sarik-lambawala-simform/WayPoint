# 19. Run the live pass and file what it finds

**Type:** task

**Status:** in-progress

**Blocked by:** 18

**What to do:** run the live-model pass on this phase, get reproduction rates, and file what
survives as a new phase folder between this phase and phase 11, per the live-pass skill.

This is `ready-for-agent`, so `run-ralph-tickets.sh` picks it up once ticket 18 is done. The agent
writes its own messages (see below), so the pass no longer needs a person. The runner fails any
ticket where no commit lands, so commit the new scenarios, the pass counts and the new phase folder.

The method is `.claude/skills/live-pass/SKILL.md`, invocable as `/live-pass`.

## The agent writes the scenarios

For this pass, the user waives step 1 of the live-pass skill. Do not wait for the user to supply
messages. Write them yourself, then run them yourself.

The skill also tells the ticket runner to stop and hand back the HITL ticket. That rule does not
apply here. Run this ticket to the end.

Write each message the way an Indian person would send it in daily life. Keep expanding the set
until you believe the important real-world cases are covered. A small sample set is not enough.
Confirming the happy path and stopping is not enough.

Cover at least these:

- Common daily errands, reminders and facts.
- The same action phrased in several ways.
- Indian names, addresses, places and languages, such as Hindi, Hinglish, Gujarati and Tamil
  written in Latin script, and mixed English.
- Different writing styles: terse, rambling, formal, WhatsApp-style, with typos and no punctuation.
- Different kinds of input, and more than one kind in one message.
- Edge cases, strange situations and ambiguous input.
- Partial, incomplete, wrong or unexpected input.
- Several messages in a row that build one thought, or change an earlier one.
- Mixes of the above that could expose a bug.

Turn each scenario into concrete messages and run them through the box. Try combinations. Do not
stop at the obvious case.

You choose which scenarios to run and how to run them. The user does not want to pick them.

File every issue, inconsistency, surprise or chance to improve that you find, per the bars and the
"Done when" list below. Then report what you found.

## The tiers

Per ADR 0003, two tiers of model, the pass runs on `claude-haiku-4-5` for filing and the Intent Read,
and `claude-sonnet-5` for judgement. A stronger model run is a diagnostic and never a fix.

## The bars

Ten runs a side on the same clock for any rate a decision rests on.

| row | what it guards | bar |
| --- | --- | --- |
| `L305` | the hand blender line waits for a yes | at most 1 of 10 |
| `L306` | one dated errand in a list confirms another | 0 of 5 |
| `L307` | a stated warning is lost | at most 1 of 10 |
| `L308`, `L309`, `L311`, `L313` | the first line names the wrong day | 0 of 5 each |
| `L309:mood` | the follow-up answer is not about mood | at most 1 of 10 |
| `L310` | a Hinglish relative day lands on the wrong day | read and recorded, not barred |
| `L312` | the merge answer misses one list | read and recorded, not barred |

Also record the clash count from ticket 14. It is how often the model's fields differ from code's.

## Say which mode it ran in

Every earlier rate on this map was `claude-cli` mode, which adds Claude Code's own system prompt and
tools to each call. If `MEMARK_ANTHROPIC_API_KEY` is set, run `MEMARK_PASS_MODE=live` as well.

## Done when

- [ ] The agent wrote its own scenario set, and it covers every item in "The agent writes the scenarios".
- [ ] The whole bundle ran, and the pass counts are written down.
- [ ] Each bar above has a rate.
- [ ] What survives is filed as a new phase folder between this phase and phase 11, per the live-pass skill.

## Resume from here

The first run of this ticket stopped at 10:31 on 2026-10-01. It hit the Claude session limit. Its
work is in commit `96f5da8` (`wip(19)`). Do not start the pass again from zero. Reuse what it found.

**What is done**

- 54 new scenarios, rows `L315` to `L368`, are in `harness/live/scenarios_p10_97_india.py`. They
  are committed. Read them before you write more.
- The whole old bundle ran once: 300 pass, 9 fail.
- The repeat runs for the bars ran, 70 in all.
- The new rows ran once each, and the odd ones ran 5 more times on `claude-haiku-4-5`.
- The red old rows `L81`, `L174`, `L175`, `L223` and `L304` ran 3 times each on the code from before
  this phase (`94de474`, the end of phase 10.96). All 15 runs fail there too. So these fails are
  older than this phase. Check the other red old rows the same way before you call any of them a
  regression.

**Where the results are**

All raw results are in `logs/ralph-tickets-20261001-075733/ticket-19-results/`. That folder is a
copy of `/tmp/p1097/`, so the paths inside its scripts still say `/tmp/p1097`.

- `bundle/`: the old bundle run.
- `new/`: the new rows, one run each.
- `rep/`, `rep2/`: the repeat runs for the bars.
- `rep3/`: the 5-run repeats of the new rows. Files named `-sN` ran with
  `MEMARK_FILING_MODEL=claude-sonnet-5`.
- `old/`: the old-code runs.
- `agg.py`, `agg3.py`: the tally scripts. `one.py` runs one row.

The full session of the first run is
`~/.claude/projects/-Users-abhishekhingorani-Abhishek-Memark/74d8dbf8-f404-4c27-b108-56fdc0575d04.jsonl`.

**Bar rates so far**

- `L305`: 1 of 10. Meets its bar.
- `L307`: 6 of 10. Fails its bar of at most 1 of 10.
- `L309`: the hard check "a recalled prompt holds no Card" fails in 5 of 10 runs. Find out if the
  box or the check is wrong.
- The other bars passed. Read the counts again from `rep/` and `rep2/` before you write them down.

**Findings so far, not yet filed**

- `A_FIXED_WORD.search` takes the first fixed word it finds. So `day-before-yesterday` matches
  `yesterday`, and code's day overrides the model's day. Confirmed in code.
- `L308`: 5 of 5 answers say yesterday was 30 Sep and that no note exists. The day line above them
  is right. So the person sees a right day and a wrong answer.
- `L307`, `L316`, `L319`, `L321`: a `remind me to ...` Task gets filed on `Me`, and the box holds
  it (❓). That is 12 of 25 runs on the cheap tier. The filing prompt already says `remind me to`
  takes no subject and no edit on `Me`. This is a judgement finding.
- `L329`: the date goes beside the wrong errand line. 3 of 3 runs in the first tally.
- `L351`, `L353`, `L361`, `L362`: the day line names the wrong day in 3, 5, 3 and 2 of 5 runs on
  the cheap tier. `L353` also leaves the correction unanswered in 5 of 5. On `claude-sonnet-5`,
  `L361` and `L362` are right in 2 of 2.
- `L343`: the day is wrong in 1 of 5.
- `L354`: the question was read, but no answer reached the chat.
- `L368`: after `undo`, the `undo` Capture gets no mark, and nothing in filing skips it. The hand
  blender Capture stays marked filed with 0 lines. This dates from phase 10, not this phase.
- A harness bug: a shared check assumes every question in a row is a day question. Rows that mix
  question types trip it. Do not change the shared check. File it.

**What is left**

1. Check the `claude-sonnet-5` runs in `rep3/`. For `L316`, `L319`, `L321` and `L329`, the tally
   shows "no date line" and the logs are nearly empty. Find out if those runs really ran.
2. Check the rest of the 9 red old rows against `94de474`.
3. Write down the clash count from ticket 14.
4. Check if `MEMARK_ANTHROPIC_API_KEY` is set. If it is, run `MEMARK_PASS_MODE=live` too.
5. Add more scenarios if a case in "The agent writes the scenarios" is still not covered.
6. File what survives as the new phase folder, and commit it.

## Comments

**2026-10-01, the resumed run.** Done. What it found is filed as
[phase 10.975](../../memark-p10.975-the-answer-is-never-told-today/spec.md). The pass counts, every
bar's rate and the clash count are in its `spec.md`. In short:

- Mode: `claude-cli` only. `MEMARK_ANTHROPIC_API_KEY` was not set, so no `live` run was made.
- Bundle: 300 pass, 9 fail. All 8 red old rows fail on `94de474` too. `L309`'s red runs are a
  harness check that judges the whole row, ticket 06 there.
- Bars: `L307` fails, 6 of 10 and then 4 of 5. Every other bar meets.
- The `claude-sonnet-5` filing runs in `rep3/` from the first run had hit the session limit: the
  CLI exited 1 on most calls. They were moved to `rep3/stale/` and run again, 3 each.
- 9 rows were added, `L370` to `L378`, for a question and an errand with filing run, a month-first
  date, Devanagari, a Tamil warning, a corrected day with a warning, and a range ahead of today.
  The scenario set is now 65 rows, `L314` to `L378`.
- The biggest finding: the answer prompt never names today. In `claude-cli` mode the model took
  Claude Code's own date, one day after the box's clock, so the answer under a right day line
  talked about another day.
