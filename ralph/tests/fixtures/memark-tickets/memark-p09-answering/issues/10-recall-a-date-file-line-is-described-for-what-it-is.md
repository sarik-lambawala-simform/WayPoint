# 10 — Recall: a Date File line is described for what it is

**What to build:** asking about a window returns the dated lines in it as well as the Captures, and
each line is described honestly. Nothing inert is ever presented as something that will fire.

Date Files are not in the word-matching corpus, and that is a decision rather than a gap: a line is a
name, a few words, a schedule and a tier, too thin to rank and noisy when it does. Dated lines are
reached by two exact paths instead, by subject name and by date. This ticket is the by-date path, over
the files ADR 0011 put dates in, which decided that dates live in date-indexed files.

An inert line is returned and stated for what it is. `?` reads as not confirmed, per ADR 0012, which
decided that a proposed date is confirmed by the human. `x` reads as something I turned down.
`handled::` reads as something I dealt with. Nothing is suppressed, because the question is about the
past and the past includes what I said no to.

The rule to hold is that Recall never presents an inert line as one that will fire. That distinction
belongs to ADR 0016, which decided that a Review Date fires on the days its schedule names, and a line
with a `?` or an `x` names no such day.

**Blocked by:** 08 — Recall: one literal day, read whole.

**Status:** completed

**Completed at:** 2026-09-08T21:59:42Z

- [ ] A window's Date File lines come back alongside its Captures.
- [ ] A `handled::` line in the window is returned and described as something I dealt with.
- [ ] A `?` line is returned and described as not confirmed.
- [ ] An `x` line is returned and described as something I turned down.
- [ ] No inert line is described as something that will fire.
- [ ] Date File lines are still absent from the word-matching corpus, so ticket 03's assertion holds.
