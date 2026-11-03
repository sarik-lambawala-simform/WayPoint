# 04 — Is the returning-errand link worth what it claims?

**Type:** grilling

**Status:** resolved

**Blocked by:** none. Ticket 10 waits on it, because 10 writes the specs and a decision left
unanswered here would be in no spec at all.

**Moved from:** phase 5.5 ticket 03. Renumbered, not rewritten.

**Reproduces on Haiku:** 15 of 15, and 3 of 3 on Opus. The link never filled once.

ADR 0034 says `again-of::` is best effort and names rewording as the cost. The pass measured what
best effort comes to on four wordings of one returning errand, and the answer is nothing. The link
did not fill on any run of any wording on either model.

That alone would be a note in the index, because the ADR predicted it. What makes it a ticket is
why it happens. The filing prompt pushes the model away from the only wording that would fill the
link, and no document records that.

## What was sent

The seeded Vault carries one closed Task in `areas/loose-ends.md`:

```
- [x] cancel the old broadband · done:: 2026-08-02 · from:: [[inbox/2026/08/2026-08-12#^a111]] ^a0f1
```

Four messages bring that errand back at four distances from it. All four are the person's own words.

| Row | The message | What the model wrote as the Task |
| --- | ----------- | -------------------------------- |
| L28 | `I'll have to discontinue the broadband` | `discontinue the broadband` |
| L32 | `I'm cancelling the broadband on Monday` | `cancel the broadband` |
| L33 | `I need to cancel the wifi on Tuesday` | `cancel the wifi` |
| L34 | `The wifi is still causing issues. We might want to cancel it afterall` | a Note, or `cancel the wifi` |

The nearest miss in 24 runs was `cancel the broadband`, which is the closed line minus the word
`old`.

## Why it happens

`memark/vault/apply.py:2402` matches on the whole string and nothing less:

```python
was = closed.get(edit.text) if edit.task else None
```

ADR 0034 chose that deliberately and says so: "The match is the whole string or it is nothing, so a
reworded errand comes out as an unlinked new Task rather than as a guess." It also explains why the
model cannot help. The stripping rule hides every closed Task from the call, so the model never sees
`cancel the old broadband` and cannot copy an id or a wording it was never shown. Both of those are
working exactly as written. The `## Done` section was absent from the Card in every prompt this pass
sent, which is the stripping rule confirmed rather than questioned.

The part no document records is the pull in the other direction. `memark/distillation.py:323`:

```
- One edit per claim. Keep the person's own words where you can, and write one short line.
```

So the link needs the model to reproduce its own earlier wording character for character, and the
prompt tells the model to follow the person's current wording. When the person rewords the errand,
and a person rewording an errand months later is the ordinary case, those two rules cannot both be
satisfied. Every run here failed the link by obeying the prompt. `discontinue`, `cancel the
broadband` and `cancel the wifi` are all faithful to what was typed.

This is why Opus fails it too. It is not a cheap-tier weakness, and a stronger model makes it no
better: Opus kept even more of the person's words, writing `cancelling the broadband on Monday` and
`cancel the wifi on Tuesday`. Per ADR 0003 filing runs on the cheap tier anyway, so the comparison
here says only that the design and not the tier is what decides the outcome.

## Reproduction

`python -m harness.live.repeat L28 L32 L33 L34 --runs 5 --also claude-opus-5`

| Row | claude-haiku-4-5 | claude-opus-5 |
| --- | ---------------- | ------------- |
| L28 | 5 of 5 | 1 of 1 |
| L32 | 5 of 5 | 1 of 1 |
| L33 | 5 of 5 | 1 of 1 |

Fifteen of fifteen on the filing model, and three of three on Opus.

