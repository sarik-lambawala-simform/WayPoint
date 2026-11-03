# 07 — The day's answering budget

**What to build:** a runaway day of questions cannot quietly run up a bill, and hitting the ceiling
never looks like the bot breaking.

The cap counts attempted calls, roughly forty a day, counted whether or not an answer came back. It is
a Vault Setting, per ADR 0031, which decided that settings have three homes and that a number I would
want to change without touching the box belongs in the Vault. It resets at local midnight.

On reaching it the bot says so once, plainly, and then goes quiet about it. Every later message still
gets its ordinary echo and is still filed as a Capture, so nothing looks broken. Saying it on every
message would be its own kind of noise.

It never switches quietly to a weaker model. A cheaper answer I did not ask for is a worse answer I
cannot tell apart from a good one, which is the whole reason ADR 0003 split the tiers by job and put
judgement on `claude-sonnet-5`.

**Blocked by:** 01 — A Question about a named subject is answered, and still saved.

**Status:** completed

**Completed at:** 2026-09-08T21:07:11Z

- [ ] The count is of attempted answering calls, incremented whether the call returned or raised.
- [ ] The number is read from Vault Settings, with a default of about forty when the setting is absent.
- [ ] On reaching the cap the reply says so once, in plain words.
- [ ] Later Questions the same day get their ordinary echo, are appended to the inbox, and make no
      answering call.
- [ ] Later Questions the same day do not repeat the cap message.
- [ ] The count is back to zero after local midnight, and answering works again.
- [ ] No path anywhere falls back to the cheap tier for answering.
