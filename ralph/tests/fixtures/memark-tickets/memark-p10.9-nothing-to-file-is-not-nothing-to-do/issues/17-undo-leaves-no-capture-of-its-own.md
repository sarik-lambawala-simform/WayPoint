# 17 — `undo` leaves no Capture of its own

**Type:** defect

**Status:** completed

**Completed at:** 2026-09-18T15:32:19Z

**What to build:** `undo` gets the `ack::` every other Capture gets, so the reply it was answered
with can still be edited in place.

**Reproduces:** 5 of 5 on `claude-haiku-4-5`, on the third probe written for it. The same result in
all five runs, so this is code rather than a model, and no comparison run on `claude-opus-5` was
made. A stronger model cannot change a path that never asks one.

**The title of this ticket is wrong and is kept for the link.** `undo` does open a Capture of its
own. What it does not get is that Capture's `ack::`. See below.

## What happens

`L104` sends two messages:

```
sorted the plumber out at last
undo
```

The row went red on `every_message_is_its_own_capture`, which is in `COMMON` and so runs on every
row of every phase:

> every message is its own Capture: no block of its own: 'undo'

The reply was right about what it did:

> Taken back: 1 change. Caught before anything reached a file, so nothing moved.

**The block is there.** This is what the inbox holds after those two messages, in all five runs:

```
- 13:46 sorted the plumber out at last
  · ack:: 1001
  · filed:: 2026-08-27 ^ae0d
- 13:46 undo ^93f9
```

Every other Capture in this Vault carries `· ack:: NNNN`, and its block id rides on the last field
line. The `undo` block has no field line at all, so its id renders on the opening line instead. That
is what makes the hard check red: the check compares the opener against the message whole, and
`undo ^93f9` is not `undo`.

So the finding is real and its first description was not. Nothing is missing from the record of what
was typed. What is missing is the `ack::`.

## Why this is worth a ticket

`ack::` is the number of the reply the Capture was answered with. `memark/handler.py:580` says what
it is for:

> The number is only known once the reply has been sent, so `ack::` arrives one step after the
> block, as the one field line `mark_acknowledged` writes. It is what lets a later run, in a
> different process, edit this same message in place rather than send a new one.

The same docstring says what it costs when the write fails, and it is the sentence the log line
carries:

> ^%s was replied to with message %s, which could not be written to its block, so no run can fill
> that reply in

So the Capture is filed and reaches a Digest, per ADR 0006, whose floor is that what was typed is on
disk before anything is done with it. That floor holds. What is lost is the thread between the block
and its reply, and `undo` is the one message where that thread is worth most: it is what somebody
types when something has gone wrong, which is exactly the moment the history is read.

## Why, and it is not the arity path

**Established, and it is not where this ticket first looked.** `undo` is not handled before the
write. `memark/handler.py:302` recognises it and `memark/handler.py:364` acts on it *after*
`append_capture` has run, and the comment beside it says so: "It is recognised here and acted on
below, after its own words are on disk."

The `ack::` is lost further down, and the cause is that `undo` shortens the file it is writing into.

1. `memark/handler.py:347`, `append_capture`, writes the `undo` block and returns a `Landed`
   carrying its `line_number`.
2. `memark/handler.py:369` calls `undo(writer, just_landed=landed)`.
3. `memark/undoing.py`, `_withdraw`, calls `withdraw_fields` on the **previous** block, which
   deletes its `pending::` and `target::` lines from the same inbox file. The file is now two lines
   shorter and every line after them has moved up.
4. `memark/handler.py:370` calls `_acknowledge`, which calls `acknowledge_capture` at
   `memark/vault/apply.py:425`. It locates the block by the `line_number` recorded in step 1:

   ```python
   mark_acknowledged(
       state.text or "",
       line_number=landed.line_number,
       block_id=landed.block_id,
       value=str(message_id),
   )
   ```

5. `memark/vault/inbox.py`, `_lines_holding`, raises:

   ```python
   if not 1 <= line_number <= len(lines):
       raise ValueError(
           f"line {line_number} is past the end of the file, so `^{block_id}` "
           f"cannot be marked `{wanting}`"
       )
   ```

6. `memark/handler.py:598` catches it with a bare `except Exception` and logs it. Nothing is said to
   the person and the run is green.

**It was confirmed from both sides.** Driven in `auto` mode, where the Intent Read proposes nothing,
there is no Pending Instruction to withdraw, no line is deleted, and the block comes out
`- 13:46 undo` with `· ack:: 1003 ^c876` under it. Driven live, where the first message does leave a
Pending Instruction, the withdrawal happens and the `ack::` is gone. The undo path costs no model
call, so this half was checked for free.

So the defect fires only where the `undo` had something to take back, which is every `undo` worth
sending.

## What to change

The `undo` block has to be found again after the file it sits in has shrunk.