**L34 is left out of that table on purpose, and its number should not be read as part of this.** The
probe scores "no Task was proposed" as a failure, because on L28, L32 and L33 a missing Task means
the errand was lost. On L34 a missing Task is the right answer: `we might want to` has decided
nothing, and that row exists to check that no Task is written off it. Two of its five runs proposed
no Task and Opus proposed none either, which is the row passing its own question while the probe
records it as failing. Three proposed a reworded Task. The probe registration is a wart in the
bundle rather than evidence here.

## Question

Four ways to go, and the first is a real option.

**Leave it.** ADR 0034 already says best effort, and the ADR's own reasoning is intact. A guessed
link is worse than none, and nothing reads `again-of::` back today. The honest change would then be
to the ADR's wording, because "best effort" reads like sometimes and the measurement says never, and
to say plainly that the filing prompt is part of why.

**Match on less than the whole string.** Then the ADR's guess-versus-nothing argument has to be
reopened, and something has to decide what counts as the same errand. `cancel the broadband` and
`cancel the old broadband` are one errand. Are `cancel the wifi` and `cancel the old broadband`?
That is a judgement, and putting a judgement in code is what ADR 0002 pushes back on.

**Show the model the closed lines and let it say.** This contradicts the stripping rule, which
exists for retrieval noise and for tokens on every filing call, and ADR 0034 counted that cost
carefully. It could be narrowed to the closed lines of the one target Card rather than all of them,
which is a smaller change than the ADR argued against.

**Drop `again-of::`.** Nothing reads it back today, per the note at `apply.py:469`. A field that
never fills and that nothing reads is a field the grammar and the linter carry for nothing. This is
the option the measurement most obviously supports and the one that loses whatever the field was
going to be for.

The question underneath: what was `again-of::` going to be used for? ADR 0034 wrote it without a
reader. If the answer is that a returning errand should show the person it has come back before,
then the link has to fill and one of the middle two options is needed. If nothing was ever going to
read it, the last option is the honest one. An agent must not pick.

## Answer

The link stays. The measurement killed the mechanism and not the idea, and the four options above
were the wrong four, because every one of them assumed the match happens inside the filing call
against one Card. It does not have to.

`again-of::` is filled by a model, on a second small call, against an index of every closed Task in
the Vault from the last 36 months, built at run time and never written down.

### Why the field survives its own measurement

The reader was the open question and it has an answer: the Digest. A returning errand should tell you
it has come back before, on the line, without being asked. Nobody asks whether an errand is a repeat,
which is the whole reason a box that remembers is worth having, so a fact you only get by asking is a
fact you never get.

That settles the shape too. A Digest reader means the link is written once at filing time and stored
on the line, rather than worked out when a question is asked. The other route was live: under ADR
0043, the model reads the whole Vault, the answering call already reads every Card, so it could spot a
repeat with no stored field at all if the closed lines were shown to it. That route is rejected and
the rejection matters, because ADR 0034's amendment for ADR 0043 was written the same day this was
decided and argues exactly against it: closed lines stay stripped from the answering prompt, on the
token half of this ADR's original argument, which grew rather than shrank when every Card started
going into every answer. Nothing here reopens that.

### The model decides, because no rule over letters can

`memark/vault/apply.py:2945` matches the whole string or nothing. ADR 0034 chose that deliberately and
the choice is now measured: 0 of 24, on both tiers. The prompt is why. `memark/distillation.py:323`
says keep the person's own words, and a person rewording an errand months later is the ordinary case,
so the two rules cannot both be satisfied and the link loses every time. Opus fails it harder than
Haiku by keeping more of what was typed, which is the design failing rather than the tier, per the
standing preference on this map that a stronger model is a diagnostic and never the answer.

Loosening the rule in code was rejected. Deciding that `cancel the wifi` is the closed `cancel the old
broadband` is a judgement, and ADR 0002, deterministic code selects what the model sees, plus ADR
0032, intent is read by a model and applied by code, both put a judgement on the model. So the model
is asked and code writes the field, which is the same split those two ADRs already run everywhere
else.

### A second call, not a bigger filing prompt

