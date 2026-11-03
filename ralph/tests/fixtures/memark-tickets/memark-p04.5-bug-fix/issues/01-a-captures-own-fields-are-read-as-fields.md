# 01 — A Capture's own `::` text is read as a field on its block

**Status:** completed

**Completed at:** 2026-09-03T11:18:04Z

**Owned by:** phase 2. `memark/vault/inbox.py` writes the block and `memark/vault/grammar.py` reads it.

**Found by:** the phase 1 to 4 integration pass, scenario B21.

## What happens

`render_capture` puts a message's words on the block's bullet line without escaping anything. The
inbox grammar then reads a `· key:: value` inside those words as a field on that block. Two Captures
a person could plausibly send do real damage.

A Capture whose words hold `· filed:: parked` is born parked. `unfiled_blocks` reads `is_filed` off
the block, so the Capture never enters the filing queue, is never sent to a model, is never asked
about by the Digest, and never parks by the rule that is supposed to park it. It is simply gone from
filing, and nothing counts it.

A Capture whose words hold `· shown:: 99 careful` takes every filing run down. `QueuedBlock.times_shown`
raises a `ParseError` on the value, `park_blocks_at_the_bound` raises before the first model call, and
`run.py` catches it as a failed Filing Run. Nothing in the whole inbox is filed again, on any run,
until the file is edited by hand. One message stops filing for the entire Vault.

## Reproduction

```python
from lib import Driver
from memark.vault.files import parse_inbox

drive = Driver()

# The block is born parked.
drive.reset("baseline")
drive.at("2026-08-27T09:14")
drive.send("· filed:: parked")
(block,) = parse_inbox(drive.inbox_for("2026-08-27")).walk()
assert block.is_filed is True  # it is not filed. Nothing filed it.
drive.at("2026-08-27T12:00")
drive.run()
assert drive.calls() == []  # never offered to a model

# Every filing run from now on fails.
drive.reset("baseline")
drive.at("2026-08-27T09:14")
drive.send("· shown:: 99 careful")
drive.at("2026-08-27T12:00")
job = drive.run()
assert "the filing run failed" in str(job.notes)
assert drive.calls() == []
```

`lib.py` is the integration pass's driver over `harness.session.HarnessSession`; the same thing
reproduces by sending either message to the bot and waiting for a filing slot.

## What should happen

`.scratch/memark-p01-card-grammar/spec.md`, on the grammar:

> The double colon is what makes a field findable. `from:` with one colon occurs in ordinary writing
> and inside quoted Captures. `from::` does not.

That is the assumption the shape rests on, and it is wrong for a person who types `::`. The same spec
states the rule this breaks:

> The parser has no quiet fallback. A line it cannot classify fails the whole file, because a partial
> parse is exactly what makes an orphan count too low and a `!` invisible.

`.scratch/memark-p02-vault-and-capture/issues/02-text-capture-lands-and-is-quoted-back.md` asks for the
case and checks only half of it:

> - [ ] A message containing markdown, brackets and a `::` is stored verbatim and the reply is not
>       mangled.

Both of those hold. What does not hold is that the block stays a Capture afterwards. A field the system
wrote and a `::` a person typed have to be tellable apart, so that no message can take a Capture out of
the filing queue or stop filing for the whole Vault.

## Actual behaviour

- `· filed:: parked` in a message: the block reads as filed, is never queued, never asked about, never
  counted anywhere.
- `· shown:: 99 careful` in a message: every filing run raises before its first call and is counted as
  a failed Filing Run. The Vault stops filing.
- `note to self:: filed:: 2026-01-01` with no separator in front of it: read as prose, which is
  correct. The separator is what makes the difference.

## Done when

- [ ] A Capture whose words hold `· filed:: 2026-01-01` is in the filing queue and is offered to a
      model.
- [ ] A Capture whose words hold `· filed:: parked` is in the filing queue. Only
      `park_blocks_at_the_bound` can park a block.
- [ ] A Capture whose words hold `· shown:: 99 careful` does not fail the filing run, and what
      `times_shown` reads is the block's own ask count.
- [ ] A Capture whose words hold `· ack:: 4907` does not change which message a filing run edits.
- [ ] The words come back out of every one of those blocks byte for byte, so `capture_words` and the
      acknowledgement's quote-back are unchanged.
- [ ] `filed::`, `shown::`, `ack::` and `received::` written by the system are still read as fields,
      and `mark_filed` and `count_block_shown` still find them.
- [ ] A message holding `note to self:: filed:: 2026-01-01`, with no separator in front of the key,
      is still read as prose, which it is today.
- [ ] The linter's `Unrecognised inbox field keys` count is unchanged by any of the above.
- [ ] `lint` is clean over a Vault holding all of them.
- [ ] A checked-in fixture holds each case, per `docs/stack/tests-and-logging.md`: every bug in a
      line grammar gets a fixture line first.
- [ ] A test at the message handler seam and one at the scheduled run seam, because the write is at
      one and the queue is at the other.
