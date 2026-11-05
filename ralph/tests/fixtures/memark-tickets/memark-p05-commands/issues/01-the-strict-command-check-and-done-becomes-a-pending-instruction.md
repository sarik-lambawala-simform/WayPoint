# 01 — The strict Command check, and `done N` becomes a Pending Instruction

**What to build:** the Digest's numbers finally mean something. Send `done 2` and the reply says the
Task will close, with no model call anywhere on the path.

The check is pure code and it runs first, before the message is saved and before anything loose reads
it. That order is what makes the shortcut work on the day the model API is down, which is the day you
most need to be able to say "done".

A typed Command is a Command only if every part of it resolves, per ADR 0041, which moved the exact
match rule from application to classification so a near miss is read for what it meant rather than
claimed and refused. Five things must hold: the verb is one of the nine; the arity matches that verb;
the number is an item in the footer of the Digest the message concerns; that item is the right kind for
the verb; and a name matches exactly one Registry row. Code has all five, because the footer is written
by code per ADR 0021, which put the Digest's numbering in code so resolving a number is a lookup, and
because the Registry is a file.

The footer records a number, a path and a line and does not record what kind of item it was. The kind
is therefore read off the target line itself: an open Task line in a Card, a proposal in a Date File, a
block in the inbox. Nothing new is stored to make this work, because a second record of the kind is a
second thing that could disagree with the line.

A message that fails any part was never a Command, and it is not refused. It goes down the path an
ordinary sentence goes down, which until phase 10 builds the Intent Read means it is saved and echoed,
exactly as before Commands existed. Nothing is claimed and then dropped.

What the bot writes is the inbox and never a Card, per ADR 0035, which kept the Vault's single writer
so the Run Lock, ADR 0009's expected-state check and ADR 0004's one commit per run all stand. The
checked Command is appended as a Pending Instruction: a field on the raw block carrying `pending::` for
the action and `target::` for the line it acts on, in the `key:: value` notation the inbox already
uses. It carries no `from::`, because the block it hangs off is the block it came from. It is stripped
before any reader sees the block's text. The reply therefore says "will close" rather than "closed".

`done` naming a Task that is already closed writes nothing and replies that it was already closed,
because the first date is the true one, per ADR 0034, which made closing terminal. A `done` naming a
Pinned Task succeeds: ADR 0005 protects a human claim from the model's proposed edits, and a Command is
not one.

**Blocked by:** None. It can start immediately.

**Status:** completed

**Completed at:** 2026-09-04T10:19:21Z

- [ ] `done 2` where item 2 of the resolved Digest is an open Task is taken as a Command, with no model
      call on the path.
- [ ] `done 2` where item 2 is a question rather than a Task is not a Command.
- [ ] `skip 3` where the footer has two items is not a Command.
- [ ] `undo 4` is not a Command, because `undo` takes no number.
- [ ] `done 2 chapters today` is not a Command, because the tail is not a bare number.
- [ ] A message that superficially resembles a Command is still recorded as a Capture, and nothing is
      refused out loud in any of the cases above.
- [ ] A recognised Command leaves no Vault file written by the bot except the inbox block's own field
      line, and no Card is touched at receipt.
- [ ] The Pending Instruction is a field on the raw block, carries `pending::` and `target::`, carries
      no `from::`, and is stripped before any reader sees the block's text.
- [ ] The reply names the change and says "will".
- [ ] `done` on an already closed Task writes nothing and the reply says it was already closed.
- [ ] `done` on a Task carrying `!` is accepted.
- [ ] `/start` still answers with the fixed greeting, writes no inbox file and makes no model call.
