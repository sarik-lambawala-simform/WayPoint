# 02 — A Capture ending a line in `^` plus four hex characters makes its inbox file unparseable

**Blocked by:** 01 — A Capture's own `::` text is read as a field on its block

**Status:** completed

**Completed at:** 2026-09-03T11:38:22Z

**Owned by:** phase 2. `memark/vault/inbox.py` writes the block and `memark/vault/files.py` reads it.

**Found by:** the phase 1 to 4 integration pass, scenario B22.

## What happens

A block id is `^` and four hex characters at the very end of a block's last line. A message whose own
words end a line that way puts a second id inside the block, and the grammar refuses the line: `a
block id must be the last part of a line`. That refusal is correct and the file is now broken.

Everything downstream of the inbox stops for that file, and for every file the same pass reads:

- `parse_inbox` raises, so `unfiled_blocks` raises, so `_file` raises, so `run.py` counts a failed
  Filing Run. Nothing anywhere in the inbox is filed again until the file is edited by hand.
- `lint` fails the Vault.
- `_what_could_not_be_filed` catches its own scan failure, so the Digest asks about nothing at all
  that evening and counts nothing.

Four hex characters is a small target. `^dead`, `^beef`, `^cafe`, `^face`, `^fade`, `^1234`, and a
Capture that ends a line in a short commit hash all hit it.

## Reproduction

```python
from lib import Driver

drive = Driver()
drive.reset("baseline")
drive.at("2026-08-27T09:14")
drive.send("two lines\nand this one ends ^beef")

assert drive.lint()["ok"] is False  # inbox/2026/08/2026-08-27.md:1
drive.at("2026-08-27T12:00")
job = drive.run()
assert "the filing run failed" in str(job.notes)
assert drive.calls() == []  # no batch was ever built
```

A markdown fence works as well, because the id only has to end a line:

```python
drive.send("code:\n```\n^cafe\n```")
```

`lib.py` is the integration pass's driver over `harness.session.HarnessSession`; the same thing
reproduces by sending either message to the bot.

## What should happen

`.scratch/memark-p01-card-grammar/spec.md` puts the whole safety story on the file staying readable:

> Every safety promise in Memark is arithmetic over the text of a file. "No Capture is orphaned" is a
> count of `from::` links. [...] None of that is checkable unless a line has one fixed shape, and
> unless a parser that meets a line it does not understand stops instead of returning the half it
> understood.

`.scratch/memark-p02-vault-and-capture/spec.md`, on the inbox block:

> The whole message is appended as one block and is never cut into pieces.

A person's words are the one thing in the Vault nobody controls, and they are written into a file the
system has to keep reading. Writing them so that the grammar cannot mistake them for structure is the
write path's job. Today a Capture can corrupt its own file and stop filing for the whole Vault.

## Actual behaviour

The block is stored verbatim, which is right, and the file is then unreadable:

```
- 09:14 two lines
    and this one ends ^beef
  · ack:: 1001 ^330e
```

`lint` reports `inbox/2026/08/2026-08-27.md:1: a block id must be the last part of a line`. Every
filing run from then on fails at `unfiled_blocks`, and the Digest asks about nothing.

## Done when

- [ ] A Capture whose words end a line in ` ^beef` leaves its inbox file readable by `parse_inbox`.
- [ ] That Capture is in the filing queue and the filing run does not fail.
- [ ] The same holds for a `^cafe` alone on a line inside a fenced code block, and for a message whose
      whole text is ` ^dead`.
- [ ] `lint` is clean over a Vault holding all of them.
- [ ] The words come back byte for byte and the acknowledgement quotes them unchanged.
- [ ] `block_ids` counts a block's own id and not one inside the words, so the commit message's
      Capture count is right.
- [ ] A block's real id is still the last part of its last line, and `mark_filed` and
      `count_block_shown` still find it.
- [ ] A Card line's own block id is unaffected: a Task still carries `^b91d` and the grammar still
      fails an id that is not last.
- [ ] A checked-in fixture holds each case.
- [ ] A test at the message handler seam and one at the scheduled run seam.
