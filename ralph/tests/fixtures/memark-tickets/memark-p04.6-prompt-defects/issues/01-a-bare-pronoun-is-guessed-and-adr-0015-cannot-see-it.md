# 01 — A bare pronoun is resolved to a person, and ADR 0015's safeguard cannot see it

**Status:** completed

Status: resolved

**Completed at:** 2026-09-04T06:52:40Z

**Owned by:** phase 3. `INSTRUCTIONS` in `memark/distillation.py`, and the ask path in
`memark/vault/apply.py`.

**Found by:** the live-model pass, scenario L16, on `claude-haiku-4-5`.

## What happens

The Capture `she said she'd sort the tickets` names no one. The baseline Registry carries two women:

```
- [[people/wife.md|Wife]] my wife · aka:: her
- [[people/priya-colleague.md|Priya (colleague)]] works with me at the agency · aka:: priya, prya
```

The filing model resolved `she` to `Wife`, returned an `extend` with a Task, the Capture drained, and
the Task was written to `people/wife.md`. Nothing asked, nothing was held back, and `lint` passes.

ADR 0015, "Ambiguous subjects are asked about, never guessed", is the decision that should stop this.
Its mechanism is a name:

> a name matching more than one Registry row is an Ambiguous Subject and stops the write

`rows_named` does that matching in `apply.py`, and it raises `AmbiguousSubject` when a subject string
reaches two rows. A bare `she` is never passed to it, because the model resolved the pronoun before
the subject was written. The safeguard is downstream of the guess and cannot see it.

The prompt has no rule about pronouns. Its nearest sentence is general:

> Prefer `contradict` whenever you are unsure.

## Why this is the worst of the six

ADR 0015 states the cost itself:

> the failure is uniquely bad: the claim lands in a real Card, under a real person, and looks exactly
> like a correct filing in the diff, the Registry and the Digest. Nothing downstream can detect it,
> and the human only finds out by reading the "what I filed" section closely on the one morning it
> happens.

That is exactly what happened, and it happened on the model the box ships filing on.

## How often it reproduces

Five runs on `claude-haiku-4-5`, one on `claude-opus-5`, same Capture, same baseline Vault.

| model | asked | guessed a person | dropped the subject |
| ----- | ----- | ---------------- | ------------------- |
| `claude-haiku-4-5` | 0 of 5 | 4 of 5, all `Wife` | 1 of 5, a Task on Loose Ends |
| `claude-opus-5` | 1 of 1, `contradict` | 0 | 0 |

Two things follow. Haiku never asked, so this is not a flake. And the one run that did not name a
woman was not a success: it filed the Task to `areas/loose-ends.md`, which drops the person rather
than asking about them, and leaves a Task nobody can act on.

Opus asked. So the prompt is not wrong about what it wants, it is too thin to carry the cheap tier.
Per ADR 0003 the cheap tier is what filing runs on, so the prompt is what has to change.

## What should happen

The Capture stays undrained, no edit derived from it is applied, and the Digest asks who was meant,
by the same route an Ambiguous Subject takes today under ADR 0015 and a Contradiction under ADR 0010.
Nothing new is stored, per ADR 0020.

The fix is at the prompt, because the guess happens before code sees a subject. The instruction has to
name the case rather than rely on "whenever you are unsure": a Capture whose subject is only a pronoun,
and where more than one Registry row could be that person, is asked about and never resolved.

## Done when

- [ ] A Capture naming its subject only by a pronoun, where more than one Registry row could be meant,
      comes back as an ask rather than an `extend` naming one of them.
- [ ] It reproduces on `claude-haiku-4-5`, five runs out of five, in the live-model bundle.
- [ ] The Capture stays undrained and the Digest asks, joining an existing ask path rather than a new
      store, per ADR 0020.
- [ ] The hold-back is counted so the Canary shows it.
- [ ] A pronoun that can only be one person still files. A Vault whose Registry carries one woman
      resolves `she` and is not held back, or the fix has made every pronoun a question.
- [ ] `Loose Ends` is not the answer. A Task whose person is unknown is asked about, not filed to the
      reserved Card, which would lose the person silently.
- [ ] A test at the filing seam with a scripted answer, so the behaviour is pinned without a live call.
