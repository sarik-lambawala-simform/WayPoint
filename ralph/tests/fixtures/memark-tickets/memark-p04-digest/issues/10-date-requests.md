# 10 — Date Requests: a moving date is asked for, never computed

**What to build:** a festival that falls on a different day each year gets asked about in time, and an
unanswered ask is a number I can see rather than a silence.

A Date Request is a line in `dates/recurring.md` carrying a yearly rule for an approximate day, marked
`?` and carrying `request:: date`. It fires on the days its own schedule names, the Digest asks, and the
answer becomes an ordinary one-shot Review Date for that year. Nothing is written until it is answered,
because the rule turning a lunar date into a civil one is doctrinal, varies by tradition, and is wrong
by exactly one day when it is wrong.

The Request's schedule must fire early enough that the date it produces still has room for its own full
notice window. A Request that would ask too late is refused when it is written, the same way ticket 07
refuses a rule that fires on no day.

An unanswered Request asks again on the next day its schedule names and is counted on the Health Canary,
so a festival never confirmed is visible as a number. Date Requests never park, because parking is a
property of an unfiled Capture and filing's scan never sees a Date File line.

**Blocked by:** 09 — Proposed Dates: the agent proposes, the Digest asks, nothing fires; 06 —
Recurrence: a rule on the line, matched against a day.

**Status:** completed

**Completed at:** 2026-09-02T10:33:40Z

- [ ] A Date Request fires on the days its own schedule names, the Digest asks, and nothing is written
      until it is answered.
- [ ] An answer becomes an ordinary one-shot Review Date for that year, carrying its own Notice Schedule.
- [ ] An unanswered Request asks again on the next day its schedule names.
- [ ] Outstanding Date Requests are counted on the Canary, and the count is absent when it is zero.
- [ ] A Request whose schedule leaves no room for the notice window of the date it would produce is
      refused at write time, naming why.
- [ ] A Date Request is never parked and never reaches the filing queue.
- [ ] Fixture added: a Date Request.
