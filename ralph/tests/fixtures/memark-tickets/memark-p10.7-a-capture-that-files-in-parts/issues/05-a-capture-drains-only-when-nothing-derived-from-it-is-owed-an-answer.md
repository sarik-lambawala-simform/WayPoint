# 05 — A Capture drains only when nothing derived from it is owed an answer

**What to build:** the lines that land are written, the block stays in the queue, and the Digest
keeps asking about the part that did not land.

Decided in
[ticket 03, should a Capture be filable in parts](../../memark-p09.6-decisions-only-you-can-make/issues/03-should-a-capture-be-filable-in-parts.md).
Do not re-argue it.

**The state is called Part Drained.** Some of the Capture's lines are in Cards, the block carries no
`filed::` mark, and it is still queued.

**The bug this closes is silence, not delay.** Partial filing already ships, and the part that does
not land is lost. `memark/vault/apply.py:1906` reads:

```python
drained.extend(source for edit in group for source in edit.sources)
```

So a Capture carrying one good edit and one refused edit has the good edit written, gets its `filed::`
mark, and the refused edit is gone. No run proposes it again and no Digest asks. The docstring at
`memark/vault/apply.py:19` says the opposite, that a refusal leaves the Captures behind it undrained,
and that is only true when the refused edit is the Capture's only one.

The two paths therefore disagree today:

| The Capture holds | What happens now |
| ----------------- | ---------------- |
| a good edit and a **refused** edit | the good edit lands, the block drains, the refused edit is dropped in silence |
| a good edit and a **`contradict`** edit | nothing lands, the block stays queued, the Digest asks |

**The rule, one line over both paths:** a Capture drains only when nothing derived from it is still
owed an answer. An edit that was refused or held back leaves its Capture unfiled however many of its
siblings wrote. That makes the ask path strictly more generous and the refusal path strictly less
silent.

`_held_back` at `memark/vault/apply.py:2403` holds everything today on a premise that is false. It
says an applied edit would drain the Capture, but the mark is a separate write and whether a source
is in `drained` is code's choice at line 1906. Take the source out of `drained` when an ask or a
counted refusal names it, and the sibling lands with the question still open.

**No new store.** ADR 0020, state is derived from files the system already writes, refuses a new mark
and does not need one. Part Drained is the absence of `filed::` plus the presence of a Card line
carrying a `from::` link back to the block, and both halves are already written for other reasons.
ADR 0026 puts a `from::` link on every agent line, and `_cited` at `memark/vault/apply.py:2327`
already reads them for ADR 0019's orphan check.

**This closes a hole in issue 02's argument.** That issue rests "a refused claim is not lost" on the
block staying in the queue. Put a homeless claim in a brain dump next to one fact that files, and
today the block drains and nothing ever asks.

**This issue alone is not correct.** Leaving a block queued means the next run proposes the landed
fact again, on the order of a hundred times before it Parks. Issue 06 is the other half. Build this
one first and test the two together.

**Blocked by:** none.

**Status:** completed

**Completed at:** 2026-09-14T13:46:23Z

- [ ] `memark/vault/apply.py:1906` leaves out of `drained` any source named by an ask or by a counted
      refusal.
- [ ] `memark/vault/apply.py:2403`'s `_held_back` holds the edit and no longer the Capture's
      siblings, and its reason is rewritten.
- [ ] `memark/vault/apply.py:19`'s refusal docstring stops claiming a general rule it does not have.
- [ ] A Capture with one good edit and one refused edit writes the good edit and keeps no `filed::`
      mark.
- [ ] A Capture with one good edit and one `contradict` edit now writes the good edit, where nothing
      landed before.
- [ ] A Capture whose every edit writes still drains and still gets its `filed::` mark.
- [ ] The next Digest asks about the part that did not land.
- [ ] `CONTEXT.md` gains **Part Drained** beside Parked and Declined, and the Capture entry gains one
      sentence about the drain rule.
- [ ] ADR 0010 gains one line saying the other facts in the message no longer wait on a
      Contradiction. Its refusal is untouched.
