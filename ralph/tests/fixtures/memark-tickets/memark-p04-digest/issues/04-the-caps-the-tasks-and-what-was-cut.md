# 04 — The caps, the Tasks, and what the Digest did not show

**What to build:** a short Digest that can never be mistaken for a quiet day.

Due items are ordered by date and cut at their cap. Tasks the system inferred are listed numerically,
newest first, and cut at theirs. Both caps are the Vault Settings ticket 01 added, and both lists state
how many items they did not show. That count is the whole protection here: a Task must never look like
it vanished, and a Digest cut short must say so.

In v1 the tier is written on the line and acted on nowhere. The Digest orders by date, does not protect
tier 1 from the cap, and does not cut low tiers first. Saying otherwise would promise a protection
nothing builds, and ordering by tier is v1.1 per ADR 0038, which deferred tier ordering and quiet tiers
out of v1.

The day's filing is reported as a count rather than a list, because the acknowledgement already closed
that loop in the chat hours earlier.

**Blocked by:** 02 — One Digest a day: code assigns the numbers, the model writes the words.

**Status:** completed

**Completed at:** 2026-09-01T13:13:56Z

- [ ] More due items than the cap: the Digest shows the cap's worth, ordered by date, and states how
      many it did not show.
- [ ] More open Tasks than the cap: the same, newest first.
- [ ] A tier 1 item is cut by the cap like any other, and no test asserts a tier ordering.
- [ ] The day's filing appears as a count and not as a list of what was filed.
- [ ] Both caps are read from the Vault Settings and neither is a constant in code.
- [ ] Fixtures added: more due items than the cap, and more open Tasks than the cap.
