# 19 — The model switches the miss line off by claiming coverage

**Type:** defect

**Status:** completed

**Completed at:** 2026-09-18T15:30:35Z

**What to build:** the subject list stops moving, and the harness can see when the miss line is
absent. No fallback subject. See `## The rule, decided`.

**Reproduces:** 1 of 16 on `claude-sonnet-5`, over three batches of 5, 5 and 5 plus one smoke run.
No comparison run on `claude-opus-5` was made: `claude-sonnet-5` is the tier ADR 0003 puts judgement
on, and a diagnostic against a stronger model closes nothing.

**The title of this ticket is wrong and is kept for the link.** The model did not claim coverage.
On the run that failed, `covered` was empty. See `## What the rate found`.

## What happens

`L242` sends `?badminton coaching ki fees kitni thi club me`. The Vault holds no badminton and no
club, so the reply must open with a miss line. In four of five runs it did. In the fifth it did not,
and the reply carried no miss line at all.

The fifth run scored good in the pass, which is the part worth reading twice. It scored good because
the honest half was missing rather than because the reply was better.

## Why

**This section was written before the rate and it is wrong.** It is kept because the reasoning in it
is what the measurement tested, and because the corrected account is below it.

Per ADR 0043, the model reads the whole Vault, as amended, code prints the miss line only when both
of these hold:

1. The answering call did not report covering that subject.
2. No word of that subject is written anywhere in the Vault.

`memark/answering.py:99` is the code and `lookup._nothing_on` is the second condition. The second
condition is certain here: `badminton` is absent from the Vault. The ticket then concluded the first
condition failed, and that the model put `badminton coaching` into its `covered` list.

**It did not.** On the one failing run `covered` came back empty. ADR 0043 as amended is explicit
that an empty or malformed `covered` means the model covered nothing, so every absent subject gets
its line back. Both of the two conditions held and the line still did not print. So the gate that
failed is neither of them.

## What the rate found, and the cause it points at

Sixteen runs of `?badminton coaching ki fees kitni thi club me` against a Vault that writes neither
`badminton` nor `club`. Fifteen printed a miss line. One printed none.

**The miss line names exactly the subjects the Intent Read returned, and that set moved on nearly
every run.** This is the whole finding, and it is visible in the runs that passed:

| What the reply said | What it means the reading named |
| ------------------- | ------------------------------- |
| `I have nothing on badminton coaching or club.` | both |
| `I have nothing on badminton coaching.` | `club` dropped |
| `I have nothing on club.` | `badminton` dropped |
| no line at all | nothing, on the reading below |

`memark/lookup.py:416` is where the line is built, and the subjects go in at the top:

```text
nothing_on=_nothing_on(
    _named_nowhere(subjects, rows), vault=vault, rows=rows, asked_as=asked_as
),
```

`memark/lookup.py:680`, `_nothing_on`, opens:

```text
if not names:
    return ()
```

So a reading that names no subject leaves nothing for the miss line to be about, and no line is
printed, whatever `covered` holds and whatever the Vault does not hold. The two conditions ADR 0043
names are both downstream of a third the ADR does not discuss: **there has to be a subject in the
first place.**

### What is proven and what is not

Proven. One run in sixteen printed no miss line. On it, `covered` was empty. The miss line tracks the
reading's subject list, and that list varied across `badminton coaching`, `club`, both, in fifteen
runs of one unchanged question. `_nothing_on` returns nothing for an empty name list, by reading the
code.

**Not proven.** The failing run's own subject list was not captured. The probe's detail line at the
time reported `covered` and not the reading, so the conclusion that the list was empty on that run is
an inference from the code and from the variation beside it, and not a measurement.

There is a second reading of that same `covered []` and it is worth naming rather than dismissing:
an answering call that came back malformed would also show an empty list. ADR 0043 says a malformed
`covered` means the model covered nothing, so the line should still have printed, which leaves the
subject list as the remaining explanation either way. It is still a different bug if true.

`harness/live/repeat.py`'s probe now reports the answering calls, the `covered` list and the
reading's subjects on every failing run, so the next one that fails settles this. That is the one
piece of work this ticket has already had done for it.

## Why it is bigger than the row it was found on

`covered` gates the miss line for **every** question. A model that can name an uncovered subject
there can switch the miss line off anywhere, not only where it volunteered something afterwards. The
miss line is the box admitting a gap, so a gap that can be hidden by the same call that made it is a
hole in the one honest half of the reply.

ADR 0043 as amended chose this direction on purpose. A missing or malformed `covered` means the
model covered nothing, so every absent subject gets its line back, because a warning too many is a
nuisance a person can see and a warning too few is a stranger's name going by in silence. That
argument assumed the failure was a model saying too little. This is a model saying too much, which
the same design has no guard against.

## What to do first

Done. The rate is 1 of 16 and it is above.

## The rule, decided

**Code gets no subject of its own. The subject list is made reliable instead, and the harness is
given eyes on the failure.**

