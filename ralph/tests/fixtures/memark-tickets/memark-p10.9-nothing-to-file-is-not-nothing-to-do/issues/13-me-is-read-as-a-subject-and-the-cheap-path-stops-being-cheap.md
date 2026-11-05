# 13 — `Me` is read as a subject and the cheap path stops being cheap

**Type:** defect

**Status:** completed

**Completed at:** 2026-09-18T00:15:50Z

**What to build:** a question about a day that names nobody stays on the cheap path, instead of
pulling every Card in because the reading answered `Me`.

**Reproduces:** 3 of 5 on `claude-haiku-4-5`, the tier ADR 0003 puts the Intent Read on, and 1 of 1
on `claude-opus-5`. Both tiers, so the prompt is wrong rather than too thin.

## What happens

`L200` sends `?holi pe kya kiya tha`, which is Hinglish for *what did we do on Holi*. It names a
time and nobody, so the routing rule of ADR 0033 as amended sends it to the window and no Card goes
in the prompt at all.

The Intent Read returned `subjects: ["Me"]`. `kiya tha` carries an implied first person the way most
Hinglish sentences do, and the reading answered with the person. That makes the message name a time
**and** somebody, so the merged branch fired and every Card went in:

> the prompt stayed a day's worth of tokens: call 1 carries 2705 tokens and 34 Cards

A day's Captures are about 375 tokens. So the question cost about seven times what it should have,
and nothing in the reply says so. The answer was correct.

## Why this row exists and why it matters

`L200` is not an old row that drifted. **Phase 10.85 wrote it three tickets ago as the regression
guard for its own cost argument**, and its module says exactly what it was afraid of:

> the cost argument of this phase is that the cheap path stays cheap, and a change that quietly
> sent every Card down it would pass every other check in this package.

That is what happened, on the first real run after the phase shipped. It is invisible in every
reply and visible only in the bill, which is why the row counts tokens rather than reading words.

The bill is the number the decision was taken on. Phase 10.85 costed a question on this Vault at
$0.0069 and a month of ten a day at $90.45 against ADR 0043's "about $90 a month". If three
questions in five take the expensive path when they should take the cheap one, that arithmetic is
wrong by the same fraction, and ADR 0043's month is the number somebody agreed to.

## Why the reading answers `Me`

`memark/intent.py` asks for the subjects a message is about, and the `Me` rule there exists for the
opposite problem: a Card code reserves that no alias may reach, so the reading naming the person is
the only way that Card is ever named. That rule is right and it is doing too much here.

Hinglish drops the pronoun. `kiya tha`, `gaye the`, `khaya tha` all carry an implied *we* or *I*
without writing one, so a reading told to name the person when the person is meant will name them
in most sentences this household types. The same question in English, `what did we do at Holi`,
writes the pronoun and so gives the reading the same reason.

Phase 10.85's ticket 01 is the same shape one step over: a common noun is not a subject. This is a
pronoun that is not a subject either, and the prompt's existing `Me` rule is what pulls the other
way.

## What to change

The Intent Read prompt. `Me` is named when the message says something **about** the person, not when
it merely has them as the one doing the asking. A question about what happened on a day is about the
day.

Write the worked example in Hinglish, because that is where the pronoun is absent and the reading
has to decide without one. `?holi pe kya kiya tha` names nobody. `?meri tabiyat kaisi chal rahi hai`
names the person.

Do not fix this by taking `Me` out of the reading. That breaks the reserved Card's only route in,
which ticket 10 of phase 10.7 built on purpose and `apply.py:_the_person` depends on.

## What was built

One rule in the Intent Read prompt, one new row, one hard check and five unit tests. Nothing on
the routing path changed, and `Me` stayed in the reading.

The rule says asking is not being asked about. `Me` is written where the message says something
about the person: their body, their money, their days, what they like, what they have to do. It is
not written because they are the one typing. Then the flat refusal, because the rule stated as a
principle was not enough: never write `Me` for a question asking what happened, what was done,
what was eaten or where anybody went on a day, because that question is about the day. Then the
Hinglish, because that is where the pronoun is missing: `kya banaya tha`, `kahan gaye the` and
`kitna diya tha` all hold an `I` or a `we` nobody wrote, and a word nobody wrote is not a subject.

**The worked examples are not the sentences the rows send.** The prompt works through `diwali pe
kya banaya tha` for the empty list and `mere kharche pichle mahine se badh gaye hain` for `Me`.
`L200` sends `?holi pe kya kiya tha` and `L249` sends `?meri tabiyat kaisi chal rahi hai`, and
neither appears in the prompt. The ticket names both sentences as the examples to write, and
writing them would have made both rates measure the copying rather than the rule, which is this
phase's ticket 03 finding and what `00-index.md` says about `L168` and `L174`. A unit test asserts
neither sentence is in `SYSTEM`, so nobody puts them back.

