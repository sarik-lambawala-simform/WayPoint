# Phase 4.5 tickets, in dependency order

Seven defects found by an integration pass over phases 1 to 4, driven through `harness/` with the
Vault and both seams real. Spec: [../spec.md](../spec.md).

Read the spec's implementation decisions before starting any of these. The four that matter most: a
fix is a fix and never widens a phase, the grammar is not softened, nothing already in a Vault is
migrated, and the quote inside each ticket is the acceptance test.

## The order

Severity, which is also the order to fix them in. Only ticket 02 has a blocker.

| # | Blocked by | What is wrong | Owned by |
| - | ---------- | ------------- | -------- |
| [01](01-a-captures-own-fields-are-read-as-fields.md) | — | A Capture's own `::` text is read as a field on its block. `filed::` makes it born parked, `shown::` stops filing for the whole Vault | phase 2 |
| [02](02-a-capture-can-make-its-inbox-file-unparseable.md) | 01 | A Capture ending a line in `^` and four hex characters makes its inbox file unparseable, so filing and `lint` both fail | phase 2 |
| [03](03-the-acknowledgement-goes-out-before-the-capture-is-on-disk.md) | — | The acknowledgement is sent before the write, so a failed write is answered `Recorded:` and the re-delivery replies twice | phase 2 |
| [04](04-a-near-duplicate-card-is-created-rather-than-asked-about.md) | — | A subject that case-folds onto an existing name or alias creates a second Card instead of being asked about | phase 3 |
| [05](05-a-card-edited-during-the-model-call-is-not-a-stale-target.md) | — | A Card edited by hand during the model call is not a Stale Target, because the read taken for the prompt is thrown away | phase 3 |
| [06](06-the-digests-canary-carries-no-filing-numbers.md) | — | The Digest's Canary carries no filing numbers, because the two clocks never coincide | phase 4 |
| [07](07-the-canary-only-message-says-1-path-are-uncommitted.md) | — | The Canary-only message says "1 path in the Vault are uncommitted" | phase 4 |

## Why 02 waits for 01

They are one shape seen twice. Both are `render_capture` writing a person's words into a file the
system has to keep reading, without stopping the grammar's own marks in those words from being read as
structure. One is a field and the other is a block id, so the fixes differ, and they are very likely
the same lines of the same function. Doing 01 first and 02 on top of it beats two attempts at the same
code that have to be reconciled afterwards.

Whoever takes 01 should read 02 before writing anything, so the shape chosen for the first case is one
the second can use.

## The rest are independent

04 and 05 both touch `memark/vault/apply.py` and 06 and 07 both touch `memark/canary.py`, in different
functions each time. Neither pair needs the other done first, and neither is blocked.

## Verifying

This is a Python repo. There is no `package.json` and nothing to run `npm` against.

```sh
. .venv/bin/activate
python -m pytest          # 718 tests over 27 modules, green before any of this starts
python -m mypy            # strict, over memark and tests, configured in pyproject.toml
python -m ruff check .
python -m ruff format --check .
```

`memark lint <vault>` is a user-facing surface as well as a check, and tickets 01 and 02 both have to
leave it clean. A fix that moves a fixture is fine. An assertion changed to match new behaviour is the
thing to look at twice.