The tempting fix is a fallback: when the reading names nothing, code reads the question's own words
and checks those against the Vault. It is rejected, for the reason `lookup.py` already carries the
scar of. The `_capitalised` rule was an earlier attempt to get subjects out of raw words, and it
produced miss lines claiming `ABT` and `EMI` were names the Vault held nothing on. `ABT` is how
somebody types `about`. A fallback would be the same bet made again, and it would fire on exactly
the runs where the reading already struggled, which is where raw words are least trustworthy.

The rate also argues against building a second mechanism. Fifteen runs in sixteen printed the line.
The guard works. What is unreliable is the input it is handed, so that is what gets fixed.

**Per ADR 0032, intent is read by a model and applied by code.** That division stands. This ticket
makes the reading's half more dependable rather than moving work across the line.

**Per ADR 0043, which made the miss line code's own sentence**, the line stays code's. Nothing here
asks the model to notice its own silence.

## What to change

### The prompt, so the list stops moving

The Intent Read returned `badminton coaching` and `club`, then `badminton coaching` alone, then
`club` alone, then apparently neither, on one unchanged question across sixteen runs. The prompt asks
which things the message is about. It has to ask in a way that gets the same answer twice.

The measured bar is below, not a wording: the rate on `L242:miss` goes to 0.

### The harness, so this is never invisible again

`L242` carries no hard check that its miss line is present. It was found by a probe written after the
fact, and the run that produced it scored good on the probe that was there, because
`volunteered_lines_beside_a_miss` reads a reply with no miss line as good. A row whose whole point is
the honest empty answer should assert that the honest half is there.

### What is not built

No fallback subject. No change to `lookup._nothing_on`. No change to how `covered` is read: it was
empty on the failing run, so it is not the gate that let this through, and the two shapes this ticket
first proposed are struck through above.

## Done when

- [x] The rate is measured and written into this ticket. It is 1 of 16, over three batches.
- [x] `L242` carries a hard check that its miss line is present. It goes in `checks.py` beside the
      row rather than in the scenario file, so it is not a one row assertion.
- [x] The Intent Read returns the same subject list for `L242`'s question across ten runs.
- [x] `L242:miss` reaches 0 of 10 on `claude-sonnet-5`.
- [x] A reply that genuinely covers a named subject still prints no miss line for it, so the fix is
      not made by printing the line always.
- [x] No fallback subject is added, and `lookup._nothing_on` is unchanged.
- [x] If a run does fail, the probe's detail names the reading's subject list, which it now does, so
      the inference in this ticket is replaced by a measurement.

## Where it came from

Ticket 07's grilling. It is the second finding in that ticket's fifth run and it was split out
because it is a different rule: ticket 07 is about what a reply may add after a miss line, and this
is about whether the miss line is printed at all.

## Why this is `ready-for-agent`

It was `ready-for-human` for two reasons and both are answered. The rate is 1 of 16, so there is
something here. The direction is decided: no fallback, make the input reliable, and give the harness
eyes.

The cause is still an inference rather than a measurement, and that is written into the criteria
rather than left as a caveat. The hard check and the sharpened probe both land before the prompt is
judged, so the next failure explains itself.

## How the rate was measured

Three batches on a clean tree, with the judgement tier forced onto `claude-sonnet-5` per ADR 0003,
which chose hosted models over local inference and puts judgement on the strong tier.

```
python -m harness.live.repeat L242:miss --runs 5
```

Run once as a smoke test of the new probe, then 5, then 5, then 5. One `bad` in sixteen, in the
second batch.

### The probe, and why it is a second one on the same row

`L242:volunteered` already sits on this row and reads ticket 07's dimension. Its lines 1318 and 1319
score a reply with no miss line as `good`:

```python
if stated is None:
    return "good", "the reply states no miss at all"
```

That is correct for what it reads, which is the pair of a miss line and a sources line, and it is
why the fifth run of ticket 07's pass scored good on the run that produced this ticket. It was not
changed, because phase 10.9's rate for ticket 07 was read through it and a probe reads one dimension
and never a wording.

`L242:miss` is the second dimension on the same row. It scores `bad` when no miss line is stated and
no Card carries the subject. The Cards alone, and not the inbox: the question's own Capture is on
disk before the answer is looked for, per ADR 0018, and it carries every word the question wrote.
Both probes carry `JUDGEMENT_TIER`.

## What was built, and what the inference turned into

**The cause is no longer an inference.** The first run taken against the unfixed tree failed, and
the sharpened probe printed the reading beside it:

```text
L242:miss on claude-sonnet-5 run 1: ('bad', 'no miss line on badminton, club.
1 answering call(s) covered [], and 1 reading(s) named [[]]')
```

`covered` empty and the reading's subject list empty, on the same run. That is what the section
above could only argue from the code, and the second reading it named, a malformed answering call,
is ruled out: a malformed `covered` still leaves ADR 0043's two conditions holding, and the line
did not print because there was no subject for it to be about.