The schema description for `subjects` carries the same sentence, because the description is what a
reading is held to where the instructions are long.

## Three wordings, and the numbers that chose between them

The rule as a principle alone left the failure in the run. Each wording was measured on
`claude-haiku-4-5`, five runs a time, so the choice is a number rather than a preference.

| The wording | `L200:subject` | `L249:subject` |
| ----------- | -------------- | -------------- |
| before anything | 3 of 5 | not measured |
| the principle, and `a question about a day is about the day` | 0 of 5 | 0 of 5 |
| the same with `something of the person` for `something about` | not measured | **1 of 5** |
| the same with an `unless it writes a name` clause | **1 of 5** | 0 of 5 |
| the principle plus the flat refusal, which shipped | **0 of 5 twice, so 0 of 10** | 0 of 5 |

Two things came out of it. `something of the person` cost a run on the guard row, so the plain
word `about` stayed. And the failure the principle left behind was not noise: it came back at 1
in 5 on two separate wordings and went to 0 in 10 only once the prompt refused the shape outright.

## The row that guards the other side

`harness/live/scenarios_p10_9_india.py`, one row, `L249`. `Me` is the reserved Card's only route
in, per phase 10.7's ticket 10, and `vault/apply.py:_the_person` depends on it, so a prompt edit
that stopped the reading writing `Me` at all would fix `L200`, break the reserved Card and leave
every row in the bundle green. `L249` asks `?meri tabiyat kaisi chal rahi hai`, which is a question
about the person's own health in the same Hinglish that drops the pronoun, and asserts the reading
named `Me`.

The check is `checks.the_reading_named`, which reads the Intent Read's own subject list, so every
later row can use it. `L249:subject` calls the same function, so the row and the rate cannot come
apart.

**It matches one whole subject folded for case and never a substring**, unlike
`repeat.missed_the_name` beside it. `_the_person` routes on an exact folded match, the reserved
word is two letters, and `meri tabiyat` holds them: a substring check would have gone green on the
very sentence the row sends while the Card stayed unreachable. A test covers that case by name.
The check is wrapped in `only_when_a_model_answered`, because `auto` answers every schema with the
smallest instance it allows and that is an empty list. `tests/test_live_checks.py` exercises it
five ways rather than letting it first meet a real answer on a live run.

## The rates after the change

All on `claude-haiku-4-5`, the tier ADR 0003 puts the Intent Read on, through
`python -m harness.live.repeat`.

| Probe | What it asks | Before | After |
| ----- | ------------ | ------ | ----- |
| `L200:subject` | a message naming nobody read a subject | 3 of 5 | **0 of 10** |
| `L249:subject` | a message about the person lost `Me` | not measured | **0 of 5** |
| `L199:subject` | a name beside a day was dropped | not measured | **0 of 5** |

`L199` was measured because the new rule says a question about a day is about the day, and `L199`
sends `?holi pe ramaben ko kitna diya tha`: the same festival, the same verb form, and a name in
it. The rule has to leave that name alone and it does, so the merged branch of the routing rule is
untouched by measurement rather than by argument.

`L200`'s token ceiling holds in a real pass: **76 tokens, under the 1,000 the ceiling allows**,
where the defect put 2,705 tokens and 34 Cards through it.

## The bill, re-checked rather than assumed

`python -m harness.live.bill` over a pass of eight question rows: `L168` to `L172`, `L199`, `L200`
and `L249`.

**$0.0078 a question on this Vault**, beside phase 10.85's $0.0069. The two are over different row
sets, and the number that decides anything is the projection, which is unchanged: carried up to
the 150,000 tokens ADR 0043 costed, one question is **$0.301 against the $0.30 assumed, and a
month of ten a day is $90.27 against "about $90 a month"**. Tokens are estimated at four
characters each.

`L200` itself billed $0.0032 on a 1,158 token prompt, against $0.0091 and 3,765 tokens for a
question that really does reach the Cards. That gap is the cheap path, and closing it is what the
defect had done.

**One acceptance line is left for a person.** It asks for the per question cost to be written into
`00-index.md`, and the ticket runner is told not to edit that file. The numbers are above, ready to
be copied in.

## Done when

- [x] `?holi pe kya kiya tha` reads no subject on five runs of five.
- [x] A question that really is about the person still names `Me`, with a row covering it.
- [x] `L200` passes its token ceiling, which is the check that catches this coming back.
- [x] The rate is measured again on `claude-haiku-4-5` after the change.
- [x] `harness/live/bill.py` is run over a pass after the fix and the per question cost is written
      in the index beside phase 10.85's $0.0069, so the arithmetic ADR 0043 rests on is re-checked
      rather than assumed. *(Run and written up above. The `00-index.md` line is a person's, per
      the runner's own rule against editing that file.)*
