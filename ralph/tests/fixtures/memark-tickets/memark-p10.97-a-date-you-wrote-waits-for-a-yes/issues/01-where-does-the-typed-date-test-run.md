# Where does the typed-date test run on a new Capture?

Type: grilling
Status: resolved

## Question

ADR 0032 (intent is read by a model and applied by code) already decided what happens. A date the
message literally contains is applied at once and named in the reply. See finding A in
[../finding.md](../finding.md).

What is not decided is where that test runs for a new Capture, which only filing sees.

- **In `vault/apply.py`,** when it writes a filing edit that carries `date`. It checks the words of
  the Capture the edit cites.
- **Before filing,** on the Capture's text, marking it so filing writes a Review Date and not a
  Proposed Date.

The test must run on the words of the Capture the edit cites, not on the whole message. A message
of ten errands where one names a day must not confirm the other nine.

Settle also:

- What the reply line says. For example
  `✅ Loose Ends: order hand blender, on 08 Oct 2026. First reminder 5 days before.`
- What `undo` takes back: the date, the Task, or both.
- Whether the model's `date` must match the day written in the words. `8th october` on 29 Sep
  means 8 Oct 2026. A model that writes 2027 is a stated date read wrong, and nothing would catch it.

## Answer

Settled in a grilling session on 2026-09-29. Recorded in ADR 0050 (a typed date is tested on the
piece it came off, and code works out its day).

**The test runs in `vault/apply.py`, on the piece.** A filing answer cuts a Capture into pieces, and
each piece names the edits that came off it (ADR 0044, one reply line per piece). When a dated edit
arrives, code finds its piece and runs `states_a_date` on that piece's words. Yes: write a Review
Date. No: write a Proposed Date, as today. If the pieces do not add back up to the typed text, every
date in that Capture is a Proposed Date. This is the same fallback `Covered` uses. A test before
filing was ruled out: it sees only the whole message, so one day in one errand would confirm all ten.

**Code works out the day and the model's day must match it.** Code reads the date from the piece
and takes the next such day on or after the day the Capture arrived. It uses the arrival day, not
the run day, so a run after midnight cannot move the year. A match is confirmed. A mismatch, or a
piece where code cannot read exactly one date, is a Proposed Date. So `from 8 Oct to 10 Oct` is a
Proposed Date. This is date matching and not reading meaning, so it sits on the code side of ADR
0014 (the model proposes edits and code applies them). A miss costs one Digest question. It never
fires a wrong reminder.

**The Intent Read gets the same check.** It already confirms a stated date at once
(`memark/intent.py:1306`) and trusts the model's day. It now calls the same function. It has no
pieces, so it tests the whole message, as it does today. One function in `memark/written_dates.py`
means the two paths cannot read the same words two ways.

**The reply adds the day to the piece's line.** The errand and its day came off one piece, so they
share one line: `✅ Loose Ends: order hand blender, on 08 Oct 2026`, with the day from
`clock.display_day`. What the reply says about the Notice Schedule and tier is a later ticket:
[What does the reply say about a typed date's warning and tier?](07-what-the-reply-says-about-warning-and-tier.md)

**`undo` takes back both, with no new code.** The Task and the day land in one run commit, and
`undo` already puts back the whole commit. The unit of `undo` is the message, per
`memark/undoing.py`. To drop only the day, the person says so in words, and that goes through the
Intent Read.
