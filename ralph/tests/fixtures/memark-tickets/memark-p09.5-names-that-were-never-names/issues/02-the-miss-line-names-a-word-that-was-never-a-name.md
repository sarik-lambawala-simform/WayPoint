# 02 — The miss line names a word that was never a name

**Status:** completed

**Decided by:** phase 9.6 ticket 01, [Which capitalised words are names](../../memark-p09.6-decisions-only-you-can-make/issues/01-which-capitalised-words-are-names.md), now resolved. Read its `## Answer` before starting. It did not pick one of that ticket's four options. It removed the capital rule outright and moved the subjects onto the Intent Read, so the work below is larger than a fix inside `_capitalised` and is no longer confined to `lookup.py`.

Reproduces 5 of 5 on `claude-sonnet-5` and 1 of 1 on `claude-opus-5`, measured with
`python -m harness.live.repeat L93 --runs 5 --also claude-opus-5`. Both models fail it, and that is
the tell: `nothing_on` is computed by `look_up` before any call is made, so no model is involved and
the rate is flat by construction. It reproduces at the function level too, with no harness at all.

## What happens

    ?WAT DID BHAVESH SAY ABT THE RENT

    Recorded: ?WAT DID BHAVESH SAY ABT THE RENT

    I have nothing on ABT.

    He told you back on 24 August that he wants three thousand more in rent starting from October,
    and his reason was that the society maintenance has gone up. [...]

    From: Bhavesh (landlord), your note from 24 Aug 2026

The answer under it is right. The line above it is a false statement about a word nobody meant as a
subject, and it is the line story 75 put there to make the answer believable.

It is not about capitals lock. Any capitalised abbreviation the Vault has not seen does it:

    look_up("?did the EMI go out this month", vault=...)      ->  nothing_on = ('EMI',)
    look_up("?what did bhavesh say ABT the rent", vault=...)  ->  nothing_on = ('ABT',)
    look_up("?what did bhavesh say abt the rent", vault=...)  ->  nothing_on = ()

The lower-case spelling is clean, which places the fault in the capitalisation rule and nowhere
else.

## Where it is

`_capitalised` in `memark/lookup.py` reads every run of capitalised words as a name. `_named_nowhere`
keeps the ones no Registry row reaches. `best` in `memark/ranking.py` then keeps the ones no unit in
the Vault carries anywhere, and `answering.py` formats what is left through `NOTHING_ON`.

The corpus filter is what makes this intermittent in practice rather than constant, and it is why
it survived the phase 9 pass. `NOC` and `LIC` are both written somewhere in this Vault, so both are
dropped and the line looks fine. An abbreviation the Vault has not met yet is not dropped. The first
time you ask about a thing is exactly when you have not written about it.

## Done when

**The rule.**

- [x] `_capitalised` is deleted, and `_named_nowhere` takes the subjects it is given rather than
      reading them out of the text. Nothing in `lookup.py` reads letter case for a name any more.
      The module docstring's paragraph on the capital rule is replaced by what actually decides a
      name now, and it says why, the way that paragraph already did.
- [x] The Intent Read returns the subjects the message named: the words the person used and nothing
      else, per ADR 0032, which decided that intent is read by a model and applied by code. The
      model is not shown the Registry and never adjusts a name to one it thinks exists, which is
      the rule the `name` field on a change already follows.
- [x] `look_up` takes those subjects as an argument. The plumbing is real work and is named here so
      it is not discovered late: `read` is local to the `else` branch of `handler.py` and `_answer`
      is called below it with no access to it, so the subjects have to be passed down.

**The case where there was no reading.**

- [x] With no subjects, `nothing_on` is empty and the reply carries one plain sentence saying it
      could not check for names it does not know. It sits on the answer, not on the
      acknowledgement, and it appears on every such answer rather than once a day. The reason is in
      the decision: `READING_LIMIT_REACHED` is said once, to the first message the budget refuses,
      so a Question asked later that day would otherwise get no miss line and no warning.
- [x] Both routes into that state are tested: a reading that raised, and a spent budget. A `Command`
      cannot be a Question, so the branch that matters is `else`, plus `undo`.

**What must not break.**

- [x] `?did the EMI go out this month` states no miss, asserted by a unit test that reads
      `look_up(...).nothing_on` directly rather than a reply. This is now easier and not harder: the
      subjects are an input, so the miss line is tested with no model at all.
- [x] `L82` still passes. `what did Jignesh decide?` must still say it has nothing on Jignesh. A fix
      that buys a true line by going silent about a real unknown person has traded story 60 away for
      story 75.
- [x] `L80` still passes. Three unknown people named beside two known ones are still stated above
      the answer.
- [x] `L93`'s hard checks still pass. Its miss line is no longer unpredictable, because nothing
      reads capitals, so what it prints is read and written into `00-index.md`.
- [x] A new row covers the hole the decision also closes: a stranger named in small letters. Today
      `?when did i last meet jignesh` returns `nothing_on = ()` and the box answers around him in
      silence. Under the new rule he is named. This is story 60 gaining ground and it needs a row of
      its own.
- [x] `pytest`, `mypy`, `ruff check` and `ruff format --check` are green.

**On record.**

- [x] ADR 0032 gets one paragraph. The capital rule was in no ADR and not in `CONTEXT.md`, so
      nothing has to be undone. What is new is a promise about what the reply says when the reading
      did not happen, and ADR 0032's own "nothing happens silently" is where that belongs.
- [x] A rate is measured before this is called done. The Intent Read defaults to the cheap tier,
      per ADR 0032's amendment making the tier a Box Setting, and nothing has measured whether that
      tier names subjects reliably. Per this repo's standing rule and ADR 0003, which chose hosted
      models and put mechanical work on the cheap tier, a bad rate changes the prompt and never the
      tier.

## What was done

`_capitalised` and the two patterns it read are gone from `lookup.py`, and nothing in that module
reads letter case any more. `_named_nowhere` takes the subjects it is given. `look_up` takes them
as a keyword argument defaulting to none.

The Intent Read returns them. `subjects` is a compulsory top-level field on `intent_schema()`, the
system prompt asks for the words the person used and says in as many words that letter case
decides nothing, and `Read.subjects` carries them out. A response missing the field is refused
whole, the same way a response missing `changes` is, which is what puts a bad reading on the
no-reading path rather than on a quiet default.

`Read.subjects` is `None` rather than `()` where no reading happened, and the handler carries that
`None` down to the answer. `answering.answer` then writes `NAMES_WENT_UNCHECKED` in the miss line's
own place. Recall never gets it: that path has no miss line on any day, so a sentence about one
would be noise.

### The rate, measured on the tier the reading runs on

Five runs each on `claude-haiku-4-5`, which is the cheap tier ADR 0032's amendment made the
default, in `claude-cli` mode:

| scenario | what it measures | reproduced |
| -------- | ---------------- | ---------- |
| `L93` | the false miss: `ABT` named as a subject | 0 of 5 |
| `L97` | the silent stranger: `jignesh` left off the subjects | 0 of 5 |

`L93` was 5 of 5 on `claude-sonnet-5` and 1 of 1 on `claude-opus-5` before this, flat because no
model was involved. It is a real rate now and the cheap tier holds it, so nothing about the prompt
or the tier had to change.

`L80`, `L82`, `L91`, `L92`, `L93`, `L94` and `L97` were then run for their hard checks on the same
model: 7 pass, 0 fail.
