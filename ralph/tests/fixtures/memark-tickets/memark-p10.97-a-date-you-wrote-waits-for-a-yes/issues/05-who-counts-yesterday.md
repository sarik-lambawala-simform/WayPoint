# Who counts yesterday: code or the model?

Type: grilling
Status: resolved
Blocked by: 04

## Question

Today the model turns `yesterday` into a window and nothing checks it. `memark/recall.py:20` says
relative words are read by the model and never by the patterns there. Finding C in
[../finding.md](../finding.md) shows the model counting one day short, twice.

`yesterday`, `today`, `day before yesterday` and `N days ago` are fixed counts from today. Code can
work them out without reading any meaning. Two ways:

- **Code counts them.** `written_dates.py` gains the fixed relative words, and the window comes from
  code whenever the message holds one. The model still reads everything else, like
  `the week I was in Pune`.
- **Code checks the model.** The model still returns the window. When the message holds a fixed
  relative word, code works out the day and refuses a window that does not match.

Settle also:

- Which side of ADR 0014 (the model proposes edits and code applies them) counting a day sits on.
- Whether the answer must always name the day it read in full, `29 Sep`, and never only `the 29th`,
  so a wrong day is easy to see.

Ticket 04's rate decides how much this matters. A rate near zero after a prompt fix may make the
check enough.

## Comments

**2026-09-29, from the person, during ticket 01.** A third way to weigh beside the two above: the
model never counts. It sends what it wants counted in a fixed shape, and code returns the day. For
example `{"from": "today", "days": -2}` or `{"weekday": "monday", "which": "last"}`. Two notes from
that session. The anchor is a name like `today` and never a date the model copies, because a copied
date can be wrong too. And the model can still pick the wrong count, so code can still check the
fixed words: `yesterday` is always -1. Ticket 01 already has code work out a typed date on its own,
so this would be the same move for relative words.

**2026-09-29, from ticket 04.** The rate is not near zero. `claude-haiku-4-5` got the day right 8
times in 20. It was one day short 10 times and gave no window 2 times, both for
`day before yesterday`. It was never one day long. `claude-sonnet-5` also gave no window for
`day before yesterday`. So "a prompt fix may make the check enough" was not tried and has a long
way to go. A missing window is a second failure beside a wrong one. See
[Measure how often yesterday lands on the wrong day](04-measure-how-often-yesterday-lands-on-the-wrong-day.md).

## Answer

Settled in a grilling session on 2026-09-29. Recorded in ADR 0052 (code counts a day from today, and
the model never does).

**Code counts first, and the model's count is the fallback.** This is the first way and the third
way together. `window_in` in `memark/recall.py` reads `today`, `yesterday`, `day before yesterday`
and `N days ago`, with N as digits or `one` to `ten`. For anything else, like `kal` or
`4 din pehle`, the model returns a day count per end, `{"start": -4, "end": -4}`, and code turns it
into a day. The model never writes a date. The second way, code checks the model's day, was ruled
out: it does nothing for the 2 runs in ticket 04 where the model gave no day.

**The shape is a day count only.** Weekdays, weekends and weeks need more, and `last Monday` has two
readings. That is a new ticket:
[Which shapes beyond a day count does the model send?](08-which-shapes-beyond-a-day-count.md)

**Code wins a disagreement.** Where code found a fixed word, the model's count is not used. A
mismatch writes one log line so a live pass can count it. The box does not ask.

**Today is the day the message arrived**, in the person's zone. The same rule as ADR 0050 (a typed
date is tested on its piece, and code works out its day). A follow-up counts from its own arrival day.

**Code side of ADR 0014** (the model proposes edits and code applies them). Counting from today is
arithmetic. This moves the line ADR 0032 (intent is read by a model and applied by code) drew for
`yesterday`, so it has its own ADR.

**The answer's first line names the day in full**, like `Tuesday 29 Sep`, written by code with
`clock.display_day`. Where no step gave a day, the line is `I could not tell which day you meant.`
and no answer follows.

**Filing is out of scope.** A Capture like `yesterday I met Ravi` holds a relative word too. This
map's destination names Recall only.
