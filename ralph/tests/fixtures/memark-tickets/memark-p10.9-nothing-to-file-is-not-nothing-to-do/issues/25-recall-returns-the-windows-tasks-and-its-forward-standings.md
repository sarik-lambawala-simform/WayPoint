# 25 — Recall returns the window's Tasks and its forward standings

**Type:** task

**Status:** completed

**Completed at:** 2026-09-18T18:51:16Z

**Blocked by:** 24

**Strand:** B, the question path. Parallel with 26 and 27.

**What to build:** `next week kya kya hai` comes back with the dated line on the 27th and the Tasks
still open, instead of nothing coming up.

## What happens today

`recall.recall` returns `Found(recalled, dated)`. Nothing in `recall.py` imports `tasks`, so a
question about the days ahead reads the inbox, the inbox holds only what has already been sent, and
the box says there is nothing. Meanwhile the Vault holds a dated line for the 27th and an open Task
from last week.

## What to change

**`Found` gains the Tasks and `recall.recall` gains the rule for when they travel.** Every open Task
when the window touches today or later. No Task when the window is wholly in the past.
`tasks.open_tasks` is the reader and it already exists, so nothing new walks the Cards.

**The Notice Schedule is not read.** A forward Recall returns every dated line the window covers,
whatever its `notice::` says. This is ticket 24's exception and the code cites it.

**Forward, the standings decide what comes back.** `DateStanding` already carries the four cases, so
this is a rule over material code already has. `REJECTED` stays out. `PROPOSED` comes back marked
unconfirmed. `HANDLED` comes back marked dealt with. A past window returns all four as it does
today.

**Code picks the window and nothing else.** `next one year` can cover fifty dated lines where five
are about Mohan's work. Code does not drop the other forty five. Every line the window covers goes
into the prompt and the model answers the question that was asked. A subject filter in code is a
picker, and a picker that drops the right line leaves an answer that reads perfectly well.

## The seam

`recall.recall` over a fixture Vault, the way `tests/test_recall.py` and
`tests/test_loose_windows.py` drive it. Vault fixtures are checked-in directory trees.

## Done when

- [ ] A forward window returns the dated lines inside it.
- [ ] A forward window returns the open Tasks.
- [ ] A past window returns no Task.
- [ ] A forward window returns no `REJECTED` line.
- [ ] A forward window returns a `PROPOSED` line marked unconfirmed.
- [ ] A forward window returns a `HANDLED` line marked dealt with.
- [ ] A past window returns all four standings as it does today.
- [ ] A dated line whose Notice Schedule names no day in the window is still returned.
- [ ] A year wide window sends every dated line it covers, with no subject filter in code.
- [ ] The code cites ticket 24's ADR.
- [ ] The unit suite is green.
- [ ] It commits.
