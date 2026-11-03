# 21 — A Capture drains only when every claim piece is covered

**Type:** task

**Status:** completed

**Completed at:** 2026-09-18T17:22:05Z

**Blocked by:** 20

**Strand:** A, the filing path. The fix.

**What to build:** a message holding two facts, where the model proposed an edit for one, keeps its
place in the queue, so the fact nobody filed comes back in the next Digest instead of being lost.

## What happens today

The Capture takes its `filed::` mark on the strength of the one edit that landed. The second fact is
written nowhere, cited nowhere, and no Digest will ever ask about it. `L211` loses a payment on 3 of
5 runs on the cheap tier. `L223` loses the same errand out of ten on both tiers.

## What to change

**The filing call hands back a partition.** Beside the edits, a list of pieces per Capture. Each
piece is that Capture's own raw text and a mark. `claim` means an edit was derived from it. `skip`
means it carries no claim: a greeting, a connective, filler.

**It is a schema field like any other.** Full `required` list, `additionalProperties` false, an
absent value written as null. `docs/stack/anthropic-api.md` holds the shape rules and nothing here
is an exception to them.

**Code checks the pieces reassemble.** Concatenated, they are the Capture's raw words. A partition
that does not reassemble holds the Capture back.

**`_drained` gains its second condition.** A `claim` piece that no surviving edit came from holds
the Capture in the queue. The condition it has today, that no edit naming it failed to write, is
unchanged and still applies.

**No code-only backstop.** Per ticket 20's ADR, there is no length rule under this.

## The half to test first

An ordinary message must end exactly as it ends today. Its claim pieces each derived an edit, those
edits wrote, its filler is `skip`, the pieces reassemble, so nothing is owed and it drains. A rule
that holds everything back would be a worse box than the one this fixes, and this is the test that
catches it.

## The seam

`vault/apply.py`'s pass over a batch, with the doubles in `tests/doubles.py` standing in for the
model, the way `tests/test_apply.py` and `tests/test_asks.py` already drive it. No test reaches into
a private function to assert its shape. Vault fixtures are checked-in directory trees and no fixture
is built in a test body.

## Done when

- [ ] A message whose pieces are all covered drains. Write this one first.
- [ ] A message with one `claim` piece that no edit derived from keeps no `filed::` mark.
- [ ] A partition that does not reassemble into the raw words holds the Capture back.
- [ ] A message the write path held back drains exactly as it does today.
- [ ] A message that proposed nothing and is all `skip` drains, which is ticket 11's rule surviving.
- [ ] A message that proposed nothing and holds a `claim` piece is held back.
- [ ] The schema field follows `docs/stack/anthropic-api.md`: full `required`, no extra properties,
      absent written as null.
- [ ] The code cites ticket 20's ADR.
- [ ] The refused edit in `distillation.py` is left in place.
- [ ] The unit suite is green.
- [ ] It commits.
