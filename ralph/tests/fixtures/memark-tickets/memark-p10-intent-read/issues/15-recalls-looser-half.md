# 15 — Recall's looser half

**What to build:** "what was I doing around last Diwali" is answered from a window the Vault's own record
supplies, not from a guess.

Phase 9 built Recall for a literal day and a literal range. The looser half needs the Intent Read, so it
switches on here. The model returns a date or a range in a fixed shape. Code then checks it: both ends
are real dates, and the start is not after the end. A near miss is refused rather than rounded off, and
named back, which is ADR 0032's exact-match-or-nothing rule applied to a window.

A named past occasion is found from the Vault's own record, which phase 9 already built. A range with no
stated width is three days either side, seven in total, and the answer says so, so you can see how wide
the window it read was.

A day is recalled from its Captures, per ADR 0033. Choosing which files to read still costs no model
call. The looser half changes where the window came from, not how a day is read.

**Blocked by:** 01 — The receipt order, and the first change end to end.

**Status:** completed

**Completed at:** 2026-09-10T20:21:36Z

- [ ] A loose window in a message produces a date or a range from the model, and code checks both ends
      are real dates.
- [ ] A start after the end is refused and named, and nothing is answered from it.
- [ ] A near miss is refused rather than rounded off to the nearest real date.
- [ ] A range with no stated width is seven days, three either side, and the answer states the window
      it used.
- [ ] A named occasion resolves from the Vault's own record and the resulting range is checked the same
      way.
- [ ] Choosing which Date Files to read still costs no model call.
