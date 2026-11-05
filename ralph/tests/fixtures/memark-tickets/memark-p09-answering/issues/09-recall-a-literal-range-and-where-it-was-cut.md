# 09 — Recall: a literal range, and where it was cut

**What to build:** asking about a stretch of days gets an answer, and I am told plainly where the
answer was cut.

The material is capped rather than the range, per ADR 0033, which decided that a day is recalled from
its Captures and declined a stored per-day index of search terms. A range is ranked by the same word
matching as the Lookup and cut at 40 Capture blocks. The 40 is a constant that can move.

Where the cut bit, the sources line says so: read 40 of the 180 notes in that window. Silent
truncation reads exactly like completeness, which is the one thing an answer must never do when it is
incomplete.

**Blocked by:** 03 — Word matching finds the Card when nothing is named; 08 — Recall: one literal day,
read whole.

**Status:** completed

**Completed at:** 2026-09-08T21:41:32Z

- [ ] A literal range narrower than the cap is answered from every Capture in it, with no cut stated.
- [ ] A literal range wide enough to pass 40 Capture blocks reads 40 of them, ranked by the same word
      matching the Lookup uses.
- [ ] In that case the sources line states the cut, naming both the number read and the number in the
      window.
- [ ] The 40 is one named constant with the reason beside it, not a number spread across the code.
- [ ] The range is still parsed by code, with no model call choosing the files.
