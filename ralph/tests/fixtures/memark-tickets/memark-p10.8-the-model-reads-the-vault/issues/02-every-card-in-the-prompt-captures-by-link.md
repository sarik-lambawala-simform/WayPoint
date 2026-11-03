# 02 — Every Card in the prompt, Captures pulled by `from::` link

**What to build:** code assembles the whole Vault into one call and the model reads it.

Decided in
[ticket 07](../../memark-p09.6-decisions-only-you-can-make/issues/07-the-question-that-counts-the-whole-vault.md),
rules 2 and 3, and written down in ADR 0043. Do not re-argue it.

**All Cards, always.** Not the named ones, not the ranked ones. Every Card in the Vault, every time.
A few hundred Cards is about 600 KB after five years, near 150,000 tokens, which is 15% of
`claude-sonnet-5`'s 1,000,000 token window at about 30 cents a question. `memark/answering.py:201`
already runs on that tier. Cards grow near 120 KB a year, so filling the window takes about 30 years.

**One call, no tool loop.** Code assembles the prompt and the model answers once. A grep loop cannot
fix the meaning gap, because the model must guess the word before it greps: `pasta`, maybe `pizza`,
never `that place on Linking Road`. It is also many round trips while a person waits in Telegram, and
the box has no tool loop anywhere, so it would be a new class of machinery bought for a picker that
was just deleted. ADR 0002, deterministic code selects what the model sees, is satisfied rather than
bent: code still selects, and what it selects is everything.

**Captures come in by link.** Captures are the part that never stops growing, near 2.7 MB against
600 KB of Cards after five years at ten messages a day. A Card is the distilled Capture, so reading
every Card already sees every fact worth keeping. A Capture is pulled only when a Card line the
answer used points at it, and code follows the `from::` link. That is not a picker: the link is
already written in the file and there is nothing to guess wrong.

**Cost is paid, not capped.** Near 30 cents a question is about $90 a month at ten a day before
caching. A cap was rejected because it is a second code path that fires on the worst day and falls
back to the thing this phase deletes. The lever if the bill hurts is reading fewer Captures, not
guessing again. **The daily cap of roughly forty answered messages is already deleted** and nothing
here brings it back.

**Caching is out of this phase.** It only pays behind a stable-first ordering with a breakpoint, and
Cards get edited in the middle, so the ordering is real work nobody has designed. Build the read and
get a bill first.

**The reopen condition, written down rather than built:** if the read ever passes about half the
window, ADR 0043 is reopened.

**Blocked by:** 01 — Word matching leaves the Lookup.

**Status:** completed

**Completed at:** 2026-09-14T17:14:12Z

- [x] Every Card in the Vault goes into the answering prompt, on every Lookup.
- [x] It is one model call. No tool loop and no second round trip.
- [x] A Capture is pulled in when a Card line the answer used carries a `from::` link to it.
- [x] A Capture behind a link is pulled once, not twice.
- [x] No cap on the number of answered messages a day.
- [x] A Vault of several hundred Cards is asserted whole in the prompt, with nothing dropped.
- [x] A question sharing no word with its answer reaches the right Card.
