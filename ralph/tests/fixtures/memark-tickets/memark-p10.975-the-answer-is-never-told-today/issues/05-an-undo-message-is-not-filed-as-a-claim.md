# 05. An `undo` message is not filed as a claim

**Type:** task

**Status:** completed

**What to build:** after `undo`, the `undo` itself gets no `❌` and is never listed under
**Not filed**.

Spec: [../spec.md](../spec.md), structural finding 6.

## What happens today

`undoing.py` saves the `undo` as an ordinary Capture before it takes anything back. That order is
on purpose: a failed save must not let Telegram's retry revert a second commit. But nothing marks
that Capture as dealt with. The next filing run sends it to the model like any other message.

## Reproduction

`claude-cli` mode, `baseline`, Monday 28 Sep 2026 20:00, after a filing run on the first message.

    you   Remind me to order hand blender on 8th october
    bot   ✅ Loose Ends: order hand blender, on 08 Oct 2026. First reminder 5 days before.
    you   undo
    bot   Recorded: undo
          ❌ undo

The `undo` worked: the Task and the Date File line are gone. Then the filing run sent `undo` to
`claude-haiku-4-5`, which cut it into one claim piece with no edits. The evening Digest said:

    **Not filed**
    4. undo (you sent: undo)

`L368`: 1 of 1. It is code: nothing in filing passes over a Capture that `reads_as_undo`. The code
path is `undoing.py` from phase 10, ticket 06, so this is older than phase 10.97.

## What to change

- The `undo` Capture is marked as dealt with when the taking back runs, so filing never queues it.
- Its reply keeps the line that says what was taken back, and gains no mark.

## Done when

- [ ] A unit test sends a message, files it, sends `undo`, files again, and the `undo` Capture is
      not in the second run's queue.
- [ ] The Digest after that test lists nothing under **Not filed**.
- [ ] The unit suite, `mypy`, `ruff check` and `ruff format --check` are green.
