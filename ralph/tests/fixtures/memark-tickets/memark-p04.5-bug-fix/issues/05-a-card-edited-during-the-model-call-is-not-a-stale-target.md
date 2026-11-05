# 05 — A Card edited by hand during the model call is not a Stale Target

**Status:** completed

**Completed at:** 2026-09-03T12:29:28Z

**Owned by:** phase 3. `memark/filing.py` and `memark/vault/apply.py`.

**Found by:** the phase 1 to 4 integration pass, scenario A16.

## What happens

`Writer.read` records a hash and `Writer.write` re-checks it, so the mechanism is there. What is
missing is that the read taken before the model call is the one the write is checked against.

`_cards_named_by` reads a Card to put its body in the filing prompt, and throws that `FileState`
away. When the answer comes back, `_extend_card` calls `_read_card` again and writes against that
second read. The window the check covers is therefore the microseconds inside `_extend_card`, not the
seconds or minutes the model call takes.

So a Card edited by hand while a run is waiting on a model is not detected. The run's edits are
applied on top of the hand-written text, no Stale Target is counted, and the Canary says the day was
clean.

## Reproduction

```python
from lib import Driver
from a_extra import BLOCK, edit

drive = Driver()
drive.reset("baseline")
drive.at("2026-08-27T09:14")
drive.send("her raincoat again, she wants a proper one")  # names the Wife Card, so it is read
ids = BLOCK.findall(drive.inbox_for("2026-08-27"))
by_hand = drive.read("people/wife.md") + "- ! she is allergic to shellfish, do not forget\n"


def hand_edit_then_answer(session, call):
    """The pass is stopped inside its filing call. This is me in Obsidian, mid-run."""
    session.write("people/wife.md", by_hand)
    return {
        "edits": [
            edit("extend", "Wife", "person", "Facts", "she wants a proper raincoat", [ids[0]])
        ]
    }


drive.at("2026-08-27T21:00")
job = drive.run(answers=[hand_edit_then_answer])

wife = drive.read("people/wife.md")
assert "allergic to shellfish" in wife  # my line survived
assert "raincoat" in wife  # and the run wrote on top of it anyway
assert "Stale Target" not in job.notes[-1]  # nothing was counted
```

`lib.py` is the integration pass's driver over `harness.session.HarnessSession`; a callable in
`answers` runs while the pass is stopped inside that model call, which is the window the story
describes. The Capture has to name the Card, or the Card is never read for the prompt and there is no
earlier read to check against at all.

## What should happen

`.scratch/memark-p03-filing-run/spec.md`, story 9:

> (26) As someone who sometimes fixes a Card by hand late at night, I want an edit I made while a run
> was in flight to block that Card's changes rather than be overwritten.

And its implementation decision:

> **Writes are checked against expected state, per ADR 0009.** A Stale Target, almost always a Card
> edited by hand in Obsidian while the run was thinking, has its pending edits dropped rather than
> applied.

`CONTEXT.md` says which window a Stale Target is:

> **Stale Target**: A Vault file whose contents changed between the run reading it and the run writing
> it — almost always the human editing a Card by hand mid-run.

The run does read the Card, to build the prompt. That read is the start of the window, and it is the
one the write has to be checked against.

## Actual behaviour

The hand-written line survives and the run's line is appended below it. Nothing is overwritten and
nothing is lost, because every edit v1 writes is an append. The costs today are that the promise in
story 9 is not kept, that the Canary reports a clean day when a Card was edited under a run, and that
a `compact`, when compaction lands, would be computed from a body that has since changed.

The existing unit test reaches the Stale Target path by monkeypatching a hand edit into the moment
between `_extend_card`'s own read and its write. That proves `Writer.write` refuses, and it does not
prove the window the story asks for.

## Done when

- [ ] A Card read to build the filing prompt is written against that read, so an edit made while the
      model call is in flight is a Stale Target.
- [ ] That Card's edits are dropped and the hand-written text is byte for byte what was written.
- [ ] The Captures behind the dropped edits stay undrained, and the next run files them against the
      hand-written text.
- [ ] Every other Card in the same batch still gets its lines, and the run still commits. A Stale
      Target is not a stage failure.
- [ ] The Canary counts a Stale Target and the log names the path.
- [ ] A Card the batch's Captures do not name, so nothing read it for the prompt, still writes
      normally rather than failing for want of an earlier read.
- [ ] The Registry is protected the same way, and a lost row is still named in the log rather than
      crashing the run.
- [ ] The test drives the hand edit through the seam at the moment the pass is waiting on the model,
      not between `_extend_card`'s own read and its write.
