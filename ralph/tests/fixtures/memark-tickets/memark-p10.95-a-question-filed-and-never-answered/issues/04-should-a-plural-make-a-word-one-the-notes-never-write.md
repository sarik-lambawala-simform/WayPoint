# 04 — A plural makes a word one the notes never write

**Type:** defect

**Status:** completed

**Completed at:** 2026-09-19T18:24:06Z

**Blocked by:** nothing

**Reproduces:** every run, and not a model defect. `L294` builds the same list every time, because
the list is code.

This began as a grilling ticket asking whether the plural should fold. It was grilled and the
answer is yes, in one narrow shape. The reasoning is kept at the bottom of this file, because the
paragraph it overturns is still in the codebase and a reader who finds that paragraph first will
revert this.

## What happened

`L294` asked `?passport ka kya status hai`. The answering prompt carried this:

    ## Words your notes never write

    passport

The Vault it was asked of holds a Card called `Passport Renewal`, whose Note says `both passports
run out in March and the appointment slots open at six in the morning`, and whose open Task is
`book the police verification slot`.

So the box told the model a thing that is not true about its own notes, in the one part of the
prompt whose job is to warn.

`_carried` at `memark/lookup.py:795` matches whole words and nothing near them. The Vault writes
`passports`. The question said `passport`. One is not the other, so the word counts as never
written.

On this run the model covered the question anyway and printed no miss line, so nothing reached the
person. That is luck. The miss line has two conditions per ADR 0043, the model reads the whole
Vault, and this is one of them, so a run where the model reports covering nothing would have opened
the reply with `I have nothing on passport.` above a correct answer about the passports.

English plurals are not rare in this Vault. `passports`, `slots`, `documents`, `passwords`,
`rotis`, `diyas` and `modaks` are all written plural and would all be asked singular.

## The decision

**A word and that word plus a trailing `s` are the same word, for the purpose of `_carried` only.**

- Both directions. The asked word may be the longer or the shorter of the two.
- A length floor: the **shorter** of the two forms must be at least four letters. So `bus` and `bu`
  never meet, because `bu` is two letters.
- Nothing else folds. Not `-ing`, not `-er`, not `-es`, not any prefix rule. The evidence for that
  narrowness is in the last section and is from the run itself.

`Sam` and `same` are untouched by this, and not because of the floor: `same` is not `sam` plus an
`s`. The floor is there for `bus`.

**This is not the stemmer coming back.** ADR 0028, conversation finds Cards by matching words, as
amended by ADR 0043, deleted the FTS5 porter stemmer along with the index it lived in. This adds no
index, no library and no stem table. It is one equality rule over two strings.

**The miss line stays two conditions**, per ADR 0043. Nothing here touches condition 1, which is
the model reporting what it covered.

### The accepted limit

A three letter base does not fold. `day` and `days`, `kid` and `kids` stay two words. That is the
price of the floor that keeps `bus` safe, it is paid deliberately, and no row in the pass needs it.
Do not widen the floor to buy it back without a real row.

## What to change

**`_carried` at `memark/lookup.py:795`.** It is the only caller of this rule and `_nothing_on` at
`lookup.py:767` is its only caller in turn, so the blast radius is this one function.

Today it is:

    return any(word in written for word in _folded(said))

It becomes a match that tries each word of the name against `written` as written, then as that word
plus `s`, then as that word with a trailing `s` removed, with the floor above deciding whether the
second and third are tried at all. `_words_written` at `lookup.py:811` is **not** the place for
this. Folding on the way in would put invented words into the set that other readers of that set
would then treat as written.

**`_carried`'s docstring.** It currently argues against exactly this change:

    **No rule over parts of a word is safe in both directions**: `Sam` inside `same` would go
    silently unstated, which is the promise that a stranger is named back, and `plumbers`
    reaching past `plumber` would be a false line about a name the Vault holds.

That paragraph was written when this check **fired** the miss line. ADR 0043 made it a gate on a
line condition 1 already asked for, and the paragraph was not revisited. Rewrite it with the
asymmetry in the last section of this ticket: the two conditions fail in opposite directions, so
this one may lean quiet, and the rule is chosen for what the Vault writes rather than for symmetry.
Keep the sentence saying the stemmer is gone and is not coming back.

## Done when

- [ ] `_carried` folds a trailing `s` in both directions, with the shorter form floored at four
      letters, and nothing else folds.
- [ ] `_words_written` is unchanged. The set it returns holds only words the Vault actually wrote.
- [ ] `_carried`'s docstring no longer argues against this change and carries the reason it was
      made, so a later reader does not revert it on the old paragraph.