**The `ack::` cannot simply move earlier.** The text of the reply is the undo's own result, so the
reply cannot be sent before the undo runs, and `ack::` is the number of that reply. The order in
`handler.py` is right and the stale `line_number` is the thing to fix.

The shape is left to whoever takes this, and the two obvious ones are:

- `undo` returns where the block ended up, or the handler re-reads it, so `_acknowledge` is handed a
  fresh `Landed`.
- `acknowledge_capture` locates the block by its `block_id`, which does not move, rather than by a
  `line_number`, which does. This is the wider fix and it touches every other caller of `_add_field`,
  so it wants its own thought about blast radius.

Whichever is taken, the bare `except Exception` at `memark/handler.py:598` is what let this sit
unnoticed. It should stay, because a failure there must not cost the Capture, but the run should not
be green and silent about it. `docs/stack/tests-and-logging.md` is the place to check what a Health
Canary field would look like for it.

## Done when

- [x] The rate is measured, with `python -m harness.live.repeat L104:capture --runs 5`. It is 5 of 5.
- [x] The `undo` block carries its own `ack::` after an undo that withdrew something.
- [x] The undo still costs no model call, which `L104` already asserts.
- [x] `L104` passes `every_message_is_its_own_capture`.
- [x] A test covers the ordering rather than the word: a Capture whose file shrank between the
      append and the acknowledgement is still acknowledged. The cause is the withdrawal, not the
      arity path, so a test over the no-argument verbs would pass while the defect stood.
- [x] A failed acknowledgement is visible in a run's own output rather than only in the log.

## Why this is `ready-for-agent`

It was `ready-for-human` because the first thing it asked for was a rate. The rate is 5 of 5, the
cause is pinned to a line, and what must be true at the end is not a judgement call: the `undo`
block carries an `ack::`. The two fix shapes above differ in blast radius and not in behaviour, so
an agent can take the narrow one and the acceptance criteria hold either way.

## How the rate was measured, and the probe that had to be fixed twice

`python -m harness.live.repeat L104:capture --runs 5`, on the filing tier forced onto
`claude-haiku-4-5` per ADR 0003, which chose hosted models over local inference and put filing on
the cheap tier.

**This is the second worked example in this phase of reading the detail rather than the tally.** The
first is ticket 18's probe, which counted the `## Notes` heading on Card bodies as window material.

- **The first probe scored 0 of 5 and the finding looked killed.** It asked whether `undo` was
  *inside* the words of any block. `_the_words_of` hands back `undo ^93f9` for a block with no field
  lines, and `undo` is inside that string. It was reading the second of the two readings
  `every_message_is_its_own_capture` makes, and the run that found this went red on the first.
- **The second probe scored 5 of 5 and was also wrong.** It compared the opener whole, the way the
  check does. It went bad while the block plainly existed, and its own detail line printed the block
  it claimed was missing. A rate that says `bad` for a reason the ticket does not mean is worth no
  more than one that says `good`.
- **The third probe asks whether that block carries `ack::`.** That is the defect, and it is what
  makes the check red. 5 of 5.

The first two are written into the probe's docstring in `harness/live/repeat.py`, so nobody rewrites
either of them back.

## What was built

**The block is found by its id and not by where it landed.** `acknowledge_capture` now looks the
block up with `inbox_block_by_id`, the way `withdraw_fields` already did, so the line number
recorded before the reply went out is no longer what the write trusts. That is the narrow shape of
the two the ticket offered: `_add_field` is untouched and every other caller keeps the line number,
which is still true for them because every other path only ever makes the file longer.

A block the file no longer holds raises instead of marking whatever sits at that line. The handler
still catches it, still keeps the Capture, and still logs it. What changed is that it no longer ends
there.

**The swallowed failure now has a number.** `_fill_in_acknowledgements` already found the other end
of this: a Capture it filed, with lines to report, whose block carries no `ack::`. It logged that at
INFO and counted it nowhere, which is how the defect sat through three phases. It is now
`acknowledgements_missing` on the `FilingReport` and one Health Canary line, `N Captures had no
reply to fill in.`, shown only when it is not zero, per ADR 0036. The handler's bare `except` stays,
because a failure there must not cost the Capture.

**Tests.** `test_apply.py` covers the ordering and not the word: two Captures appended, the first
one's fields withdrawn so the file shrinks, and the second still acknowledged. A second test asserts
a block the file does not hold is named rather than marked. `test_undo.py` asserts the `undo` block
carries the number of its own reply. `test_filing_run.py` and `test_canary.py` assert the count and
the line.

## The rate after the fix

`python -m harness.live.repeat L104:capture --runs 5` on `claude-haiku-4-5`: **0 of 5**, down from
5 of 5. `python -m harness.live --only L104` passes, `every_message_is_its_own_capture` reads `all 2
messages opened a block of their own, whole`, and `no call but the reading` still reads `1 Intent
Reads and no other call`, so the undo still costs nothing.
