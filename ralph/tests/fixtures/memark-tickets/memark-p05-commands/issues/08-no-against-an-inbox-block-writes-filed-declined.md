# 08 — `no N` against an inbox block writes `filed:: declined`

**What to build:** saying no to a question about one of your own Captures leaves an honest mark, not a
false one.

A footer target is either a line in a file or a block in the inbox, and `no N` branches on which. The
inbox case is the rejected reword: the Digest asked whether it should write something out of a Capture
and you said no. Writing the ordinary filed marker there would have the inbox claim a Capture was filed
into a Card when nothing was written anywhere, so the block gets `filed:: declined` instead.

Filing skips the block either way, so it leaves the queue and stops being asked about. The journal and
the Lookup still read it, because you did say the thing, and ADR 0027, which writes the journal and
never reads it back into a decision, and ADR 0028, which finds Cards by matching words, both work off
the Capture rather than off what was made of it.

**Blocked by:** 07 — `yes N` and `no N` on a Proposed Date.

**Status:** completed

**Completed at:** 2026-09-04T13:14:24Z

- [ ] `no N` against an inbox block writes `filed:: declined` on that block and writes nothing to any
      Card.
- [ ] Filing skips a declined block and never asks about it again.
- [ ] The declined block's words are unchanged and are still found by the Lookup.
- [ ] `no N` against a line in a file still writes an `x` line, so the branch did not change the other
      case.