- [ ] Unit tests in `tests/test_lookup.py` cover, at least: `passport` is carried by a Vault that
      writes `passports`; `passports` is carried by a Vault that writes `passport`; `Sam` is **not**
      carried by a Vault whose only word is `same`; `bu` is **not** carried by a Vault that writes
      `bus`; `day` is not carried by a Vault that writes `days`, as the accepted limit written down
      rather than as a wish.
- [ ] `L294` is run again and `the miss line is only where it belongs` is green. That check reads
      the same list, which is why it went red.
- [ ] Every earlier row that has a `Words your notes never write` list still passes. The names in
      those lists, `Dev`, `Meena`, `Raj`, `Zubin`, `Chintan`, `Falguni`, `Jignesh`, `Kunal`,
      `Riddhi`, `suresh`, `dinesh`, `मम्मी` and `રાજકોટ`, must each still be reported missing where
      they were missing before. Per `.claude/skills/live-pass/SKILL.md` no earlier scenario is
      edited to make this pass.
- [ ] `pytest`, `mypy`, `ruff check` and `ruff format --check` are green.

**No new ADR.** This changes no decision. ADR 0028 as amended by ADR 0043 said the stemmer and its
index go, and they stay gone. ADR 0043 said the miss line has two conditions, and it still has two.
The reason lives in the docstring, which is why the docstring is on the list above rather than
optional.

## Why this shape, and not the other two

Three shapes were on the table. Leave it, fold the plural, or ask about the whole name rather than
each word.

### The two conditions fail in opposite directions, and only one of them is a brake

ADR 0043, the model reads the whole Vault, prints the miss line only when the answering call did
not report covering the subject **and** no word of the subject is written in the Vault.
`_nothing_on` is the second of those. It is a brake on a line the first condition already asked
for.

That asymmetry is what all three shapes were missing.

- Condition 1 wrong in the quiet direction means a stranger's name goes by unnamed. That is the
  failure the line was built for, and ADR 0043 chose its direction deliberately: the model is asked
  what it covered and never what it missed, because a model asked about its own silence answers by
  saying nothing.
- Condition 2 wrong in the loud direction means a warning fires above a correct answer. That is
  `L294`.
- Condition 2 wrong in the quiet direction means a warning is suppressed on a subject the model
  already said it covered nothing about. That is a real loss, and it is one step further down than
  the docstring suggests, because ADR 0043 moved this check from firing the line to gating it.

So **leave it** was refused. Its argument was that any folding risks a stranger going unnamed, and
that risk is smaller than the paragraph reads. The bug is live and the risk is hypothetical.

That does not license a loose rule. It licenses a rule chosen for what the Vault writes rather than
for symmetry, which is what the floor buys.

### Asking the model was considered, and it is already half the rule

The proposal to let the model answer this was raised. Condition 1 is already the model, asked
positively. Asking it a second positive question, which of these words did you see written, would
not break ADR 0043's rule that the model is never asked about absence, and would not break ADR
0028's rule, kept whole by ADR 0043, that code writes this line and the model never does.

It was refused for two reasons. It buys a prompt field and a parse path for a gap a small rule
closes. And a second model-sourced condition makes both conditions fail together on the run where
the model is weak, when condition 2's whole job is to fail differently from condition 1.

**Ask about the whole name rather than each word** was not needed. `passport` is one word, so a
different reading of a multi word subject does not reach it.

### Only the plural, measured rather than assumed

`-ing` and `-er` were asked about and refused on the run's own evidence. Every word the pass put in
a `Words your notes never write` list, across 21 lists, searched against the whole run for other
forms of itself:

| Word | Other forms anywhere in the run |
| ---- | ------------------------------- |
| `passport` | `passports` |
| `cycling` | none |
| `coaching` | none |
| `badminton` | none |
| `club` | none |
| `gaadi` | none |
| `skul` | none |

The rest were names: `Dev`, `Meena`, `Raj`, `Zubin`, `Chintan`, `Falguni`, `Jignesh`, `Kunal`,
`Riddhi`, `suresh`, `dinesh`, `मम्मी`, `રાજકોટ`. Names have no plural and no gerund, and they are
most of what this line is for.

The plural is the only word-ending gap the pass produced. There is also a reason it is the only one
worth folding: `passport` and `passports` are one thing counted twice, so folding them asserts
something true, while `book` and `booking` are two different things and folding them is a guess. A
subject out of the Intent Read is a noun or a name, so `-ing` and `-er` have little to reach.

If an `-ing` or `-er` gap ever shows up in a pass, it is a new ticket with a real row behind it.

## Evidence

The prompt above is from `live-pass-p10.9-hitl.json`, row `L294`, the judgement call. The row went
red on `the miss line is only where it belongs`, which read the same list.
