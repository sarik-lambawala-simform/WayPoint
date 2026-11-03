# 02 — One Digest a day: code assigns the numbers, the model writes the words

**What to build:** the system speaks first. Once a day, in the evening, one message arrives holding
what selection chose, and it is the only message that notifies.

Code assembles the numbered items and knows each one's target path and line. The model is handed those
items and writes the prose, per ADR 0021, which put the numbering in code so that a Command resolving
against a number is a lookup and never a parse of model-written text. Code then appends a
machine-readable footer to the saved Digest mapping each number to its target. Phase 5 reads that
footer; this ticket writes it and proves every number in it resolves.

The Digest is saved in the Digests folder and sent by the transport. Every filing reply is silent, and
only this message notifies. Exactly one goes out a day, sent by the first run that finds none written
for today, which is what makes a shut laptop a non-event. Which day the last Digest covered is derived
from the newest file in the Digests folder and stored nowhere, so there is no second record that could
disagree with the folder.

An empty Vault gets an honest Digest. Day one says nothing was filed rather than inventing something to
say.

**Blocked by:** 01 — The phase's Vault Settings, the Notice Schedule, and one-shot selection.

**Status:** completed

**Completed at:** 2026-09-01T11:33:59Z

- [ ] A one-shot Review Date whose schedule names today appears in the Digest, and one naming tomorrow
      only produces no mention of it.
- [ ] Items are numbered by code, and the model is never asked to number anything.
- [ ] The saved Digest carries a footer mapping every number to a target path and line, and every entry
      in it resolves against a real line in the Vault.
- [ ] The Digest is the only message sent with a notification, and the filing acknowledgement stays
      silent.
- [ ] Two runs on the same day: the first sends the Digest, the second sends none and writes none.
- [ ] A day whose Digest hour passed while no run happened: the next run sends it, and labels nothing as
      missed.
- [ ] An empty Vault produces a Digest that reads honestly and says nothing was filed.
- [ ] The day the last Digest covered is read off the newest file in the Digests folder and is stored
      nowhere else.
