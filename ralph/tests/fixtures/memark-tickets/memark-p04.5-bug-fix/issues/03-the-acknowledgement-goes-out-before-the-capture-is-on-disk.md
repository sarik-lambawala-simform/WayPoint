# 03 — The acknowledgement goes out before the Capture is on disk

**Status:** completed

**Completed at:** 2026-09-03T11:50:27Z

**Owned by:** phase 2. `memark/handler.py`.

**Found by:** the phase 1 to 4 integration pass, scenario A2b.

## What happens

`handle_message` sends the reply first and appends the block second, because the reply's number is
what goes into `ack::` and the inbox is never rewritten. The code says so and says why. The
consequence is two things a person sees.

A write that fails has already been answered `Recorded: <your words>`. Nothing was recorded. The
update offset is correctly left where it was, so Telegram re-delivers, and that is what saves the
Capture. But between the failure and the re-delivery the chat says a thought is safe when it is not.

The re-delivery then sends a second reply. One Capture ends up with two `Recorded:` messages, and only
the second one's number is on the block, so the first is an acknowledgement no run will ever fill in
and no `ack::` field points at.

## Reproduction

```python
import shutil
from lib import Driver
from memark.transport import MessageKind

drive = Driver()
drive.reset("baseline")
drive.at("2026-08-27T09:14")
offset = drive.session.state / "telegram-offset"

# Make the write fail: a directory where today's inbox file has to go.
blocked = drive.session.vault / "inbox" / "2026" / "08" / "2026-08-27.md"
blocked.mkdir(parents=True)
drive.session.transport.queue(
    "the boiler is making that noise again", kind=MessageKind.TEXT, reply_to=None, arrived_as=""
)
held = tuple(drive.session.transport._inbound)
drive.session._start("message", drive.session._poll)
crashed = drive.session.wait()

assert crashed.error is not None  # IsADirectoryError out of the append
assert offset.exists() is False  # the offset was not moved on, which is right
assert len(drive.out()) == 1  # and the person has already been told "Recorded:"

# Telegram keeps an un-acknowledged update and sends it again.
shutil.rmtree(blocked)
drive.session.transport._inbound.extend(held)
drive.session._start("message", drive.session._poll)
drive.session.wait()

assert drive.inbox_for("2026-08-27").count("^") == 1  # one Capture, nothing duplicated
assert len(drive.out()) == 2  # two replies for it
```

`lib.py` is the integration pass's driver over `harness.session.HarnessSession`. Re-queueing the same
`Update` is the fake standing in for Telegram re-delivering, which is what the offset rule exists for.

## What should happen

`.scratch/memark-p02-vault-and-capture/issues/02-text-capture-lands-and-is-quoted-back.md` states the
order:

> **What to build:** I send a text message and it is permanently recorded, then quoted straight back
> to me.

`memark/acknowledge.py` states the count:

> A Capture gets exactly one reply, per ADR 0006 and ADR 0040.

And `memark/handler.py` states the reason a message that says nothing is refused, which the inverse of
also holds:

> Anything that is not text is answered rather than dropped. A message that vanishes without a word is
> the failure this system exists to refuse, and silence here would look exactly like a Capture that
> landed.

A reply saying `Recorded:` about a Capture that is not on disk is the same failure read the other way:
it looks exactly like a Capture that landed.

`harness/README.md` also describes the rule as the stronger one it is not:

> Sending a message drives `bot.poll_once`, which includes the update offset rule that a Capture is
> acknowledged only once it is on disk.

That is true of the Telegram offset and false of the reply in the chat.

## Actual behaviour

The Capture is never lost and never duplicated, which is the important half. What a person sees is a
`Recorded:` reply for a Capture that failed to write, and then two `Recorded:` replies for the one
Capture that eventually landed, the first of which nothing will ever fill in.

Any fix has to keep `ack::` reachable, which is the reason the order is what it is: the block needs a
message number and the inbox is append-only. Writing the block first and then adding `ack::` through
the same one-field path `mark_filed` uses is one way; there may be others.

## Done when

- [ ] A Capture is on disk before anything about it is sent to the chat.
- [ ] A write that fails sends no `Recorded:` reply.
- [ ] An update re-delivered after a failed write ends in one block and one reply in total.
- [ ] The block still carries `ack::` holding the number of the reply that was sent about it.
- [ ] A filing run still edits that reply in place rather than sending a second message, so scenario
      A3 of the integration pass is unchanged.
- [ ] The inbox is still append-only, per ADR 0001: no path added here rewrites a block's words.
- [ ] The update offset still advances only after the write, so a crash still re-delivers.
- [ ] A Capture that lands on a past day still names the day in its reply, per ADR 0030.
- [ ] `/start` and an unsupported message still write nothing and still reply once.
- [ ] A test at the message handler seam covering the failed write, and one covering the
      re-delivery after it.
