# 22 — The acknowledgement carries one mark per piece

**Type:** task

**Status:** completed

**Completed at:** 2026-09-18T17:48:22Z

**Blocked by:** 21

**Strand:** A, the filing path. How a person sees the fix.

**What to build:** a person who sent ten errands can read the reply against their own message
instead of against a list of landings, and can tell a lost claim from a claim the box will ask about
tomorrow.

## What happens today

`acknowledge.py` quotes the Capture on one line and hangs one `→` line per Card under it. A person
counting arrows under a ten part message has nothing to count them against. A dropped claim and a
held back claim are the same silence.

## What to change

One line per piece. `skip` pieces are never rendered. Three marks:

| Mark | Means | The line shows |
| ---- | ----- | -------------- |
| `✅` | The claim landed | The line the box wrote to the Card |
| `❌` | Nobody proposed anything for this claim | Your own raw words |
| `❓` | An edit was proposed and code did not write it | Your own raw words |

`❌` and `❓` are two marks for what is one silence today. `❌` says the box lost words. `❓` says the
box will ask tomorrow, which is the box working. A person who cannot tell them apart learns to
ignore both.

An `✅` line shows the Card's line, not the raw words, because checking the filing against what was
written is what the acknowledgement is for, per ADR 0024.

**A Capture that reached nothing now gets a reply.** `filled_in` is given no Capture that proposed
nothing today, on the grounds that a message saying nothing new is not worth editing. That is
exactly the failure here. Such a message is all `❌` and the reply says so.

**One open question does not park the whole message.** A Capture held back for a question still has
its other pieces land, and the reply shows them as `✅`.

## Do not make every message noisy

A message the box filed cleanly must read as it reads today. The change is in how the lines are
built, not in how many a clean message gets.

## Done when

- [ ] The reply renders one line per piece with the right mark.
- [ ] A `skip` piece is never rendered.
- [ ] A `✅` line shows the Card's line and a `❌` or `❓` line shows the person's raw words.
- [ ] A message that proposed nothing gets a reply that is all `❌`, instead of silence.
- [ ] A message held back for a question shows its other pieces as landed.
- [ ] A cleanly filed message reads as it does today.
- [ ] The unit suite is green.
- [ ] It commits.
