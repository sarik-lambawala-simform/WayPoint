# 26 — An empty forward window is not widened

**Type:** task

**Status:** completed

**Completed at:** 2026-09-18T19:06:52Z

**Blocked by:** 24

**Strand:** B, the question path. Parallel with 25 and 27.

**What to build:** a person who asks about a quiet week ahead is told the week is quiet, instead of
being told about the 30th as though it were next week.

## What happens today

The handler widens any empty window, whichever side of today it falls. Forward that is wrong. You
asked about next week, so next week is what you are told about, and a thing on the 30th named under
a question about next week reads like next week to anybody not reading the footnote.

ADR 0028's rule that finding nothing is an absolute is the same rule read forwards.

## What to change

`widened` applies to the past and to nothing else. The handler is where the widening happens, so the
direction rule goes in there. `days_around`'s comment changes with it: the comment saying a forward
window is not clipped stays true and its reason changes, because a forward day is no longer empty by
construction.

## Done when

- [ ] An empty forward window is answered as empty and is not widened.
- [ ] An empty past window is widened exactly as it is today.
- [ ] `days_around`'s comment says why a forward window is not clipped, under the new reason.
- [ ] The code cites ticket 24's ADR.
- [ ] The unit suite is green.
- [ ] It commits.
