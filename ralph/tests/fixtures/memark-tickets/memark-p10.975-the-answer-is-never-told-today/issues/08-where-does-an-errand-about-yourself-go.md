# 08. Where does an errand go when its subject has no Card?

**Type:** grilling

**Status:** resolved

## Question

The filing model often puts an errand on a subject that has no Card yet: `Me` for the sender's own
errands, or a new name like `CA` or `Electrician`. `resolve` in `memark/vault/apply.py` then
refuses the Task, because a Task never opens a Card:

    `Me` has no Card yet and no Card is opened to hold a Task, so this errand waits for something
    to be said about the person

The reply shows `❓`. The errand is not lost, but it is not filed, and its typed date is not
confirmed either.

| row | words | subject | held `❓`, `claude-haiku-4-5` | `claude-sonnet-5` |
| --- | --- | --- | --- | --- |
| `L319` | `dentist appt tmrw 11am` | `Me` | 5 of 5 | 2 of 3 |
| `L321` | `meeting with CA on the 4th, carry form 16 and PAN copy` | `Me`, once `CA` | 4 of 5 | 1 of 3, on `CA` |
| `L307` | `Pay the property tax on 15th october, remind me 2 days before` | `Me` where seen | 3 of 15 | not run |
| `L316` | `Diwali ki shopping 20th Oct ko, ek hafta pehle yaad dilana` | `Me` | 2 of 5 | 0 of 3 |
| `L370` | a question, then `also remind me to call the electrician on 2nd oct` | `Electrician` | 2 of 3 | not run |

The filing prompt already says `remind me to` takes no subject. `dentist appt tmrw 11am` has no
`remind me` at all, and the model still reads it as about the sender. Both tiers do it, so the
prompt is not enough on its own.

`Me` is a reserved Card, per phase 5.5. Its name, path, kind and Registry line are code's.

Which of these?

- **Code moves a Task bound for a subject with no Card to `Loose Ends`,** the way a Task that
  belongs to nobody goes there now. The reply names `Loose Ends`.
- **A Task may open the reserved `Me` Card**, since everything about it is code's already. Other
  new names keep today's rule.
- **Neither.** Change the filing prompt, and accept the rate.

Settle also:

- Where an errand about yourself belongs once `Me` does exist: on `Me`, or on `Loose Ends`.
- `L326`: `amma birthday october 14, gift vaanganum, saree edukanum`. The birthday waits for its tap,
  per ADR 0042, so `Amma` gets no Card, so the two Tasks on her are refused as well. Is that right?

## Answer

Grilled on 2026-10-01. Written down as ADR 0056, an errand with no Card to join goes to Loose Ends,
and a Task may open Me: [../../../docs/adr/0056-an-errand-with-no-card-to-join-goes-to-loose-ends.md](../../../docs/adr/0056-an-errand-with-no-card-to-join-goes-to-loose-ends.md).

- **A Task may open `Me`.** `Me` is one file and code owns its name, path and Registry line, so it
  cannot rot into errand files. Fixes `L319`, most of `L316` and `L321`.
- **A Task on any other name with no Card goes to `Loose Ends`.** Code moves it, and the reply
  names `Loose Ends`. Fixes `CA` in `L321` and `Electrician` in `L370`. The Ambiguous Subject and
  near-duplicate asks still come first. A Task still joins a Card the same run opens.
- **Once `Me` exists, a self errand goes on `Me`.** `CONTEXT.md` already said so. Not reopened.
- **`L326`: Amma's Tasks go to `Loose Ends`.** They do not wait for the birthday's tap.
- **No prompt change.** Both tiers put the errand on a subject.
- A Task on `Loose Ends` stays there when its subject's Card opens later. Accepted.
- `CONTEXT.md`: the `Loose Ends` and `Me` entries now say this.

Build: `resolve` and `_the_person` in `memark/vault/apply.py`, their docstrings, and the reply line
that names `Loose Ends`. The `harness/live/` bars for `L319`, `L321`, `L370` and `L326` expect the
errand filed, not held.
