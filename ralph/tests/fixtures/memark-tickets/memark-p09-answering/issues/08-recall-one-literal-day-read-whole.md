# 08 — Recall: one literal day, read whole

**What to build:** "what was going on on the 12th" is answered from what I actually sent that day.

A day's Captures rarely contain the words the question uses, so no amount of better ranking turns a
date into a search term. Recall is a second function beside the Lookup, per ADR 0033, which decided
that a day is recalled from its Captures. It takes a date or a pair of dates and returns what the Vault
holds for that window. It matches nothing and ranks nothing on its own. The Lookup answers what and
Recall answers when, and neither is a mode of the other.

Code decides which files Recall reads, so ADR 0002 holds, which decided that deterministic code
selects what the model sees. A date written plainly in a message is parsed by code, the same way a
typed Command is. Anything looser is the Intent Read's job and switches on in phase 10. Loose windows
and named occasions phrased vaguely are explicitly not in this phase.

One named day is read whole. The day is the question, so there is nothing to rank by. The cap is on
material and not on range, and that comes in ticket 09 for ranges.

An empty day is answered from the absence of an inbox file, and no Journal Entry is ever read for it.
A file is written only when something arrives, so no file is the whole of the evidence that I sent
nothing. The reply says I sent nothing that day, which is a different sentence from "I found nothing",
and the difference is the whole point.

This ticket covers only inbox Captures. Date File lines in the window are ticket 10.

**Blocked by:** 01 — A Question about a named subject is answered, and still saved.

**Status:** completed

**Completed at:** 2026-09-08T21:24:40Z

- [ ] A message carrying a literal date is answered from that day's inbox Captures, with every Capture
      from that day cited.
- [ ] No model call is in the path that chooses which files to read.
- [ ] A literal range is parsed by code too, even though its material cap is ticket 09.
- [ ] A day with no inbox file makes the reply say I sent nothing that day.
- [ ] No Journal Entry is read for any Recall answer.
- [ ] Recall itself does no word matching and no ranking for a single named day.
