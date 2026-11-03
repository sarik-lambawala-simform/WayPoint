# 16 — AFK: this phase's scenarios and hard checks reach the bundle

**Type:** task

**Status:** completed

**Completed at:** 2026-09-17T12:26:30Z

**Blocked by:** 10, 12, 14

**What to build:** the live bundle carries this phase's rows and hard checks, and the dry run proves
the wiring before a real call is made.

## The two rows the bundle does not have

**A subject plus an occasion that is on record**, in the shape `holi pe ramaben ko kitna diya tha`.
This is the hole the session found and no row exercises it: `L194` asks about Holi and names nobody.
The check is that the prompt holds every Card **and** the 4 March material, and that the answer comes
out of the Ramaben Card.

**A question naming a time and nobody**, which must still send no Cards. This is the regression guard
in the other direction, and it is what keeps the cheap path cheap.

Both are new rows. Per `.claude/skills/live-pass/SKILL.md` the earlier phases' scenarios are the
regression coverage and are never edited to make a later phase pass.

## The hard checks

- The miss line fires on a subject nothing covered and no word of which is in the Vault, and on
  nothing else.
- A count with no line to name carries the count sentence, and `L174` still carries its nine
  citations.
- An occasion with no confirmed day beside a subject makes an answering call.

## The bill is a hard check and not a comment

`harness/live/bill.py` already prices a question off the pass's own call log. The whole cost argument
of ticket 03 is that the cheap path stays cheap: about 375 tokens for a day, 2,600 for a week and
11,000 for a month, against the roughly 150,000 tokens a Card read costs. A pass that ships this
without the bill proving the "time and nobody" path unchanged has shipped the argument untested.

## The one edit to an existing row

`L173`'s hard check is edited by issue 14, because the rule it asserts changed. Nothing else in any
earlier bundle is touched.

## Done when

- [x] The two new rows are in `harness/live/scenarios_p10_8_india.py` or a new module appended to
      `ALL` in `harness/live/__main__.py`. They are a new module, `scenarios_p10_85_india.py`,
      because an earlier phase's bundle is regression coverage and is not edited.
- [x] The hard checks above are in `harness/live/checks.py`, and all three are in `COMMON` rather
      than on these two rows. Each is a statement about the box and not about one question, and
      each was found on a row of an earlier phase: the miss line on `L168`, the count on `L173` and
      `L174`, the occasion on `L189`. Written on the new rows alone they would leave the rows they
      came from asserting nothing. `COMMON` reaches those rows without editing one of them. The
      count check asserts both halves: a count with no line to name carries the count sentence,
      and a count whose named lines the Vault holds has to name every one of them, so `L174`'s
      nine citations are regression coverage rather than a number in a write-up.
- [x] Probes for this phase's rows are in `harness/live/repeat.py`: `L199:route`, `L200:route` and
      a `:subject` key for each, which is issue 15's dimension on the same two questions.
- [x] `harness/live/bill.py` asserts the "time and nobody" path is unchanged, as a hard check.
      `the_prompt_stayed_on_the_cheap_path` reads the prompt off `L200`'s own call and fails on a
      Card reaching it or on more than `A_DAY_ON_THE_CHEAP_PATH` tokens. Both ends are measured
      on this Vault: a recalled day prompt is 146 tokens on `L190` and 159 on `L191`, a Lookup
      prompt is 2,680, and the ceiling of 1,000 sits between them.
- [x] `MEMARK_PASS_MODE=auto python -m harness.live` is green, with no `--only`. 198 pass, 0 fail.
- [x] Every check that reads what a model wrote is wrapped in `only_when_a_model_answered`, per
      [ticket 07](07-the-free-dry-run-is-red-by-construction.md). The bill check is wrapped too:
      `auto` names no occasion, so the dry run sends this row to the Lookup with every Card in it.
- [x] No earlier phase's scenarios were edited, apart from `L173`'s check in issue 14.
- [x] It commits.
