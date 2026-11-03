# 18. An errand with no Card goes to Loose Ends, and a Task may open Me

**Type:** task

**Status:** completed

**Completed at:** 2026-10-08T03:53:13Z

**What to build:** `dentist appt tmrw 11am` is filed on `Me` even when `people/me.md` does not exist
yet. `remind me to call the electrician on 2nd oct` is filed as `✅ Loose Ends: call the electrician,
on 02 Oct 2026. ...` when no Electrician Card exists.

Spec: [../spec.md](../spec.md), "Strand 1". Decided in
[Where does an errand go when its subject has no Card?](08-where-does-an-errand-about-yourself-go.md).
The rule is ADR 0056, an errand with no Card to join goes to Loose Ends, and a Task may open Me.

## What happens today

`_the_person` and `_the_card_meant` in `memark/vault/apply.py` raise `Refused` for a Task on a name
with no Card. The reply shows `❓` and the date is never confirmed. `L319` 5 of 5, `L321` 4 of 5,
`L370` 2 of 3.

## What to change

- `_the_person`: a Task on `Me` with no row opens `people/me.md` through `_new_card`, as a Note does.
- `_the_card_meant`: a Task on a name with no Card and not in `opening` returns the `Loose Ends`
  target. Log the name the model gave, once.
- The Ambiguous Subject and near-duplicate asks still come first. Do not move them.
- A Note or a date on a new name still opens its Card.
- Rewrite the docstrings of `resolve`, `_the_card_meant` and `_the_person` to name ADR 0056.

The reply needs no new wording. `landed` already writes the Card's name.

## Done when

- [ ] A Task on `Me` with no `Me` row opens `people/me.md` with code's Registry line.
- [ ] A Task on `CA` with no Card lands on `Loose Ends`, and the reply line says `Loose Ends`.
- [ ] A Task on a name one letter off an existing Card still raises the near-duplicate ask.
- [ ] `amma birthday october 14, gift vaanganum, saree edukanum`: the two Tasks land on `Loose Ends`
      and the birthday waits for its tap.
- [ ] A Task on a subject a Note in the same run opens still joins that Card.
- [ ] Tests that assert the old refusal are brought up to the rule, and name this ticket.
- [ ] The unit suite, `mypy`, `ruff check` and `ruff format --check` are green.