**The probe now prints the reading on every run and not only on a failing one.** That is what makes
the third criterion measurable at all: whether the list stops moving is read off the ten good runs
rather than off a rate.

**The hard check is `checks.py`'s `a_miss_is_stated_on`.** It reads the Cards first and asks for the
line only for the words none of them writes, which is `lookup._nothing_on`'s own condition, so a
fixture that later gains a badminton line stands the check down for that word rather than going red
on a box that is right. Standing down is per word: a Vault that grew a badminton line still says
nothing about a club, and that half is still owed. `L242` carries it as `the reply says it has
nothing on either`. One live pass of the row reports it green and not vacuous.

**It catches the wobble and not only the silence.** The first version asked whether some miss line
existed, which `I have nothing on club.` with `badminton coaching` dropped would have passed, and
that dropped-name shape is four of the sixteen runs in the table above. Each owed word has to be
named in the line. Six tests in `tests/test_live_checks.py` exercise it before any live run: red
with no line, red with one of two names dropped, green with both, stood down where the Cards write
both, still red for the one they do not write, and vacuous in `auto` per ticket 14.

**The Cards read is shared rather than copied.** `cards_that_write` is one function in `checks.py`
and both the hard check and `switched_off_the_miss_line` stand down on it. Two copies of it would
let a probe and a check disagree about the same Vault the first time somebody changed what counts
as a word.

**The prompt change is one cut, written down rather than left to be felt.** Phase 10.85's ticket 1
ruled the topic noun out of the subject list, and a club and a coaching read as topic nouns against
that rule, which is why the list wobbled. The cut now says what the question wants to know is not a
subject and the place it is asked of is. It names `my sugar`, `errands`, `ghar ke kaam`, `gaadi`,
`tiffin` and `Rajasthani food` as staying on the far side of it, which is phase 10.85's own list
unchanged.

**Neither worked example is `L242`'s sentence with the nouns swapped.** The first draft used
`swimming classes ki timing kya hai academy me`, which is the row's own `<class> ki <question>
<place> me` frame, and a rate taken against that measures recall of the frame as much as the rule.
They are now `is the gym near the station open on sundays`, which is English and names one subject,
and `academy me swimming classes kab shuru hui thi`, which names two with the place written first,
so the order the second asks for is the opposite of `L242`'s. The 0 of 10 below was taken after
that swap.

### What was measured after

Two batches of five on `claude-sonnet-5` for the row, and the guard rows on `claude-haiku-4-5`,
which is the tier ADR 0003 puts the Intent Read on.

| What | Rate | What the detail said |
| ---- | ---- | -------------------- |
| `L242:miss` | 0 of 10 | `['badminton coaching', 'club']` on all ten, in that order |
| `L168:miss` | 0 of 5 | the reply states no miss at all |
| `L169:miss` | 0 of 5 | the reply states no miss at all |
| `L174:miss` | 0 of 5 | the reply states no miss at all |
| `L175:miss` | 0 of 5 | the reply states no miss at all |
| `L182` | 0 of 5 | `I have nothing on Falguni.` |
| `L169:subject` | 1 of 5 | `Me`, and the same 1 of 5 before this change |
| `L200:subject` | 0 of 5 | the reading named nobody |
| `L249:subject` | 0 of 5 | the reading named `['Me']` |

**The four `:miss` rows are phase 10.85's ticket 1 in full**, which is the decision this prompt
change had to keep: `my sugar`, `Rajasthani food`, `errands` and `ghar ke kaam` are topic nouns and
none of them may reach a miss line. All four stay silent. `L179`, the fifth row of that ticket, has
no probe in `PROBES` and none was added, so `gaadi` is held only by the sentence naming it and not
by a rate.

`L168` is also the fifth criterion measured rather than argued. It asks `?what did the doctor say
about my sugar`, the reading names the doctor, the Vault covers him, and no miss line is printed on
any of five runs. The fix is not the line being printed always.

`L200:subject` and `L249:subject` are phase 10.9's ticket 13, and they are here because the prompt
this ticket edits is the one that ticket also edited. Both hold.

**`L169:subject` is 1 of 5 and it is not this change.** The one failing run named `Me` on `?where do
we go when we want Rajasthani food`, which is ticket 13's dimension and not the cut this ticket
made. It was measured again on the tree as it stood before any of this, by stashing the change, and
it is 1 of 5 there too, with the same `Me`. `we want` says something about the people asking, so the
reading has a case, and whether it should still be refused is ticket 13's to answer and not this
one's. It is written here because a guard run for this ticket found it, not because this ticket
owns it.

### What was not built

No fallback subject. `memark/lookup.py` is untouched, `_nothing_on` included. `covered` is read
exactly as it was. `volunteered_lines_beside_a_miss` is unchanged, because phase 10.9's rate for
ticket 07 was read through it and a probe reads one dimension.
