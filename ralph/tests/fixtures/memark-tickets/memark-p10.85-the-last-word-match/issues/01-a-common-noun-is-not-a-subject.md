# 01 — A common noun is not a subject

**What to build:** the Intent Read stops returning ordinary nouns as subjects, so the miss line
stops claiming the Vault holds nothing on a thing it is about to answer about.

**Status:** completed

**Reproduces:** 5 of 5 on `claude-haiku-4-5`, the tier ADR 0003 puts the Intent Read on, for
`L168:miss`. 4 of 5 for `L174:miss`. On `claude-opus-5` as a diagnostic, 1 of 1 and 0 of 1. Both
tiers fail, so the prompt is wrong rather than too thin.

## What happens

Six rows of thirty one opened with a false sentence and then answered the question correctly.

| Row | Sent | The reply's first line | The reply's next paragraph |
| --- | ---- | ---------------------- | -------------------------- |
| `L168` | `?what did the doctor say about my sugar` | `I have nothing on my sugar.` | the fasting report at 118 and the evening rotis |
| `L169` | `?where do we go when we want Rajasthani food` | `I have nothing on Rajasthani food.` | the dal baati at the dhaba on the Sarkhej road |
| `L174` | `?how many errands are still open, and which ones?` | `I have nothing on errands.` | nine errands, correctly counted and listed |
| `L175` | `?ghar ke kitne kaam abhi pending hain` | `I have nothing on ghar.` | the same nine |
| `L179` | `?gaadi ne shu thayu chhe` | `I have nothing on gaadi.` | the Maruti, the alignment and the PUC |
| `L182` | `?Falguni ne tiffin vishe shu kahyu hatu` | `I have nothing on Falguni or tiffin.` | the eating out list |

`L182` is the one to read twice. `Falguni` belongs in that line, because the Vault has never heard
of her and ADR 0028's absolute says a stranger is named back. `tiffin` does not.

## Why

Two rules that were each right on their own.

`memark/intent.py:247` asks the model for the subjects a message is about, and says what one is:

> A subject is a person, a place or a thing the message asks about or says something about.

`my sugar` is a thing the message asks about. So is `gaadi`. The one example the prompt gives of
something that is not a subject is `ABT`, which is about how people abbreviate words, not about
common nouns.

`memark/lookup.py:680`'s `_nothing_on` then asks whether any word of each subject is written
anywhere in the Vault, and `memark/answering.py:311` writes `I have nothing on {said}` for the ones
that are not. The word `sugar` really is written nowhere: the Card says `the fasting report came at
118 in July and the doctor said cut the evening rotis to one`. Code is correct by its own rule and
the sentence is false about everything a person means by it.

The pairing was harmless while a picker chose the material, because a word nothing carried really
did mean nothing to answer from. ADR 0043 removed the picker and the pairing became a contradiction:
the model is now handed every Card, so it answers about the thing whether or not the word is there.

## What to change

The prompt, at `memark/intent.py:247`. A subject is a name, which is a thing this person's Vault
could hold a Card for: a person, a place, a project, an area of their life. It is not the ordinary
noun a question happens to be about. `my sugar`, `errands`, `ghar`, `gaadi`, `tiffin` and
`Rajasthani food` are all the question's topic, and none of them is a name.

The prompt already carries a rule of this shape for `ABT`, so this is a second sentence beside it
rather than a new idea, and the existing `Me` rule shows the form: name the case and give the
example that separates it from its neighbour.

Nothing here reopens decision 9 of phase 10.8. The miss line keeps its check and keeps its index
free reading. What changes is which words reach it.

## Not the whole of it

Ticket 02 is the half this cannot fix: a real name the Vault spells another way still produces a
false line. This ticket takes out the common nouns, which is five of the six rows above.

## Done when

- [x] `memark/intent.py`'s subject instruction says a subject is a name and gives at least one
      worked example of a common noun that is the question's topic and is not a subject.
- [x] `python -m harness.live.repeat L168:miss L174:miss --runs 5` reproduces 0 of 5 on
      `claude-haiku-4-5` for both.
- [x] `python -m harness.live.repeat L182 --runs 5` still names `Falguni` in the miss line, so the
      stranger rule of ADR 0028 is not lost with the nouns.
- [x] No earlier phase's scenarios were edited.
- [x] `pytest`, `mypy`, `ruff check` and `ruff format --check` are green.
