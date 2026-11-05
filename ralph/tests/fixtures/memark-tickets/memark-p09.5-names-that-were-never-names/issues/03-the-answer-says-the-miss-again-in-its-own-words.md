# 03 — The answer says the miss again in its own words

**Status:** completed

**Completed at:** 2026-09-09T04:43:20Z

Reproduces on the judgement tier, `claude-sonnet-5`, which is the model ADR 0003 puts on this call:

| scenario | household | shape | reproduced |
| -------- | --------- | ----- | ---------- |
| `L91` | Indian | one stranger beside a subject the question reaches | 5 of 5 |
| `L73` | baseline | one stranger beside a subject the question reaches | 5 of 5 |
| `L80` | Indian | three strangers beside two subjects | 2 of 5 |
| `L62` | baseline | three strangers beside two subjects | 3 of 5 |

Measured with `python -m harness.live.repeat L91 L80 --runs 5` and
`python -m harness.live.repeat L73 L62 --runs 5`.

**Two households, the same rate.** `L73` and `L62` are the phase 9 rows and were in the bundle
already. `L91` and `L80` are the phase 9.5 rows on a different Vault, different names, different
subjects. The rates match shape for shape, which places the fault in the prompt and not in either
Vault's contents.

## What happens

Code writes the miss line above the answer. The model then writes the same sentence again in its
own prose, so the reply says it twice.

`L91`, `?what did Jignesh decide about the rent`:

    I have nothing on Jignesh.                                    <- code

    Your notes don't say anything about what Jignesh decided.     <- the model, again
    What's there is just Bhavesh's side of it: on 24 August he
    asked for three thousand more rent from October [...]

Five runs of five said it twice. The wordings differ and the shape does not: "The notes here don't
mention Jignesh at all", "There's nothing here about Jignesh", "Your notes don't mention a Jignesh".

## Why it is a defect and not a wording preference

The prompt already forbids it. `named_the_unknown` in `harness/live/repeat.py` says why:

> The prompt says in as many words to leave such a name out, because code writes the line naming
> them above the answer and a second mention would be a second one of those.

So this is not a taste question about repetition. Story 75's design is that the miss is one line, in
one place, above the answer, written by code so its wording cannot drift. An answer that restates it
puts a second version of the same claim in the model's words, and the two can disagree. `L80` run 2
already shows them nearly disagreeing: code said "I have nothing on Chintan, Falguni or Jignesh" and
the model added "so I can't tell you what they said", which is a narrower claim about the same three
names.

## What the rates say about the fix

One stranger reproduces at 5 of 5 and three strangers at 2 and 3 of 5. The prompt holds better when
the names are a list than when there is a single name, which reads as the instruction being
attached to the plural case in the model's reading of it. Whoever writes the fix should check that
first: the sentence may be phrased for several unknown names and be getting skipped for one.

Per ADR 0003 the tier this call runs on is fixed, so a stronger model is a diagnostic and never the
fix. The prompt is what changes.

## Done when

- [x] The answering prompt says, for one unknown name as plainly as for several, that a name the
      notes hold nothing on is not to be mentioned in the answer.
- [x] `L91` and `L73` both reproduce 0 of 5 on `claude-sonnet-5` after the change.
- [x] `L80` and `L62` both reproduce 0 of 5 on `claude-sonnet-5` after the change.
- [x] The miss line itself is unchanged. This ticket removes the second telling and never the
      first: a fix that quietens code's line instead has traded story 75 away.
- [x] The rates after the change are written into `00-index.md`, so a later prompt edit that brings
      this back is caught as a regression.
- [x] `pytest`, `mypy`, `ruff check` and `ruff format --check` are green.

## What was done

Two changes, both to the answering call and neither to the miss line.

`_prompt` in `memark/answering.py` now writes the heading `## Already written above your answer`
above the question, and under it the exact line `nothing_on_line` produced. The model was never
shown the gap before, so from where it sat the question named Jignesh, the notes held Bhavesh, and
explaining that mismatch was the only sensible reply. It now reads the mismatch as a thing already
said in code's words.

The `SYSTEM` rule was rewritten to point at that heading, to list the phrasings the runs actually
produced ("there is no record of", "nothing is attributed to") rather than one of them, and to say
it holds for one name as for several. The earlier sentence telling the model to say plainly where
the notes do not answer was the rule this one kept losing to, so it now carries the exception.

Wording alone was not enough. The wording change on its own moved `L91` from 5 of 5 to 4 of 5 and
`L73` to 3 of 5. Handing the model the line is what took all four rows to 0 of 5.

`test_the_miss_line_is_code_and_not_something_the_model_was_asked_to_notice` asserted the miss line
was absent from the prompt, which is the thing this fix reverses. It is now
`test_the_miss_line_is_code_and_the_model_is_told_it_is_already_said` and checks what still has to
hold: the delivered line is code's, the heading sits above the question, and a stub answer naming
nobody still produces it. A second test checks the heading is absent when nothing was missed.
