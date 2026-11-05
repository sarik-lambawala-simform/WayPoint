# 03 — Plus every Capture nothing links to

**What to build:** the one rule that closes the hole issue 02 opens.

Decided in
[ticket 07](../../memark-p09.6-decisions-only-you-can-make/issues/07-the-question-that-counts-the-whole-vault.md),
rule 4, and written down in ADR 0043. Do not re-argue it.

Issue 02 pulls a Capture in only when a Card line points at it. So a thought that never reached a
Card is invisible to the answer. Four kinds of block are in that state, and they share one property:

- A **Parked** block, per ADR 0037, an unanswered question is parked never abandoned.
- A **refused claim**, per phase 10.7 issue 02.
- A **Part Drained** leftover, per phase 10.7 issues 05 and 06.
- Everything **filed since the last run**, which is simply today's inbox.

Nothing links to any of them. So one rule covers all four: every Capture no Card line points at goes
into the prompt. No window, no setting, no list of kinds to keep in step with.

**The reader already exists.** Phase 10.7 issue 06 reads every `from::` link in the Vault on every
run, built on `_cited` at `memark/vault/apply.py:2327`. This is the same set, inverted.

The set is small: maybe 75 KB after five years.

**Blocked by:** 02 — Every Card in the prompt, Captures pulled by `from::` link.

**Status:** completed

**Completed at:** 2026-09-14T17:44:07Z

- [x] Every Capture that no Card line points at goes into the answering prompt.
- [x] It is one rule, not four cases.
- [x] A Parked block is in the prompt.
- [x] A refused claim is in the prompt.
- [x] A Part Drained leftover is in the prompt.
- [x] Today's unfiled inbox is in the prompt.
- [x] A Capture a Card line does link to is not pulled in twice.
- [x] The cited set is read once per call, reusing phase 10.7's reader rather than a second walk.
