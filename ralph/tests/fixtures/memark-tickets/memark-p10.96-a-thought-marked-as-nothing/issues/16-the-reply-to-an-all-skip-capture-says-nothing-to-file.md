# 16. The reply to an all-`skip` Capture says `Nothing to file.`

**Type:** task

**Status:** completed

**Completed at:** 2026-09-25T10:18:54Z

**Blocked by:** none

**What to build:** a person can tell a message the box read and kept nothing from, from one the box
has not read yet.

Spec: [../spec.md](../spec.md). Decided in
[09-what-the-reply-says-for-an-all-skip-capture.md](09-what-the-reply-says-for-an-all-skip-capture.md).
The rule is ADR 0048, `skip` means the words hold nothing that stands, section "What the reply says
when every piece is `skip`".

## What happens today

`filled_in` in `memark/acknowledge.py` returns `None` when every piece is `skip`. The filing run then
leaves the reply alone, so it reads `Recorded: <words>`. A Capture no run has reached reads the same.
Ticket 08 measured this shape at 9 moods in 10.

## What to change

When the cut is usable, there are no landings, and every piece is `skip`, `filled_in` returns the
quote-back and then one line: `Nothing to file.`

- The string is a module constant beside `FILED`, `HELD` and `LOST`. The harness imports it.
- It has no mark and quotes nothing.
- `covered=None` with no landings still returns `None`.
- A cut with any `claim` piece never gets the line.
- The `day` note stays.
- Nothing is added after the line, per ADR 0046, what a reply may carry after it admits a gap.

Update the docstrings of `filled_in` and `_per_piece` that say an all-`skip` Capture gets no edit.

## The test that asserts the old rule

`test_a_message_with_no_claim_in_it_is_left_exactly_as_the_handler_wrote_it` in
`tests/test_the_reply_marks_each_piece.py` asserts the bare quote-back for an all-`skip` cut. Rewrite
it to assert `Nothing to file.` under the quote-back. Its docstring names phase 10.96's ticket 09 as
the decision that replaced the old rule. Also update the module docstring's "A `skip` piece is never
rendered" so it says what the whole-Capture line is.

## Done when

- [ ] An all-`skip` usable cut gets `Nothing to file.` under the quote-back.
- [ ] A cut with one `claim` piece and the rest `skip` gets no such line.
- [ ] No usable cut and no landings leaves the reply as the handler wrote it.
- [ ] The day note survives on an all-`skip` reply.
- [ ] The rewritten test names ticket 09.
- [ ] The unit suite is green.
- [ ] It commits, with ADR 0047, ADR 0048, the ADR 0044 pointer and the `CONTEXT.md` entry if no
      earlier commit carried them.