Folding the closed lines into the filing call was rejected on two counts. It pays on all eight runs a
day per ADR 0024 even when nothing sent was an errand, and most of what is filed is not a Task. And it
puts the repeat question in the one prompt that already tells the model to keep the person's wording,
so the prompt would carry two instructions that pull against each other.

So filing is untouched. When and only when the model proposes a Task, code makes one small call: here
is the index, is this one of these coming back, answer with a block id or with nothing. One job, one
prompt, and it is silent on every run that files a Note.

### The index is built per call and never saved

Words and block id only. A closed line as written is about 35 tokens:

```
- [x] cancel the old broadband · done:: 2026-08-02 · from:: [[inbox/2026/08/2026-08-12#^a111]] ^a0f1
```

An index entry is about 9. `done::` and `from::` say nothing to this question. Over 36 months at ten
closed errands a week that is near 1,500 entries and near 13,500 tokens, against 52,500 for the lines
as they stand.

Nothing is written to disk. ADR 0028 already drew this line for embeddings and the wording holds here:
a thing rebuilt from the Cards' own bytes holds no independent fact and cannot disagree with anything,
while a thing tracking mtimes or run timestamps holds a fact that lives nowhere else and breaks ADR
0020, state is derived from files the system already writes. Both get called rebuildable and that is
what hides the difference. This is the first kind.

The walk it needs is built. `memark/tasks.py:129` already opens every Card in the Vault and pulls out
the open Tasks for the Digest, and it was written to be lent its reading function rather than to fix
it, in its own words because walking the folders twice in two places would be the same walk drifting.
This is a third caller of that walk with a third reading. The per-file half is `closed_tasks()` at
`memark/vault/grammar.py:499`, which already returns closed Tasks as words keyed to block id, which is
an index entry as it stands.

### The whole Vault, not one Card

ADR 0034 matches against the closed lines of the same Card and nowhere else, and
`memark/vault/apply.py:563` writes `[[#^a0f1]]` with no file part because of it. That is amended.

Same-Card was kept only because reading one Card was cheap and reading all of them was not. The walk
above removes that, so the reason is gone and what is left is a rule that misses the ordinary case: an
errand about a person lands in `areas/loose-ends.md` the first time, because no Card for that person
exists yet, and in `people/<name>.md` the second time once one does. Same errand, two files, and the
old rule cannot see it by construction.

The cost is named rather than waved at. `links_within` goes and the link carries a filename like every
other, `LINK_KEYS` in `memark/vault/lint.py:42` checks the wider shape, and the walk runs on eight
filing runs a day instead of on one Digest. The last of those is disk and not tokens, and
`memark/vault/lint.py:181` already walks every file in the Vault, so it is a cost this design has paid
before.

### 36 months

A guess, and written as one. It is not a measurement and there is nothing to measure it against yet.
The reasoning is that an errand returning after three years says almost nothing, an errand returning
in six months says it is not sticking, and the useful repeats are the close ones. The bound exists
because an index with no bound grows forever against value that does not, which is the shape of
failure ADR 0034 was written to stop.

The number lives in one named place so changing it is one line.

### What this changes outside this ticket

**ADR 0034 is amended twice.** The match is no longer the whole string, and it is no longer the same
Card. Its own sentence, "the match is the whole string or it is nothing, so a reworded errand comes
out as an unlinked new Task rather than as a guess", is the thing being reversed, and the reversal is
that a guess from a model shown the candidates is not the guess that sentence refused. What that
sentence refused was code guessing from letters.

**The Digest gains a reader.** `again-of::` stops being written and never read. What the Digest says
off it, and whether it counts a chain back through several returns to say how many times, is not
decided here.

**ADR 0043 is untouched.** The strip stays. This is a separate call with its own bounded index and it
does not put a closed line into the answering prompt.

**Ticket 10 has its input.** The map said 10 was blocked on this, and the shape 10 needs is: amend ADR
0034, add the second call, add the index over the existing walk, widen the link and the linter.
