# 09 — A repeating rule always takes the tap

**What to build:** you set a repeating reminder by talking, and the plain-English reading comes back for
one tap before anything is written.

A repeating Review Date carries its rule on the line, per ADR 0042: `repeat::` the iCalendar recurrence
rule, `reads::` the plain-English reading of it, and `since::` the start date the interval anchors to.

Any write or change of a `repeat::` value is confirmed on the bot's own reply first, whatever else is
true about the message. What is printed for the tap is the `reads::` text, because that translation is
the thing standing between a misread rule and every reminder it would produce. A rule read wrong fires
wrong forever, and the tap is the only place it is cheap to catch.

Nothing is written until the tap arrives. Only then is a `set-repeat` Pending Instruction written, and
the next run writes the fields on the line. `set-repeat` is on ADR 0026's closed `pending::` list, added
by the same amendment that added `propose-alias`, so an older build meeting it leaves it alone and
counts it on the Health Canary rather than guessing.

`notice::` and `tier::` on the same line do not take the tap. A message that only moves a lead time on a
repeating date applies straight away, because it changes when you are told and not what repeats.

**Blocked by:** 07 — A date you stated is not a date it inferred.

**Status:** completed

**Completed at:** 2026-09-09T23:59:09Z

- [ ] A message setting a repeating rule replies with the `reads::` text, asks for confirmation, and
      writes no Pending Instruction until it arrives.
- [ ] The tap writes a `set-repeat` instruction and the next run writes `repeat::`, `reads::` and
      `since::` on the line.
- [ ] Changing an existing `repeat::` value takes the tap the same way.
- [ ] A message that only changes `notice::` on a repeating line applies with no tap.
- [ ] `since::` defaults to today when the message named no start.
- [ ] A build that does not know `set-repeat` leaves the instruction alone and counts it on the
      Canary.
