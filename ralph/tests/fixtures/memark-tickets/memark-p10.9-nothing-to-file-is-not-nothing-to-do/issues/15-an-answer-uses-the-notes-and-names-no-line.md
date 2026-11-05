# 15 — An answer uses the notes and names no line

**Type:** defect

**Status:** completed

**What to build:** an answer built out of the Vault's own lines names them, so `From: no line of
your notes I can name.` stops appearing under a paragraph that quotes one.

**Reproduces:** `L61` 3 of 5, `L63` 1 of 5 and `L81` 2 of 5 on `claude-sonnet-5`. `L71` was not
measured, because no probe was ever written for it. No comparison run on `claude-opus-5` was made:
the cheap tier does not answer here, `claude-sonnet-5` is the tier ADR 0003 puts judgement on, and a
diagnostic against a stronger model closes nothing.

**The rule this ticket turns on is decided.** Only material whose *content* the answer states has to
be cited. A survey of what the Vault covers does not. Under that rule the defect rate is `L61` 3 of
5, `L63` 0 of 5 and `L81` 0 of 5. Read `## The rule, decided` and then `## How the rate was
measured`.

## What happens

Four rows ended with the empty footnote under an answer made of real material.

| Row | Sent | What the footnote said |
| --- | ---- | ---------------------- |
| `L61` | `?what did Wife say about the plumber quote` | `From: no line of your notes I can name.` |
| `L63` | a question sharing no word with the Vault | the same |
| `L71` | a named past occasion the Vault confirmed a day for | the same |
| `L81` | a question sharing no word with the Vault | the same |

`L61` is the clearest. The answer that went out:

> Your notes don't have Wife saying anything about the plumber quote. The quote itself is noted
> under Kitchen as coming from the plumber and being higher than expected, and there's a task about
> chasing the plumber, but nothing ties Wife to that quote.
>
> From: no line of your notes I can name.

The paragraph names the Kitchen quote and the chasing Task. The footnote says there is no line the
box can name. The answering call returned `lines: []`, so code wrote the honest sentence for an
empty list, and the sentence is false about the paragraph above it.

`L200` did the same thing on a Recall answer: it described the Holi Captures and named none of them.

## Why

`memark/answering.py:597` chooses the footnote off the list the call returned:

```python
if read:
    return SOURCES.format(read=", ".join(read))
