# 11 — The Digest reads the Standing Rules file

**What to build:** somewhere for "stop offering me that" to live that is not a Card and not a Setting.

A Standing Rule is a line of prose read at one named step and added to what that step sends its model,
per ADR 0039, which allowed Standing Rules at one step in v1 and refused the Filing Run one outright. The
Digest is that step and the only one. It is checked by nothing, because no code reads it, and the file
says so in its own first line.

What it may touch is the wording of the Digest and nothing else. It may not close an ask path, resolve an
Ambiguous Subject or a Contradiction, touch a Pinned Claim, create or confirm a date, or do a Setting's
work. Those limits are structural: nothing in the file reaches any of those paths, because the file
reaches only the Digest's prompt.

An absent file is normal. In v1 you write these by hand.

**Blocked by:** 02 — One Digest a day: code assigns the numbers, the model writes the words.

**Status:** completed

**Completed at:** 2026-09-02T08:44:14Z

- [ ] A Standing Rule in the Vault reaches the Digest call, asserted on what the stub model was sent.
- [ ] A Vault with no Standing Rules file composes a Digest anyway.
- [ ] The file's first line says that nothing checks its contents.
- [ ] No other model call in the system is sent the file, asserted on the filing call.
- [ ] The Digest's numbering, its footer and its Canary are unchanged whatever the file says, because
      none of them is written by the model.
