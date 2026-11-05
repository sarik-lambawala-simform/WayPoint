# 27 — A message naming days and a person reaches one Card plus the window

**Type:** task

**Status:** completed

**Completed at:** 2026-09-18T19:21:15Z

**Blocked by:** 24

**Strand:** B, the question path. Parallel with 25 and 26.

**What to build:** `what is coming up with Mohan's work in the next year` reads the window and
carries Mohan's Card with it, so the answer knows both the days and the man, and costs one Card
rather than every Card.

## What happens today

`handler._written` sends a message naming a subject and a window down the Lookup's road. Every Card
goes in the prompt and the window's material goes in beside them. Six of seven runs used to cost the
whole Vault for `?next week kya kya hai`.

## What to change

A message naming days reaches Recall whether or not it names somebody. The named subject's Card
rides along with the window as context, not as a filter. The Registry already turns a name into a
Card, and ADR 0032's amended list of what code may load already carries "load the Review Dates for a
named subject", which is this move on the same material.

One Card plus the window, and not every Card plus the window.

This replaces a rule that landed while ticket 06 was open. That branch of `handler._written` narrows
to the named subject's Card on the window's road.

Nothing is taken away from a question that resolved no window. Those still reach every Card.

## What this changes in the bill

Every phrasing of a forward question now costs a window read plus one Card at most.

## The seam

`handler._written`, the way `tests/test_the_cards_go_in.py` drives it.

## Done when

- [ ] A message naming days and a person reaches the window and that person's Card, and no other
      Card.
- [ ] A message naming days and nobody reaches the window with no Card, as it does today.
- [ ] A message that resolved no window still reaches every Card.
- [ ] The code cites ticket 24's ADR.
- [ ] The unit suite is green.
- [ ] It commits.
