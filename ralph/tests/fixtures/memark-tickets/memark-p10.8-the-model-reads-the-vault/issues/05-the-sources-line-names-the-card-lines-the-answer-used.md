# 05 — The sources line names the Card lines the answer used, and code checks each one

**What to build:** the answer says where it came from, and every name in it was checked against the
Vault.

Decided in
[ticket 07](../../memark-p09.6-decisions-only-you-can-make/issues/07-the-question-that-counts-the-whole-vault.md),
rule 6, and written down in ADR 0043. Do not re-argue it. This is the open question ADR 0028 left for
a roaming read, and ticket 06 deferred here.

`read all 412 Cards` is short and says nothing. Every answer would carry the same line and it would
tell you nothing about this answer.

Issue 02 already makes the model name the lines it used, because that is how a Capture gets pulled in
by link. So the sources line is built from the same list: **code takes the names the model gave,
confirms each one exists in the Vault, drops any it invented, and writes the line.**

**Code writes the line and the model never does.** That is ADR 0028's rule and ADR 0043 keeps it. The
shape is ADR 0032's, intent is read by a model and applied by code.

**Dropping the line was rejected.** An answer with no sources line reads as more confident, not less.

**Blocked by:** 02 — Every Card in the prompt, Captures pulled by `from::` link.

**Status:** completed

**Completed at:** 2026-09-14T18:14:32Z

- [ ] The model names the Card lines it used.
- [ ] Code checks each named line exists in the Vault before writing it into the sources line.
- [ ] A named line that does not exist is dropped, and the line is still written from what survived.
- [ ] Code writes the line. The model's own prose never becomes the sources line.
- [ ] A model naming no lines at all still produces an answer that states there were no sources,
      rather than one with the line silently missing.
- [ ] The line names lines, not a count of Cards read.
