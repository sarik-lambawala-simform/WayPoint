# 09 — The exit gate: a fortnight read back

**What to build:** nothing. This is the real use that decides whether the journal is worth having,
which no automated case can answer.

The payoff the parent spec names is scrolling a fortnight and seeing days you would otherwise have
lost. The only way to test that claim is to live a fortnight and then read it.

The journal pays back on a slower clock than everything else: the Digest carries the first week and the
journal carries the first month. There is no journal at all on day one, since the first entry appears
on day two about day one. Do not let that make it look broken.

**Blocked by:** 02 — What the model sees of the day; 04 — Backfill: past days without an entry, oldest
first; 05 — A day with an entry is closed to new Captures; 06 — `catchup` asks first, then clears the
whole backlog; 07 — The Canary counts the days the journal and the inbox disagree; 08 — The seeding
interview's day is stated rather than narrated.

**Status:** ready-for-human

- [ ] Every automated case in the phase 6 spec passes, and each one drives the scheduled run's single
      entry point with a fixture Vault, a stubbed model, a frozen clock and a recording transport.
- [ ] Manual: a real week of entries has been read at the end of the week, and judged on whether days
      that would have been lost came back.
- [ ] Manual: no Telegram notification ever arrived because of the journal.
- [ ] Manual: a typo was fixed by hand in an entry, and no run has undone it.
- [ ] Manual: the box was shut for three days with nothing sent, brought back, and no entries were
      invented for those days.
- [ ] Manual: `catchup` was sent after a real gap, it asked first, and then it cleared the backlog.
- [ ] A fortnight of real entries has been read back and judged worth having. Then phase 7 starts.
