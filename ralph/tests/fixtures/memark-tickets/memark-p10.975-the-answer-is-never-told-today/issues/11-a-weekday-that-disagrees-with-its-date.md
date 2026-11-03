# 11. What does the box do when a weekday and a date disagree?

**Type:** grilling

**Status:** resolved

## Question

    you   PTM at school on Thursday 9th Oct, both of us need to go
    bot   ✅ Wife: attend PTM at school, on 09 Oct 2026. First reminder 5 days before.

9 October 2026 is a Friday. One of the two words is wrong, and the box cannot know which. It
confirmed the date and said nothing about the weekday. `L335`: 1 of 1, and it is code, because
ADR 0050's test reads the date and never the weekday beside it.

A school notice, a WhatsApp forward or a tired person gets one of the two wrong often enough. A
reminder on the wrong day is the failure ADR 0012, Proposed Dates are confirmed by the human, was
written to stop.

Which of these?

- **A weekday that disagrees with its date makes the date wait for a yes**, and the Digest asks
  which.
- **The date is confirmed, and the reply says the weekday disagrees**, so the person can `undo`.
- **Neither.** The date wins, as now.

## Answer

Grilled on 2026-10-07. Written down as ADR 0059, a weekday that disagrees with its date is named in
the reply:
[../../../docs/adr/0059-a-weekday-that-disagrees-with-its-date-is-named-in-the-reply.md](../../../docs/adr/0059-a-weekday-that-disagrees-with-its-date-is-named-in-the-reply.md).

- **The date is confirmed, and the reply warns.** The person chose this over a Proposed Date. The
  date wins because it names one day.
- **The warning:** `09 Oct 2026 is a Friday, not a Thursday. If you meant Thursday 08 Oct, send undo
  and send it again with that date.` It sits under that piece's reply line. Code names the nearest
  day on the typed weekday.
- **The model finds, code checks.** The model sends `"weekday": "Thursday"` on a dated edit when a
  weekday word is attached to that date, in any language or short form. Code works out the real
  weekday and compares. The model never says whether they agree.
- A matching weekday adds nothing. No field adds nothing. A field code cannot read is dropped and
  logged. Each end of a range is checked on its own.
- **A question gets the same check**, through the same field on the Intent Read. The year checked is
  the one ADR 0058 took.
- `CONTEXT.md`: the Proposed Date and Recall entries say so.

Build: an optional `weekday` field in the filing schema and the Intent Read schema; the compare and
the warning line in the reply builder in `memark/handler.py`, and in the answer. Ticket 02 must keep
the warning under the right piece. The `harness/live/` bar for `L335` expects 09 Oct 2026 confirmed
and the Friday line.
