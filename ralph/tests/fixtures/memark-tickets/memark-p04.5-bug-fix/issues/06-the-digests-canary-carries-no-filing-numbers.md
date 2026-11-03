# 06 — The Digest's Canary carries no filing numbers, because the run that speaks never files

**Status:** completed

**Completed at:** 2026-09-03T12:51:23Z

**Owned by:** phase 4. `memark/run.py` and `memark/canary.py`.

**Found by:** the phase 1 to 4 integration pass, scenarios A15 and A20.

## What happens

`canary_for` is handed the `FilingReport` of the run it is in. A run that is not in a filing slot
hands it an empty one, so every filing-derived count reads zero, and the Canary shows only what is not
zero.

The run that speaks is the first one past the Digest hour. With the defaults, a Digest hour of 20:00
and a filing interval of three hours, the filing slots fall at 00:00, 03:00 and so on to 21:00. The
run at 20:00 speaks and 20 is not a multiple of 3, so it files nothing. The two clocks never coincide.

So on a default box, every Digest's Canary is missing:

- Captures drained, edits applied, Cards written
- failed batches and failed Filing Runs
- Captures held back as Ambiguous Subjects or Contradictions
- edits rejected as Pinned Claim violations
- Stale Targets, and Cards that failed the format check
- parked blocks
- the Registry's row count and token size
- the line count of the largest Card

Which leaves `Runs clean, N of N. 0 rejected.` plus the selection counts. And `Runs clean, N of N` is
itself only ever this run's own knowledge: `canary.py` says v1 records nothing about what a run three
hours ago did. So the one filing line that does show is a guess, and it always reads clean.

A block parked at noon is the clearest case. Filing writes `filed:: parked` at 12:00 and the count
goes into that run's report, which nobody is sent. The 20:00 Digest reports `0` and shows nothing. The
block is gone from the queue and the person is never told.

## Reproduction

```python
from lib import Driver, FILING
from a_extra import BLOCK, edit

drive = Driver()
drive.reset("baseline")
drive.session.overlay("at-the-bound")  # one block already at fourteen asks
drive.at("2026-08-27T09:14")
drive.send("she wants a proper raincoat")
ids = BLOCK.findall(drive.inbox_for("2026-08-27"))

# The 12:00 filing slot: it drains one Capture and parks one block.
drive.at("2026-08-27T12:00")
filing = drive.step(
    FILING,
    answers=[
        {
            "edits": [
                edit(
                    "extend",
                    "Wife",
                    "person",
                    "Facts",
                    "she wants a proper raincoat",
                    [ids[0]],
                )
            ]
        }
    ],
)[0]
assert "drained=1" in str(filing.notes) and "parked=1" in str(filing.notes)

# The run that speaks, on a five-minute cron.
drive.at("2026-08-27T20:00")
job = drive.run()
assert job.result["digest_sent"] is True
canary = [one for one in drive.out() if one.notify][-1].text.split("\n\n")[-1]
print(canary)
# Runs clean, 7 of 7. 0 rejected.
# 1 Review Date due today.
```

Setting the filing interval to four hours puts a slot on 20:00, and the same day's Canary then reads:

```
Runs clean, 6 of 6. 0 rejected.
1 Capture filed.
1 Card written.
1 block parked.
1 Review Date due today.
Registry: 4 rows, about 71 tokens.
Largest Card: Priya (colleague), 19 lines.
```

which is scenario A20 and shows the counts themselves are correct. The defect is that the day's filing
is reported by the run that did it rather than by the run that speaks.

## What should happen

`.scratch/memark-p04-digest/spec.md`, story 23:

> (66) As someone who cannot supervise this, I want a Health Canary in every Digest showing only what
> is not zero, so that a Digest arriving is never by itself evidence that the run was sound.

And the list it names:

> The counts it tracks: failed Filing Runs, Captures drained, failed batches, edits applied, edits
> rejected as Pinned Claim violations, edits held back as Contradictions or Ambiguous Subjects, Stale
> Targets, Cards that failed the format check, Date Requests outstanding, message edits Telegram
> refused, the Registry's row count and token size, Review Dates due today, items the length cap cut,
> repeating rules that will never fire, parked blocks, the line count of the largest Card with its
> name, and whether any stage failed.

Story 26:

> (44) As someone who would rather watch a number than guess, I want the parts of the system that grow
> reported every day.

`.scratch/memark-p04-digest/issues/12-the-digest-asks-and-counts-the-asking.md`:

> - [ ] A block reaching fourteen asks carries phase 3's `filed:: parked` mark on the next run, and
>       the Canary counts it.

Every day means every day, and eleven of the sixteen counts reach a Digest only on a day whose
settings happen to make one run do both jobs. Nine of those numbers are the filing half of "was this
run sound", which is the half the Canary exists for.

Note that `canary.py`'s own note about `runs_clean` names the v1 limitation honestly:

> `runs_clean` accounts for this run's own failure and no earlier run's, because in v1 nothing records
> what a run three hours ago did.

That is the same gap seen from the other side. A day's Canary either reports the day or it reports one
run, and today it says `Runs clean, 7 of 7` about seven runs it knows nothing about while omitting
what the one run it does know about actually did.

## Actual behaviour

On the default clock grid, every Digest's Canary is `Runs clean, N of N. 0 rejected.` plus the
selection counts, whatever filing did that day. Confirmed clean at a four-hour filing interval, which
localises the defect to the two clocks rather than to the counts.

## The choice this ticket has to make

There are two shapes of fix and they are not equivalent, so whoever takes this decides and writes it
down.

The Canary can be made to report **the day** rather than **this run**. That needs the speaking run to
know what the runs before it did, and nothing records that. ADR 0020 says state is derived from files
the system already writes, so it would have to be derived: `captures_filed_on` already counts the
day's filed Captures off the `filed::` marks, and the same reading gives parked blocks. Some counts
have no file behind them at all, a failed batch and a Stale Target among them, so this shape cannot
report every number and has to say which it can.

Or the two clocks can be made to meet, so the run that speaks is also a filing run. That reports
every number exactly as it does today and changes when filing happens, which is a change to ADR 0024's
two clocks and needs saying out loud.

Pick one and say why in the commit. Do not do half of each.

## Done when

- [ ] On the default settings, a Digest hour of 20:00 and a three-hour filing interval, that day's
      Digest reports what the day's filing did.
- [ ] A block parked by the noon filing run is counted by that evening's Digest.
- [ ] Captures filed, Cards written and the Registry's row count and size reach that Canary, and so
      does the largest Card.
- [ ] Whatever cannot be derived is stated as a limitation in the code rather than reported as a zero.
- [ ] The Canary still shows only what is not zero, and the run count and the rejected count still
      always show, per ADR 0036.
- [ ] A day on which nothing was filed still sends a Canary, and it says nothing about filing rather
      than a row of zeroes.
- [ ] Nothing new is stored that the Vault does not already write, per ADR 0020, unless the fix is
      the second shape above and says so.
- [ ] The four-hour-interval case of scenario A20, where one run both files and speaks, reports the
      same numbers it reports today.
- [ ] A test at the scheduled run seam that files at one clock and speaks at another, because that
      separation is the whole defect.
