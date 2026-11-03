# 27. Advice may use what the model knows

**Type:** task

**Status:** completed

**Blocked by:**

**What to build:** `can you recommend me a good movie that I would enjoy` gets a real pick. The pick
is built on the taste your notes hold. The reply says which part came from your notes and which part
is the model's own suggestion.

## What happens today

Seen by hand on 2026-10-08 in the harness, chat messages 1003 to 1010.

- `^a736`: `I am watching spiderman brand new day today and also saw Andor`
- `^908a`: `Based on the movies that I've watched so far, can you recommend me a good movie that I would
  enjoy That I can watch next`
- `^8fbc`: `I like crime thriller movies and also superhero movies. I really enjoyed the Dark Knight
  trilogy by Christopher Nolan and I also enjoy most of Christopher Nolan movies`
- `^29a1`: `Only now since you know my preferences can you help me get some recommendations for movies
  that I can watch next`

Both questions were refused. The second reply read the taste back correctly, then said a pick "would
mean reaching outside what's written here". Both ended `From: no line of your notes I can name.` Any
general chat assistant answers this question. The person asked twice and got nothing they could use.

The cause is `SYSTEM` in `memark/answering.py`: "They are the only thing you may answer from. Say
what the notes say and nothing more." That rule is there so the box never invents a fact about the
person. It cannot tell an invented fact from advice, so it blocks both.

## The rule

Decided with the person on 2026-10-08.

> A fact about you comes only from your notes. Advice, a suggestion or general knowledge the
> question asks for may come from what the model knows, built on what the notes say about you. The
> reply says which part is which.

- **Facts stay notes-only.** "When is Priya's birthday", "what did I spend on the plumber", "did I
  call mum" are unchanged. A gap is still a gap, and an invented fact still costs more than no answer.
- **Advice may go further.** A request for a recommendation, an idea, a suggestion or a general
  fact ("what is a good gift for a 6 year old", "what should I watch next") may use the model's own
  knowledge.
- **The notes come first.** Where the notes hold the person's taste, the pick uses it and says so:
  "You said you like crime thrillers and Nolan, so ...".
- **The split is said out loud.** The reply names what came from the notes. Anything from the
  model's own knowledge is said as a suggestion and never as something the notes hold.
- **No made-up notes.** The model never cites a note line for a suggestion. `lines` holds only the
  lines the notes part used.

## What to change

- **The prompt.** Rewrite the "only thing you may answer from" sentence in `SYSTEM` to carry the rule
  above. Keep "an answer that sounds sure and is invented costs more than no answer", scoped to facts
  about the person. Read the ADR 0046 paragraph at the end of the block. It is about adding Vault
  material after a miss line and must stay as it is.
- **The schema.** Add one boolean field, `suggested`, to the answer schema. It is true when the
  answer holds anything from the model's own knowledge. Code uses it for the sources line below.
  Add it to the `required` list at `memark/answering.py:418`, and read it the way `counted` is read
  at `memark/answering.py:546`.
- **The sources line.** When `suggested` is true, code adds one line under the `From:` line, in its
  own words, for example `The suggestions are mine, not from your notes.` When `lines` is empty and
  `suggested` is true, that line takes the place of `From: no line of your notes I can name.` A reply
  with a pick and a footer saying "no line I can name" reads as broken.
- **The miss line.** ADR 0043, the model reads the whole Vault, says code writes the miss line and the
  model never does. That stays. A miss line on a subject the notes hold nothing on can still sit above
  a suggestion.
- **An ADR.** Write one for the rule above. It amends ADR 0043, the model reads the whole Vault, on
  "the only thing you may answer from". It cites ADR 0046, what a reply may carry after it admits a
  gap, and says that rule is about Vault material and is not changed. Name the new ADR in the code
  comment over `SYSTEM`.
- **`CONTEXT.md`.** If the ADR names a new term for a suggestion, add it. If it does not, add nothing.
- **Live rows.** Add rows to `harness/live/scenarios_p10_975.py`, numbered from `L406`. Do not edit
  any earlier row.
  - The four messages above, in order, then the second question. Hard checks: the reply names at
    least one film title, the reply mentions crime thrillers or Nolan, and the suggestion line is
    present.
  - The same with no taste message. Hard check: the reply still gives a pick and says the notes hold
    no taste.
  - One Hinglish twin, for example `mujhe crime thriller pasand hai, koi movie batao`.
  - One fact guard: a question about a date the notes do not hold, for example `when is Rahul's
    birthday`. Hard checks: no date is given, and no suggestion line is written. This row stops a
    later fix from letting the model guess facts.
  - Rerun `L226` and `L242` from ADR 0046 unchanged. Both must still pass.

## Done when

- [x] With the model stubbed to return `suggested: true` and empty `lines`, the reply ends with the
      suggestion line and has no `From: no line of your notes I can name.`
- [x] With the model stubbed to return `suggested: true` and one cited line, the reply has the
      `From:` line and the suggestion line under it.
- [x] With the model stubbed to return `suggested: false`, the reply is byte for byte what it is
      today.
- [x] The ADR is written and named in the comment over `SYSTEM`.
- [x] The new rows and their hard checks are in `harness/live/`. Earlier rows are not edited.
- [x] `MEMARK_PASS_MODE=auto python -m harness.live` runs the new rows.
- [x] The unit suite, `mypy`, `ruff check` and `ruff format --check` are green.
