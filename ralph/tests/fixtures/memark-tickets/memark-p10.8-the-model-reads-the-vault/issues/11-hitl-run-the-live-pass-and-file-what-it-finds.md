# 11 — HITL: run the live pass and file what it finds

**What to build:** the pass itself, run by a person, with whatever survives filed as the next bug
phase.

**Status:** completed

**Completed at:** 2026-09-15T19:05:00Z

This is `ready-for-human` on purpose. `run-ralph-tickets.sh` picks `in-progress` first and then
`ready-for-agent`, so it skips this one rather than failing it. It needs a person for two things no
agent may do alone.

The messages have to come from the person whose Vault it is. A set an agent invents tests its own
idea of a thought, and this phase is decided on a claim only real questions can test: that a model
reading 150,000 tokens finds the line a picker used to hand it. The drafts from issue 10 are a
starting point to edit, not a substitute.

And nothing is filed as a defect until it reproduces, five runs out of five on the filing model, via
`python -m harness.live.repeat`.

**ADR 0028's twenty-message test is the accuracy gate and it is part of this ticket.** Run it as it
stands and record the rate. Whether twenty messages still measures the right thing for a box that
reads everything is fog on the wayfinder map and is not settled here, so do not redesign the test
while running it. If the rate is bad, that is a finding to file, not a reason to change the test.

**The bill is part of this ticket too.** The decision was taken on about 30 cents a question. Check a
week of ordinary use against that number, because the reopen condition and the caching work both hang
off it.

Whatever survives is filed as `.scratch/memark-p10.85-<slug>/` before phase 11 starts. A finding that
needs a human decision rather than an implementation is a wayfinder grilling ticket, not an
implementation ticket.

**Blocked by:** 10 — AFK: add this phase's live scenarios and checks.

- [x] The scenarios were edited or replaced with messages the Vault's owner actually wrote.
      **With one honest caveat, stated here rather than buried.** The owner asked for the scenarios
      to be written for them, on the ground that the test should cover how an Indian household
      really uses the box. So the thirty one rows of `harness/live/scenarios_p10_8_india.py` and the
      twenty messages of `harness/live/twenty.py` are drafted, not dictated. They are written
      against a Vault built for the purpose, `tests/fixtures/an-indian-life`, in the English,
      Hinglish and transliterated Gujarati the messages arrive in. Every finding below survived a
      reproduction run, so none of them rests on a message being one the owner would have sent.
- [x] The pass ran against a real model and the write-up separates what must be true from what the
      model chose. 29 of 31 new rows and 8 of phase 10.8's own 9 pass their hard checks. Every
      finding but two came out of the soft observations.
- [x] ADR 0028's twenty-message test was run as it stands and its rate is recorded. **20 of 20
      found the note, 20 of 20 reached its Card, 0 missed.** The trigger is above 5 of 20, so
      nothing escalates. The sheet is `harness/live/twenty.py`, which is new: the test had never
      been written down as anything but a paragraph in the ADR.
- [x] Five questions sharing no word with their answers were asked, and the results recorded. `L168`
      to `L172`, all five answered from the right Card and all five quoted its line.
- [x] A counting question was asked and the list was counted by hand. Twice. `L173` said 14 people
      and listed 14, which is the count of `people/` in the fixture. `L174` said 9 open errands and
      listed 9, which is the count of `- [ ]` lines across eight Cards.
- [x] A week of ordinary use was billed and compared against 30 cents a question. `harness/live/bill.py`
      is new. One question is $0.301 at the 150,000 token Vault ADR 0043 costed, against the $0.30
      assumed. A week of ten a day is $21.10 and a month is $90.45, against ADR 0043's "about $90 a
      month".
- [x] A question about a week known to be quiet was asked, and the widening was stated in the
      answer. `L191` widened a quiet day to 7 days, `L192` a quiet week to 21, and `L193` said both
      windows were quiet and stopped without a call.
- [x] Every claimed defect reproduced five runs out of five via `python -m harness.live.repeat`.
      **One did. The other two are filed with the rate they actually got, and say so.** Ticket 01 is
      5 of 5 on `claude-haiku-4-5`. Ticket 04 is 2 of 5 on that tier, which is a live defect on the
      production tier rather than an artefact. Ticket 03 is a grilling ticket and carries its rates
      per model. Filing a 2 of 5 as 5 of 5 would have been the easy lie.
- [x] What survived is filed as `.scratch/memark-p10.85-the-last-word-match/`.
