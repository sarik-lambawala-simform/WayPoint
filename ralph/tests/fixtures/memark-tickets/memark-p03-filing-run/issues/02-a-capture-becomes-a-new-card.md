# 02 — The edit schema, the filing call, and a Capture becoming a new Card

**What to build:** I say something about a person the Vault has never heard of, and three hours later
there is a short Card about them carrying my words, linked back to what I actually sent, with a row in
the Registry describing it in one line. This is the spine of the phase and every ticket after it hangs
off this one.

The filing call ships the frozen instructions first, then the Registry whole, then the Captures in the
batch and the Cards they target. The Registry goes whole on every call, because the model can only avoid
creating a duplicate if it can see every subject that already exists, and that guarantee is arithmetic
rather than hope. No ranking of the Registry is built. Prefix order matters for the reason
`docs/stack/anthropic-api.md` gives: caching is prefix matching, so the frozen half goes first and the
volatile half last, even though at v1 Registry size the cache will not fire.

The response is data, not prose, per ADR 0014, which decided the model proposes edits and code applies
them. Distillation is a schema-constrained job: a JSON schema with a full `required` list and
`additionalProperties` false. An edit names which Card, which section, what line, which Captures it
derives from, any status change, any Registry addition, and a `kind` of `extend`, `compact` or
`contradict`. Nothing else reaches a file. That one sentence is where every safety property in this
phase comes from, so a code path where a model response reaches a file without going through
`vault/apply.py` is a bug however well it behaves in a demo.

Applying an `extend` naming a subject that is in no Registry row creates the Card: its frontmatter, its
line under an allowed heading with a `from::` link to the exact block, and its Registry row. Then code
writes `filed::` with the day onto the block, because drain granularity is per Capture rather than per
run. The run commits once, as it already does, so the whole filing pass reads as one entry in `git log`.

The real Anthropic client replaces `UnbuiltModelClient` here, since this is the first thing in the build
with something to ask a model. Filing runs on the cheap tier per ADR 0003, which chose hosted models
with `claude-haiku-4-5` for mechanical work and `claude-sonnet-5` for judgement. The model id per tier
is a Box Setting, so switching tier is a settings change and a restart, never an edit to a call site.
`response.usage` is logged for every call, because cost is a number this project measures rather than
estimates.

Tests hand the run a stub returning canned structured edits, a temp-directory Vault initialised as git,
a frozen clock and the recording transport. No test asserts a call count unless the answer is zero.

**Blocked by:** 01 — The filing clock, the unfiled-block queue, and the Parked bound.

**Status:** completed

**Completed at:** 2026-09-01T08:20:28Z

- [ ] A Capture about an unknown subject produces a Card, and the test asserts its path, its
      frontmatter, its line under an allowed heading, and the `from::` link resolving to the block it
      came from.
- [ ] The same run adds one Registry row describing the new Card in one line.
- [ ] The block the Capture came from carries `filed::` with the day, and no other block in the file is
      touched.
- [ ] The whole pass ends in exactly one commit, and the commit message names the Captures drained and
      the changed paths.
- [ ] The proposed-edit schema is passed to the model as a JSON schema with a full `required` list and
      `additionalProperties` false, and a `kind` of `extend`, `compact` or `contradict` is required on
      every edit.
- [ ] Every write goes through `vault/apply.py`. No module outside it writes a Card, a Registry row or
      an inbox mark.
- [ ] The model id for each tier is a Box Setting, and no model id appears at a call site.
- [ ] `response.usage` is logged for every filing call.
- [ ] A run over the empty Vault fixture completes and creates nothing.
