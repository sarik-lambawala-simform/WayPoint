# 03 — A finished project is not asked to go Dormant, so the write wakes it instead

**Status:** completed

Status: resolved

**Completed at:** 2026-09-04T07:12:28Z

**Owned by:** phase 3. `INSTRUCTIONS` in `memark/distillation.py`.

**Found by:** the live-model pass, scenario L12, on `claude-haiku-4-5`.

## What happens

The Capture `kitchen's done, fitter finished today, nothing left on it` says a project is over in as
many words. The model returned one `extend` with a Note and `status: null`.

`status_after` in `apply.py:1528` reads that as no status asked for, and a Card being written to
comes out `live`. So the baseline's `projects/kitchen.md`, which was `status: dormant`, was woken by
the very Capture that said it was finished.

The model asking is the only way a project goes Dormant. ADR 0007, through the docstring on
`status_after`:

> The agent may ask for a status through the field ADR 0014's edit schema already carries, and that is
> how a finished project goes Dormant. Absent that, a Card being written to comes out live.

There is no second route. No clock, no score, no threshold. If the model does not ask, nothing does.

## The prompt states the rule

> `status` is `dormant` for a subject that is over, a finished project or somebody no longer in the
> person's life, and null every other time.

The rule is right and the Capture is the clearest case it describes.

## How often it reproduces

Five runs on `claude-haiku-4-5`, one on `claude-opus-5`, same Capture, same baseline Vault.

| model | asked for `dormant` | left it null |
| ----- | ------------------- | ------------ |
| `claude-haiku-4-5` | 1 of 5 | 4 of 5 |
| `claude-opus-5` | 1 of 1 | 0 |

Flaky rather than absolute, which is worse to live with than a clean failure: the same sentence gets
a different answer on different evenings and nothing says which one happened.

Opus asks. So the prompt is not wrong about what it wants, it is too thin to carry the cheap tier,
which per ADR 0003 is what filing runs on.

## Why it matters more than a wrong field

Status is what phase 4 selects on. A finished project left `live` goes on being eligible for the
Digest, and a person who has said out loud that a thing is over keeps being asked about it. The
failure is quiet: the Card looks correct, `lint` passes, and the only symptom is a Digest that will
not let a subject go.

## Done when

- [ ] A Capture saying a project is finished comes back with `status: dormant` on at least one edit
      in the group, on `claude-haiku-4-5`, five runs out of five.
- [ ] A Capture that merely mentions a Dormant subject still wakes it. The waking rule of ADR 0007 is
      unchanged and this ticket must not make every mention a candidate for Dormant.
- [ ] Two edits in one group asking for two different statuses are still refused, per `status_after`.
- [ ] A Capture about a person no longer in the person's life is covered by the same wording, since
      the prompt's rule names both cases.
- [ ] A test at the filing seam with a scripted answer, pinning that `status: dormant` reaches the
      frontmatter and that a null status still writes `live`.