return COUNTED_THE_VAULT if counted else NO_SOURCES
```

That is right. `NO_SOURCES` exists because ADR 0043 refused to drop the line: an answer with no
footnote reads as one nobody checked. The defect is upstream, in the model returning an empty
`lines` while writing an answer out of lines it was shown.

The answering schema gained two fields in phase 10.85, `counted` and `covered`, from tickets 12 and
14. Whether that is what moved the model's attention off `lines` is a guess and this ticket does not
make it. It is written down because it is the obvious thing to check first, and because the four
rows are ones the earlier bundle is presumed to have passed.

This is the mirror of ticket 07. There the footnote vouches for material nobody asked about. Here
the paragraph uses material the footnote disowns. Both are the same promise breaking: the footnote
is what makes a confident answer checkable, and a footnote that disagrees with the answer is worse
than none.

## The rule, decided

**An answer cites a line when it states what that line says. It does not cite a line for saying the
Vault covers a topic.**

This is what ADR 0043 made the footnote for: a confident answer stays checkable. A sentence that
states content is a claim the reader wants to check against the line it came from. A sentence
listing what the Vault holds asserts nothing checkable about any line, so there is nothing for the
footnote to point at. It is a table of contents, not evidence.

The three shapes this pass produced, sorted by the rule:

| The answer said | Cite it? |
| --------------- | -------- |
| "the quote came from the plumber and was higher than expected" | **Yes.** That is what the line says. |
| "she takes her coffee black" | **Yes.** Same. |
| "your notes cover your wife, Priya, the loose ends list and the kitchen quote" | **No.** A survey of topics. |
| "the cards here cover mummy's bp checkup, the flat shifting, the society noc" | **No.** Same. |
| "your notes don't say anything about a badminton coaching fee, so I can't tell you" | **No.** Names nothing. |

**This also settles which way ticket 15 and ticket 07 pull.** The wider rule, cite anything the
answer names, would push the model to cite more, and ticket 07 is about a footnote already vouching
for too much. `L63` asks about a cycling club the Vault holds nothing on and its four passing runs
cited 5, 6, 5 and 3 lines. Under this rule those citations are the thing to look at, not the thing
to ask for more of.

## What to change

### First, the probe

`named_no_line_at_all` scores `bad` on any empty `lines` from a call that read the Cards. That is
wrong in both directions now. It has to score `bad` only where the answer's own words state the
content of a Vault line and `lines` is empty.

Until it does, it fails a correct fix: the fourth criterion below keeps `NO_SOURCES` firing for an
answer that found nothing, `L232` is the row covering it, and the current probe would call that row
a defect.

### Then, the prompt

`L61` is the defect and it is one shape: the answer states what two Card lines say and then disowns
both. The answering prompt already asks for every line the answer leans on. Check the schema first,
because `counted` and `covered` arrived in phase 10.85 from tickets 12 and 14, and ticket 19's
measurement found `covered` unstable on this same call. If two of the three new fields are moving,
the fix is in how the three are asked for together rather than in a fourth sentence about `lines`.

## Done when

- [x] The rate is measured first, on `claude-sonnet-5`. It is `L61` 3 of 5, `L63` 0 of 5 and `L81`
      0 of 5 under the decided rule, and `L71` not measured.
- [x] `named_no_line_at_all` scores `bad` only where the answer states the content of a Vault line
      and `lines` is empty. This comes first, and `L81` run 3 and `L63` run 1 both score good under
      it.
- [x] An answer that states what a line says names that line in `lines`.
- [x] `NO_SOURCES` still fires for an answer that really found nothing, with `L232` covering it.
- [x] An answer that only surveys what the Vault covers is not forced to cite anything.
- [x] `L61` reaches 0 of 5 on the sharpened probe.
- [x] `L71` needs a probe of its own before it can be asked for, and this ticket does not ask for it.

## Why this is `ready-for-agent`

It was `ready-for-human` for two reasons and both are spent. The rate is in, and the rule above is
decided, so what must be true at the end is no longer a judgement call. The probe is sharpened
against a rule somebody wrote down rather than against a guess at one.

## How the rate was measured

`python -m harness.live.repeat L61:named L63:named L81:named --runs 5`, on a clean tree, with the
judgement tier forced onto `claude-sonnet-5` per ADR 0003, which chose hosted models over local
inference and puts judgement on the strong tier.

### `L61`, 3 of 5, and all three are the defect

`?what did Wife say about the plumber quote`. Every one of the three named real Card material in its
paragraph and `lines: []` under it. Run 3:

> I don't see anything in your notes where your wife says something about the plumber quote. The
> quote itself is noted under Kitchen as coming from the plumber, and chasing him is tracked as a
> loose end, but nothing there ties back to your wife's words on it.
>
> From: no line of your notes I can name.

The Kitchen quote and the chasing Task are both real lines. This is the clearest row and it is why
the finding survives.

### `L63`, 1 of 5 as counted, 0 of 5 under the rule

`did the cycling club sort out its insurance?`. The one failing run listed the Vault's topics:

> The only things in here are about your wife, Priya, the loose ends list, and the kitchen quote
> from the plumber, so there's nothing to point to on this one.

That is a survey. It states what no line says. Under the decided rule it needs no citation and
`NO_SOURCES` under it is true.

### `L81`, 2 of 5 as counted, 0 of 5 under the rule

Run 2 surveyed five real items to rule them out, which is the same shape as `L63`'s. Run 3 named
nothing at all:

> Your notes don't say anything about a badminton coaching fee or the club, so I can't tell you
> whether it was paid.

Both are correct answers under the rule.

### Both counts are kept, and they are not the same number

The table at the top of this ticket carries the rate the probe returned. The rates in this section
are what that data means under the rule decided after it was taken. **A measured rate is not edited
by hand**, so neither is dropped: the probe's number says what the instrument saw and the rule's
number says what counts as the defect. When the probe is sharpened the two become one number again,
and `L61` 3 of 5 is what it should come back as.

### `L71` was not measured

Ticket 15 named four rows when it was filed: `L61`, `L63`, `L71` and `L81`. Only three probes were
ever registered in `PROBES`. `L71` has none, so it was not run. It is a named past occasion the Vault
confirmed a day for, which is a different shape from the other three, and it wants its own probe
rather than a fourth key pointing at `named_no_line_at_all`.

### One thing seen while reading, and it is not this ticket's

`L63` asks about a cycling club and the Vault holds no cycling and no club. In the four runs that
scored good here, the answer named 5, 6, 5 and 3 lines. That is a footnote citing up to six lines
under an answer to a question with nothing to answer, which is ticket 07's dimension rather than
this one's. It is recorded here because it was seen here, and `L242:volunteered` is the probe that
already reads it.

## How the fix was measured

`python -m harness.live.repeat L61:named L63:named L81:named L232:named --runs 5`, on a clean
tree, idle, judgement tier on `claude-sonnet-5` per ADR 0003, which chose hosted models over local
inference and puts judgement on the strong tier.

**The rate was taken against the prompt this ticket wrote, and that prompt sits on top of ticket
05's.** Ticket 05 landed first and told the Intent Read that a window naming only days ahead of
today is a window like any other. These four rows are name questions rather than date questions,
so nothing there should move them, but the sentence is here because the rates above it were taken
before ticket 05 and the two sets are not the same measurement.

| Row | Before | After |
| --- | ------ | ----- |
| `L61` | 3 of 5 | **0 of 5** |
| `L63` | 1 of 5 counted, 0 of 5 under the rule | **0 of 5** |
| `L81` | 2 of 5 counted, 0 of 5 under the rule | **0 of 5** |
| `L232` | never measured, no probe was registered | **0 of 5** |

`L232` is registered now, as `L232:named` on the same probe. It is the fourth criterion's row: the
question is answered out of an unfiled Capture, no Card line is stated, and the empty footnote
under it is true. A fix that bought `L61` by making every answer cite something would show up
there rather than nowhere.

### The probe took two cuts, and the first one alone was wrong

The first sharpening asked one question: does the answer use a word that sits in one Card line and
in no other? A topic word is spread out, so `the kitchen quote from the plumber` matches nothing,
and a line's own word is not, so `chasing him is tracked as a loose end` matches the Loose Ends
task. That reading passes the three replies quoted above and it is the reading that was measured
first.

**It scored 8 of 20 runs bad and the four it was right about were `L232`.** The other four were
surveys naming real items, which is the shape the decided rule says owes nothing. `L81` run 1:

> Your notes don't say anything about a badminton coaching fee or the club. The cards and captures
> here cover mummy's checkup, Nikhil's last working day, the flat shifting, the society noc, and
> the rent and LIC premium, nothing about badminton at all.

A survey that names items uses those items' own words, so the word test cannot tell it from a
statement. What tells them apart is the sentence around the words. A survey names the notes as a
heap, `the cards and captures here`, and then says what the heap covers or that it covers none of
this. A statement names no heap: `the quote itself is noted under Kitchen as coming from the
plumber`.

So `_is_a_survey` drops those sentences before the words are compared, and the four sentences that
caused the false alarms are checked-in rows in `tests/test_live_probes.py`. The limit is written
in its docstring: a real statement wrapped in the heap's name, `your notes have the quote coming in
higher than expected`, reads as a survey and is scored good. That is the loose direction, and it is
the one that measures something.

### The probe also went blind on a call that never came back

Found while sharpening it, and it is the third probe on this board with the hole, after
`L239:window` and `L239:route`. The old reading kept only the calls holding a dict and then
reported an empty list as `no call read the Cards`, which is `good`. On a probe whose target is
0 of 5 a timeout therefore read as the fix working. It now says which call failed and in whose
words, the way ticket 05 repaired `read_a_window_at_all`.

### What changed in the prompt, and why it is not a fourth sentence about `lines`

The three fields were asked for in three places with the answering rules between them, and the
never-written rule in the middle opened with `This last rule comes before every rule above it`.
`lines` was above it. So the field the answer is checked by was outranked by a rule about what the
answer may say.

The three are now one block at the end of the prompt, and the ask for `lines` carries the rule this
ticket decided: a sentence saying what a line says puts that line in the list even where the rest
of the answer is that the notes do not hold what was asked, and a sentence saying only which topics
the notes cover puts nothing in it. The never-written rule now says it comes before every other
rule about what the answer says, which is what it was always for.
