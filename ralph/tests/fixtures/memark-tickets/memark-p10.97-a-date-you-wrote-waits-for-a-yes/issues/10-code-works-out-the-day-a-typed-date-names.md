# 10. Code works out the day a typed date names

**Type:** task

**Status:** completed

**Completed at:** 2026-10-01T02:19:33Z

**Blocked by:** none

**What to build:** one function that reads the day a typed date names, and the Intent Read's stated
path checks the model's day against it.

Spec: [../spec.md](../spec.md), "Strand 1: typed dates on filing". Decided in
[Where does the typed-date test run on a new Capture?](01-where-does-the-typed-date-test-run.md).
The rule is ADR 0050, a typed date is tested on its piece and code works out its day.

## What happens today

`memark/written_dates.py` reads date shapes only. Its docstring says nothing there resolves a date
to a day. The stated path in `memark/intent.py` confirms a stated date and trusts the model's day.

## What to change

- `written_dates.py` gains one public function. It takes the words and the arrival day and returns
  the one day the words name, or nothing.
- Nothing for no date, two dates, a range, or a day the calendar does not hold.
- A date with a year is that day. A date with no year is the next such day on or after the arrival
  day. `the 4th` is the next 4th on or after the arrival day.
- It reads the patterns `states_a_date` reads. No second regex, per `docs/stack/dates.md`.
- The module docstring says what the function does and names ADR 0050.
- The Intent Read's stated path calls it on the whole message and the arrival day. A day that differs
  from the model's, or no day, leaves ADR 0012 in force: nothing recorded, and the Digest asks.

## Done when

- [ ] `8th october` arriving 28 Sep 2026 is 8 Oct 2026. Arriving 9 Oct 2026 it is 8 Oct 2027.
- [ ] `from 8 Oct to 10 Oct` and `8 Oct or 9 Oct` give nothing.
- [ ] `the 4th` arriving 5 Sep is 4 Oct.
- [ ] The Intent Read proposes a date whose model day differs from the words, and confirms one that
      matches.
- [ ] The unit suite is green.
- [ ] It commits, with ADR 0050 and the `CONTEXT.md` changes if no earlier commit carried them.
