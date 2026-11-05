# 24 — ADR: Recall reads forward

**Type:** task

**Status:** completed

**Completed at:** 2026-09-18T18:30:15Z

**Blocked by:** none

**Strand:** B, the question path. First in the strand, and it gates all three of B's code tickets.

**What to build:** the written decision that Recall answers a question about the days ahead, so the
change of material under one name is a decision rather than a drift.

## Why the document goes first

The spec's own rule: Strand B's decision comes before any of its code. Phase 10.85's ticket 09 is
the prior art. The ADR is the authority the code in tickets 25, 26 and 27 is written against.

## What to write

A new ADR, the next free number. Title it so the rule is in the title: Recall reads forward, and
what a window holds depends on which side of today it falls on.

**Recall keeps its name and its seam.** One function for any window. What it returns for a window is
three things: the window's Capture blocks, the Date File lines inside it, and every open Task when
the window touches today or later. A window wholly in the past carries no Task, because a Task is a
thing still to do and nothing about it is a fact of last March.

**Amends ADR 0033**, a day is recalled from its Captures, on two points. The shape of the material,
above. And the routing rule's person arm, below. Its rule that Recall never presents an inert line
as a live one holds throughout. Its rule that nothing is suppressed is narrowed to the past, where a
rejected proposal is part of what happened.

**The Notice Schedule exception, stated against ADR 0016**, a Review Date fires on the days its
Notice Schedule names. A forward Recall returns every dated line the window covers, whatever its
`notice::` says. This is the one place a Review Date speaks outside the days its schedule names, and
ADR 0016 is untouched by it: the schedule decides when a date speaks on its own, and this is a
person asking. Without the exception a birthday in March with a fortnight of notice stays silent in
a question asked in September, which is the question people ask.

**Cites ADR 0043**, the model reads the whole Vault, for why code picks the window and the model
narrows. A window is not the Lookup. It is an exact filter code already resolved, so the material is
picked by date rather than by ranking, and ADR 0043's worry, that a picker drops the right line, is
answered by sending every line the window covers.

**Amends ADR 0043 on the person arm.** A message naming days and a person reaches that person's Card
and the window, not every Card. One Card plus the window. Nothing is taken away from a question that
resolved no window: those still reach every Card.

**The forward standings.** A `PROPOSED` line is a plan still floating, so it is returned and said to
be unconfirmed. A `REJECTED` line will fire on no day and is not part of what is coming, so it is
not returned. A `HANDLED` line is returned and said to be dealt with.

**`widened` applies to the past and to nothing else.** A forward window holding nothing is answered
as empty. ADR 0028's rule that finding nothing is an absolute is the same rule read forwards.

**Record the two refusals.** A third function beside Lookup and Recall was refused:
`selection.what_is_due` returns what today names through each line's Notice Schedule, so a Digest
asked for on demand in September says nothing about March. Sending a forward question to the Cards
was refused: it costs the whole Vault, it reaches dated lines only through the Cards that backlink
them, and nothing on that path knows what today is.

## Also update

`CONTEXT.md` and `docs/stack/dates.md`, because those are what a session working on dates reads
before it writes. No term is renamed.

## Done when

- [ ] The ADR exists at the next free number and carries the rule in its title.
- [ ] It amends ADR 0033 on the material and on the routing rule's person arm, marked as an
      amendment and not a supersession.
- [ ] It states the Notice Schedule exception against ADR 0016 and says why ADR 0016 is untouched.
- [ ] It cites ADR 0043 for why code picks the window, and amends it on the person arm.
- [ ] It carries the three forward standings and the `widened` direction rule.
- [ ] It records both refusals with their reasons.
- [ ] `CONTEXT.md` and `docs/stack/dates.md` describe what Recall now returns and how a message
      naming days and a person is routed.
- [ ] No ADR is superseded.
- [ ] It commits.
