# 05 — Finding nothing is said as a fact

**What to build:** the failure the spec cares about most, closed. A message that shares no meaningful
word with anything in the Vault makes the bot say it does not know what I am referring to, and ask.
It does not write an answer from nothing.

Finding nothing is an absolute and not a threshold. There is deliberately no confidence number,
because a number like that cannot be asserted through the single test seam against a Vault that does
not exist yet. Either the Lookup came back with something or it came back empty.

An answer that found nothing carries no sources line and says so in words. A sources line on an empty
answer is worse than no line, because it reads as evidence.

The Capture is still appended. Asking a question the Vault knows nothing about must never cost the
thought behind it.

**Blocked by:** 03 — Word matching finds the Card when nothing is named.

**Status:** completed

**Completed at:** 2026-09-08T20:29:53Z

- [ ] A message sharing no meaningful word with any Card or Capture makes the reply ask rather than
      answer.
- [ ] That reply carries no sources line.
- [ ] The message is still appended to the inbox as an ordinary Capture.
- [ ] No confidence number or score threshold appears anywhere in the code path.
- [ ] Where the Lookup came back empty, no answering call is made at all.
