# 04 — A named match always survives, and a miss is stated first

**What to build:** the two promises that make a confident answer mean something. Ranking never buries
a subject I named, and where I named several subjects the reply tells me which ones it has nothing on
before it answers anything.

Ranking runs when nothing was named, and as an addition when something was, and it never suppresses a
named match. That ordering is from ADR 0028, which decided that conversation finds Cards by matching
words. A message that names Priya and happens to share distinctive words with a Card about the car
gets both, and Priya's Card is cited whatever BM25 thought of it.

Where only some named subjects match, the answer states what it could not find before it says anything
else. A confident answer meaning "it actually knew" has to hold for partial knowledge too. The miss
goes at the top. The sources line goes at the bottom.

This is the ticket where user story 75 lands: asking about five people and being told about the three
it has never heard of, rather than getting a smooth answer about two and silence about the rest.

**Blocked by:** 02 — An alias resolves, and an ambiguous name is asked about; 03 — Word matching finds
the Card when nothing is named.

**Status:** completed

**Completed at:** 2026-09-08T20:15:02Z

- [ ] A message that both names a subject and shares distinctive words with a different Card cites the
      named Card as well as the ranked one.
- [ ] A Question naming five subjects of which two are in the Registry names the three it could not
      find, and names them before it answers.
- [ ] The sources line still names only what was actually read, and stays at the bottom.
- [ ] The miss line is written by code from what the resolve returned, not left to the model to notice.
