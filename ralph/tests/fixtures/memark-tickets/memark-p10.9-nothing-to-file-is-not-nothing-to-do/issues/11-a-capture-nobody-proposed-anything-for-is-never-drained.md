# 11 — A Capture nobody proposed anything for is never drained

**Type:** defect

**Status:** completed

**Completed at:** 2026-09-18T02:23:00Z

**Blocked by:** 01

**What to build:** a Capture the filing call proposed nothing for takes its `filed::` mark, so a
message with nothing to file stops being sent to the model on every run for the rest of the
Vault's life.

**Reproduces:** every run, and not a model defect. It is arithmetic in `vault/apply.py` and it
holds whatever any model answers. The free dry run shows it on all 23 filing rows of the wide
pass, because `auto` proposes nothing and every one of them ends held back.

## What happens

Four rows of the wide pass sent a message the model correctly had nothing to file from. Every one
of them ended with the Capture still queued.

| Row | Sent | What the model proposed | How it ended |
| --- | ---- | ----------------------- | ------------ |
| `L221` | `kuch khaas nahi aaj, bas aise hi` | nothing | held back |
| `L222` | `👍` | nothing | held back |
| `L216` | `ramaben asks for the diwali bonus one month in advance every year, same as always` | nothing, because the line is already on her Card | held back |
| `L206` | `jignesh said the meter board needs upgrading, बोला कि दो एसी नहीं चलेंगे` | nothing, for the same reason | held back |

Held back is not a resting state. The block carries no `filed::` mark, so the next filing run
scans it, puts it in the prompt and pays for it again. Nothing ever moves it: `shown::` is written
by the Digest when the Digest asks about something, and there is nothing here to ask about, so
ADR 0037's bound of fourteen asks never starts counting. The prompt grows by one block every time
somebody sends a thumbs up.

## Why

`memark/vault/apply.py:1987`, `_drained`, builds its answer out of the edits that wrote:

```python
written = {id(edit) for edit in wrote}
owed = {source for edit in edits if id(edit) not in written for source in edit.sources}
return tuple(
    dict.fromkeys(source for edit in wrote for source in edit.sources if source not in owed)
)
```

A Capture that derived no edit is in neither set. It is not in `owed`, because nothing of it failed
to write. It is not in the result either, because the result is generated from `wrote` and it wrote
nothing. `memark/filing.py:378` then marks only what came back:

```python
marks.extend(_mark(by_id[block_id], day) for block_id in applied.drained)
```

So the Capture is skipped rather than refused, and no log line says so.

The rule this breaks is written down in `memark/distillation.py:56`, in the paragraph explaining why
an unplaceable claim is asked for on purpose:

> A thought the model was told to stay quiet about derives no edit, owes nothing, takes its
> `filed::` mark and is never raised again.

It does not take its mark. The paragraph describes the behaviour the design wanted and the code
does the opposite, which is why nothing caught it: every check in the package asserts that a
Capture is drained **or** held back **or** parked, and held back is one of the three.

## What to change

`_drained` takes the Captures of the batch rather than deriving them from `wrote`. A Capture drains
when nothing derived from it is owed an answer, which is true of a Capture that derived nothing at
all. One line of the same function, read from the queue instead of from the edits.

Watch the boundary. A Capture whose only edit was refused still owes an answer and must stay
queued, which is what `owed` already says. The change is about the Captures that appear in neither
set, and the two cases have to stay apart.

## Done when

- [ ] `_drained` marks a Capture the batch proposed no edit for.
- [ ] A Capture whose proposed edit did not write still stays queued, unchanged.
- [ ] A unit test sends a message the filing call answers with no edits and asserts the block takes
      a `filed::` day.
- [ ] A unit test sends a message with one edit that is refused and asserts the block takes no mark.
- [ ] `distillation.py`'s paragraph and the code agree, whichever of the two moves.
- [ ] `L221` and `L222` in `harness/live/scenarios_p10_85_india_wide.py` carry a hard check that the
      Capture drained, so the next pass catches this coming back.

## Earlier work, reverted

A run started this ticket and was stopped part way. Its partial work is commit `a13776d` and the
revert is the commit after it, so the tree is green and this ticket is unstarted again.

**Read `a13776d` before writing anything.** It got two things right that this ticket's body does not
say. `_drained` needs the batch's sources passed in, because the answer cannot be derived from the
edits alone. And it must be called with every edit the call made rather than with `remaining`: a
compaction is dropped before the write path and refused on the way out, so its Capture is owed an
answer and would otherwise drain on an edit that reached no file.

It also added a test in `tests/test_a_capture_that_files_in_parts.py` and checks in
`harness/live/checks.py`. Take what is useful rather than starting from nothing.
