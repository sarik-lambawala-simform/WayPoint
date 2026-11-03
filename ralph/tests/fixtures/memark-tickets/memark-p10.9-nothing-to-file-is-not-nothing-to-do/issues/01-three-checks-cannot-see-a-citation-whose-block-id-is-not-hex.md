# 01 — Three checks cannot see a citation whose block id is not hex

**Type:** defect

**Status:** completed

**Completed at:** 2026-09-17T19:38:11Z

**What to build:** the harness reads a `from::` link whatever the block id is spelled with, so the
checks that guard the drain rule stop being blind on the fixture three phases have been measured on.

**Reproduces:** every run, and not a model defect. It is one regex. It produced three false failures
in this pass and it has been hiding the same checks' real answers since the Indian fixtures were
written.

## What happens

Three rows of the regression went red on the same check:

| Row | What it said |
| --- | ------------ |
| `L46` | `^m102 landed 0 of 1 and still drained; ^m106 landed 0 of 1 and still drained` |
| `L47` | `^m205 landed 0 of 1 and still drained; ^m206 landed 0 of 1 and still drained` |
| `L48` | `^m302 landed 0 of 1 and still drained` |

The box was right on all three. `L47`'s line landed exactly as it should have:

```
- [ ] call the garage · from:: [[inbox/2026/08/2026-08-26#^m205]] · from:: [[inbox/2026/08/2026-08-26#^m206]] ^a638
```

One errand said twice, filed once, citing both Captures. The check counted zero citations on that
line.

## Why

`harness/live/checks.py:110`:

```python
CITED = re.compile(r"from:: \[\[inbox/\d{4}/\d{2}/\d{4}-\d{2}-\d{2}#\^([0-9a-f]+)\]\]")
```

The id has to be hexadecimal. The box generates hex ids, so this was right about everything the box
writes. It is wrong about what the fixtures carry: **48 of the 212 block ids checked into
`tests/fixtures/` are not hex**, because they are written by hand as `m205`, `h101`, `j102`, `k103`.
`m` is not a hex digit, so the pattern matches nothing on any line citing one.

`CITED_IN_A_FILE` at line 1561 has the same `[0-9a-f]+` and the same blind spot.

Three checks read through those two patterns:

- `citations_resolve`, which is `every citation resolves` in `COMMON`. On a line citing a hand
  written id it sees no citation, so it has nothing to resolve and passes. It cannot report a broken
  `from::` on any such line.
- `citations_of_each_capture`, which is what `a_capture_owed_an_answer_kept_no_mark` compares
  against the proposals. It counts zero, so a Capture that landed its line reads as one that did
  not. That is the false failure above.
- `_cited_anywhere`, which is how `every_unlinked_capture_is_in_the_answering_prompt` decides which
  Captures nothing points at. A Capture whose citation is invisible is read as unlinked.

## Why it matters more than three rows

`tests/fixtures/an-indian-life` uses these ids throughout, and it is the Vault phases 10.7, 10.8 and
10.85 did most of their measuring on. So for three passes those three checks have been reporting on
part of the Vault rather than on all of it, and nobody could tell, because a check that sees nothing
passes.

This pass's own numbers are affected and the spec says so: `every citation resolves: 15 citations,
all resolve` on a row whose Vault also carries the life fixture's own links, which were not among
the fifteen.

It reached the surface now because the model started merging two Captures into one line. That put
`proposed` above `landed` for the first time on these rows, and a check that had been quietly
vacuous became loudly wrong. Model variance revealed it; it was there all along.

## What to change

Both patterns take the id the grammar allows rather than hex. Read what a block id may be from
`memark/vault/grammar.py` rather than writing a third spelling of it here, so the harness and the
box agree by construction.

Then re-run the three rows. They should pass, and their passing is the proof.

## Done when

- [x] `CITED` and `CITED_IN_A_FILE` accept every block id the grammar allows.
- [x] The id pattern is imported from the box rather than written again in `checks.py`.
- [x] `L46`, `L47` and `L48` pass.
- [x] A test asserts `citations_of_each_capture` counts both links on a line carrying two `from::`
      fields with hand written ids, because that is the exact line that was miscounted.
- [ ] The next pass's `every citation resolves` reports a count that includes the life fixture's own
      links, and the number is written in the index so a later drop is visible.

## What was measured

`L46`, `L47` and `L48` were re-run on `claude-cli`, filing on `claude-haiku-4-5` and judgement on
`claude-sonnet-5`. **3 pass, 0 fail.** The whole bundle was then run in `auto` mode, which calls no
model and is what exercises the widened pattern on all 246 rows: **246 pass, 0 fail.**

A third pattern had to move with the two the ticket names. `ID_AT_LINE_END` is the same
`[0-9a-f]{4,}` and it is the set `citations_resolve` resolves against, so widening `CITED` alone
would have turned three silent passes into three loud dangling reports on ids the inbox really
carries. All three now read the grammar's `BLOCK_ID_PATTERN`.

**The last criterion rests on something that is not true, and this is the correction.**
`tests/fixtures/an-indian-life` carries no `from::` link at all. Its hand written ids are Capture
block ids in inbox files, not citations. Every citation in the seeded Vault is in
`an-indian-household` and every one of them is hex, so `every citation resolves` still reports
`15 citations, all resolve` on `L201` and that count is right rather than short. The blindness was
real and it was on the phase 6 fixtures, where the box writes a `from::` pointing at a hand written
Capture id: `a-messy-real-day`, `a-day-that-barely-parses` and `a-day-in-two-halves`, which is
exactly the three rows that went red. The number to watch for a later drop is **15 on `L201`**, and
it is written here rather than in `00-index.md` because the ticket runner owns that file.

## Comments

The run marked this `blocked` and the work was finished. The runner fails a ticket whose end leaves
a file dirty, and the dirty file was `run-ralph-tickets.sh`, edited by hand at 00:44 while this
ticket was running. That edit was committed as `cd81669`, which is why the wip commit here carries
the runner and none of this ticket's work. The fix itself is `f166526` and the renames are
`33a6c35`. Re-checked after the run: `MEMARK_PASS_MODE=auto python -m harness.live` gives 247 pass,
0 fail.
