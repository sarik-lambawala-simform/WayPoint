# 12 — `unpark`

**What to build:** one word brings back every Capture that got parked.

An unanswered question is parked, never abandoned, per ADR 0037. Parking keeps the Digest short when you
did not have the attention to answer. `unpark` returns every parked block to the filing queue so the
next run works through them again.

It takes no argument and does not pick individual blocks. Choosing among them needs exactly the
attention you did not have when they parked, so offering the choice would recreate the problem parking
solved.

It fires on sight, per ADR 0041, which lets `undo` and `unpark` act without resolving anything because a
misfire is cheap: `unpark` costs model calls and writes no permanent text. `catchup` is the one that
asks first, because ADR 0027 freezes a Journal Entry once written.

`unpark` is on ADR 0026's closed `pending::` list and takes no `target::`, which the grammar already
allows.

**Blocked by:** 01 — The receipt order, and the first change end to end.

**Status:** completed

**Completed at:** 2026-09-10T01:31:20Z

- [ ] `unpark` returns every parked block to the filing queue and the reply says how many came back.
- [ ] It takes no argument, and `unpark 3` is not read as a Command.
- [ ] It fires without asking for confirmation.
- [ ] With no parked blocks it says so and writes nothing.
- [ ] The instruction is written with no `target::`.
