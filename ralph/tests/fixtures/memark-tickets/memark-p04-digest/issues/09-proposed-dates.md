# 09 — Proposed Dates: the agent proposes, the Digest asks, nothing fires

**What to build:** a date the agent thinks it found sits inert until I confirm it, and a date I turned
down is never offered to me twice.

A Proposed Date is inert, per ADR 0012, which decided that a date the agent infers does nothing until a
human confirms it. It is written into its Date File marked `?`, it fires on no day whatever its schedule
says, and the Digest asks about it in one numbered line.

This is where phase 3's edit schema gains date proposals. The write path grows one more kind of target
and every rule already governing it applies unchanged: the same lint gate, the same Stale Target check,
the same refusal counts, the same undrained Capture when a proposal is refused. Nothing about the write
path is special-cased for dates.

A rejection is recorded as an `x` line in the Date File so the same inference is not offered again. The
`x` mark is already reserved for this in the Date File grammar from phase 1.

Until phase 5 lands the typed Commands, confirming a Proposed Date is a hand edit and the Digest repeats
its question. That is a known temporary gap and not a bug to design around here.

**Blocked by:** 02 — One Digest a day: code assigns the numbers, the model writes the words.

**Status:** completed

**Completed at:** 2026-09-02T08:30:03Z

- [ ] A Capture naming a date produces a `?` line in the right Date File through phase 3's write path.
- [ ] A `?` line fires on no day, whatever its Notice Schedule says.
- [ ] The Digest asks about it in one numbered line, and the footer maps that number to its line.
- [ ] A proposal refused by the write path is counted like every other refusal, and its Capture stays
      undrained.
- [ ] An `x` rejected line means the same inference is not proposed again.
- [ ] Fixtures added: a Proposed Date, and a rejected `x` line.
