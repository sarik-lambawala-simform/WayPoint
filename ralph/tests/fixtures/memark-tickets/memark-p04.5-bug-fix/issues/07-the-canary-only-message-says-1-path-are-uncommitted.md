# 07 — The Canary-only message says "1 path in the Vault are uncommitted"

**Status:** completed

**Completed at:** 2026-09-03T12:58:18Z

**Owned by:** phase 4. `memark/canary.py`.

**Found by:** the phase 1 to 4 integration pass, scenario A23.

## What happens

`canary.py` builds the sentence out of a pluralised count and a fixed verb:

```python
LEFT_UNCOMMITTED = "Nothing was committed and {count} in the Vault are uncommitted."
```

The count reads `1 path` or `2 paths` correctly, and the verb is always `are`. One uncommitted path
gives `Nothing was committed and 1 path in the Vault are uncommitted.`

One path is the common case. A run whose composition failed on a day with a single Capture in it has
exactly one uncommitted path, so this is the wording most Canary-only messages carry.

## Reproduction

```python
from lib import FAIL, Driver

drive = Driver()
drive.reset("baseline")
drive.at("2026-08-27T09:14")
drive.send("she wants a raincoat")
drive.at("2026-08-27T20:05")
drive.run(answers=[FAIL + "the judgement tier is down"])

print(drive.last_out().text)
# The run did not complete, so there is no Digest today.
# Nothing was committed and 1 path in the Vault are uncommitted.
```

Two Captures on two days give `2 paths in the Vault are uncommitted`, which reads correctly.

`lib.py` is the integration pass's driver over `harness.session.HarnessSession`; `FAIL` makes the
Digest composition call raise, which is the path `_say_the_run_did_not_complete` is on.

## What should happen

`.scratch/memark-p04-digest/spec.md`, story 25:

> (68) As someone who cannot tell an outage from a dead box, I want a message even when no Digest could
> be written.

And:

> **The Canary is sendable without a model.** If Digest composition fails, the transport sends the
> Canary alone as a bare message saying the run did not complete and what state the Vault was left in.
> A Canary-only message is the expected output of a failed run rather than an error path.

This is the message a person reads on the worst evenings, when they are trying to work out whether the
box is alive. It is composed by code, so its wording is fully under control, and the rest of the
Canary already agrees with itself: `1 Review Date due today`, `1 block parked`, `1 batch failed`.

## Actual behaviour

`Nothing was committed and 1 path in the Vault are uncommitted.`

The count is right and the verb does not agree with it. Everything else about the message is correct:
it is sent, it notifies, nothing is committed, and no Digest file is saved.

## Done when

- [ ] The sentence reads correctly for one uncommitted path.
- [ ] It still reads correctly for more than one.
- [ ] The wording for a Vault with nothing uncommitted is unchanged.
- [ ] Everything else about the Canary-only message is unchanged: it is sent, it notifies, nothing is
      committed, and no Digest file is saved.
- [ ] A test covers one path and more than one.
