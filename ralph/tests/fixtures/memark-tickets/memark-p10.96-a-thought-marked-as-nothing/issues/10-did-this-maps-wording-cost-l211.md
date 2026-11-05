# Did this map's wording cost `L211`?

Type: grilling
Status: resolved
Blocked by:
Resolved by: the run of 2026-09-24 and a grilling with the user; the loss is this map's, and ticket 11 fixes it

## Question

Ticket 08 measured the regression side and one row moved. `L211:lost` went from **3 of 5 to 5 of
5**: every run dropped the `gpay` payment out of
`paid ramaben 8k by gpay for this month, next month se 8500 karna hai` and drained the Capture
anyway. That is the silent loss ADR 0044, a Capture is drained by coverage and not by writes alone,
exists to stop, and it is now the whole of five runs.

This map changed two prompt bullets in `memark/distillation.py` and rewrote a third. The question
is whether they cost this row, and it cannot be read off the rates.

**The before number is not a clean before.** 3 of 5 is phase 10.9's, from
[../../memark-p10.9-nothing-to-file-is-not-nothing-to-do/issues/04-a-fact-is-dropped-and-its-capture-drains-anyway.md](../../memark-p10.9-nothing-to-file-is-not-nothing-to-do/issues/04-a-fact-is-dropped-and-its-capture-drains-anyway.md).
It was taken before ticket 02's standing bullet and before ticket 01's `skip` pair, and nothing
measured the row in between. `L223:lost` moved the other way over the same gap, 3 of 5 to 2 of 5,
which is also what five-run noise looks like.

**Read the partitions before the rates.** The useful question is which piece the payment clause
landed in and what mark it carried. Two readings, and they want opposite fixes.

- The clause is inside a `skip` piece. Then the narrowing this map wrote did reach a real claim, and
  the finding is ours.
- The clause is inside a `claim` piece some other edit came from, so the reassembly check passes on
  coverage while the payment is written nowhere. Then this is phase 10.9's defect unchanged and the
  rate is noise, and the row belongs to that map.

## How to tell them apart

Re-measure with a marked probe, not the `:lost` one. `L211:lost` reads only whether the words were
proposed. Nothing reads the mark the payment clause carried, which is the fact this ticket turns on.

A `git stash` of the three bullets and five runs of `L211:lost` on the old prompt gives a clean
before on the same clock. That is the cheaper half and it settles attribution on its own.

## Do not re-word the prompt here

If this map's wording did cost the row, the fix is a fresh attempt with the constraint ticket 06
set: never put a test row's own words into the prompt. If it did not, say so and hand the row back
to phase 10.9's map.

## Answer

**Yes, this map's wording cost the row.** Measured on 2026-09-24, five runs on each prompt at the
same time, with a new probe, `L211:where`. The tables are in [../finding.md](../finding.md).

| | the payment piece marked `skip` | payment lost, its Capture drained |
| - | ------------------------------- | --------------------------------- |
| old prompt | 1 of 5 | 0 of 5 |
| this map's prompt | 5 of 5 | 3 of 5 |

The first reading is the true one. The payment clause sat in its own piece and carried `skip`.
The second reading, phase 10.9's defect, turned up on 0 of 10 runs, so nothing goes back to that
map.

`L211:lost` could not have told us. Its drain half reads every Capture in the Vault, and this
fixture drains seventeen on every run, so it scores `bad` whenever the word is missing. The row
is not edited. `L211:where` reads the message's own block, and it sits beside it.

**Decided with the user:**

- **A payment record stands.** The person typed it to keep it. `did I pay her this month?` is a
  question the Vault should answer.
- **The durability test is asked of claims about the person and nothing else.** The prompt already
  scoped the question to `a claim about the person`, and the `skip` bullet then named `a claim the
  question above turned down` without the scope, so it leaked onto Ramaben's payment. Widening
  what stands was turned down, because it would put every event the person did on `Me`. ADR 0047
  is untouched.
- **`L211:where` is a guard from here on**, beside `L300:mark` and `L301:mark`. Bar 0 of 5 lost.

ADR 0048, `skip` means the words hold nothing that stands, gains a section, "The test is asked of
the person only", and names the new guard in its cost section. `CONTEXT.md`'s **Durability Test**
entry gains the scope sentence.

Per this ticket the prompt is not re-worded here. That is
[11-say-the-durability-test-is-for-the-person-only.md](11-say-the-durability-test-is-for-the-person-only.md).
