# 08 — The closed-Task index, and the second call that fills `again-of::`

**What to build:** when the filing model proposes a Task, one small extra call asks whether it is a
closed errand coming back.

Decided in
[ticket 04, is the returning-errand link worth what it claims](../../memark-p09.6-decisions-only-you-can-make/issues/04-is-the-returning-errand-link-worth-what-it-claims.md).
Do not re-argue it.

**The model decides, because no rule over letters can.** `memark/vault/apply.py:2945` matches the
whole string or nothing, and that choice is now measured: 0 of 24, on both tiers.
`memark/distillation.py:323` is why, because it tells the model to keep the person's own words, and a
person rewording an errand months later is the ordinary case. The two rules cannot both be satisfied
and the link loses every time. Opus fails it harder than Haiku by keeping more of what was typed,
which is the design failing rather than the tier.

Loosening the rule in code was rejected. Deciding that `cancel the wifi` is the closed `cancel the
old broadband` is a judgement, and ADR 0002, deterministic code selects what the model sees, plus ADR
0032, intent is read by a model and applied by code, both put a judgement on the model. So the model
is asked and code writes the field.

**A second call, not a bigger filing prompt.** Folding the closed lines into the filing call was
rejected on two counts. It pays on all eight runs a day per ADR 0024 even when nothing sent was an
errand, and most of what is filed is not a Task. And it puts the repeat question into the one prompt
that already tells the model to keep the person's wording, so the prompt would carry two instructions
that pull against each other.

So filing is untouched. When and only when the model proposes a Task, code makes one small call: here
is the index, is this one of these coming back, answer with a block id or with nothing. One job, one
prompt, and it is silent on every run that files a Note.

**The index is built per call and never saved.** Words and block id only. A closed line as written is
about 35 tokens:

```
- [x] cancel the old broadband · done:: 2026-08-02 · from:: [[inbox/2026/08/2026-08-12#^a111]] ^a0f1
```

An index entry is about 9, because `done::` and `from::` say nothing to this question. Over 36 months
at ten closed errands a week that is near 1,500 entries and near 13,500 tokens, against 52,500 for
the lines as they stand.

Nothing is written to disk. ADR 0028 already drew this line for embeddings and the wording holds
here: a thing rebuilt from the Cards' own bytes holds no independent fact and cannot disagree with
anything, while a thing tracking mtimes or run timestamps holds a fact that lives nowhere else and
breaks ADR 0020. This is the first kind.

**The walk is built.** `memark/tasks.py:129` already opens every Card in the Vault and pulls out the
open Tasks for the Digest, and it was written to be lent its reading function rather than to be
copied, in its own words because walking the folders twice in two places would be the same walk
drifting. This is a third caller of that walk with a third reading. The per-file half is
`closed_tasks()` at `memark/vault/grammar.py:499`, which already returns closed Tasks as words keyed
to block id, which is an index entry as it stands.

**36 months is a guess and is written as one.** There is nothing to measure it against yet. The
reasoning is that an errand returning after three years says almost nothing, an errand returning in
six months says it is not sticking, and the useful repeats are the close ones. The bound exists
because an index with no bound grows forever against value that does not, which is the shape of
failure ADR 0034 was written to stop. **The number lives in one named place so changing it is one
line.**

**The reader is the Digest**, and that is what decided this shape. A returning errand should tell you
it has come back, on the line, without being asked. A Digest reader means the field is written once
at filing time, so the live route, letting ADR 0043's whole-Vault read spot a repeat with no stored
field, is rejected.

**What the Digest says off the field is not in this issue.** The field gets a reader that can be
written once there are real chains to look at.

**Blocked by:** 07 — The returning-errand link goes Vault-wide and carries a filename.

**Status:** completed

**Completed at:** 2026-09-14T14:59:10Z

- [ ] A second model call fires only when the filing model proposes a Task.
- [ ] The call is silent on a run that files no Task.
- [ ] The index holds words and block id only, for closed Tasks from the last 36 months, Vault-wide.
- [ ] The index is built at run time and nothing is written to disk.
- [ ] It is built on `memark/tasks.py:129`'s walk and `closed_tasks()` at
      `memark/vault/grammar.py:499`, not on a second walk.
- [ ] 36 months lives in one named constant.
- [ ] A reworded errand matching a closed Task on another Card fills `again-of::` with that block's
      id and filename.
- [ ] A model answering with nothing writes no `again-of::` and refuses nothing.
- [ ] A model answering with a block id that is not in the index leaves the field empty.
- [ ] A closed Task older than 36 months is not in the index.
