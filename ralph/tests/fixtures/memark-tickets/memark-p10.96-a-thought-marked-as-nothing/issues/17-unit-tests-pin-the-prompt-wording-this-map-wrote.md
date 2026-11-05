# 17. Unit tests pin the prompt wording this map wrote

**Type:** task

**Status:** completed

**Completed at:** 2026-09-25T10:24:09Z

**Blocked by:** none

**What to build:** a later edit to the filing prompt cannot take out a sentence this map measured
without a red test.

Spec: [../spec.md](../spec.md).

## What happens today

Ticket 02's standing wording has three tests in `tests/test_what_lands_on_me.py`. The sentences from
tickets 01, 11 and 14 are in `memark/distillation.py` and no test names them. Each one moved a
measured rate.

## What to pin

Assert on `INSTRUCTIONS`, in the style `tests/test_what_lands_on_me.py` already uses. Each test's
docstring names the ticket and the rate the sentence moved.

- **Ticket 01.** The `skip` bullet says the words "hold nothing that stands" and names a claim about
  the person the question turned down. The held-Capture bullet says a claim about the person that
  was read and turned down is not its case. The mood hold went from 8 of 10 to 1 of 10.
- **Ticket 11.** The `skip` bullet says the question is asked of claims about the person and of
  nothing else.
- **Ticket 14.** The bullet that a thing the person did to or for somebody else is a claim about
  that somebody, gets an edit on their Card under `Facts`, and keeps the typed words. Its gym
  counter-example. The payment went from written on 0 of 20 runs to 10 of 10.

## The words the prompt must not carry

One test asserts none of these is in `INSTRUCTIONS`: `gpay`, `ramaben`, `knackered`, `mondays`,
`slog`, and the words of the new mood row from ticket 19. A prompt holding a live row's words lets
the model score by recognition, and the rate means nothing. All five are absent today. Ticket 19
adds the row's words to this test when it writes the row.

## Done when

- [ ] Each sentence above has a test that names its ticket.
- [ ] The absent-words test is in and green.
- [ ] No prompt wording changed.
- [ ] The unit suite is green.
- [ ] It commits.
