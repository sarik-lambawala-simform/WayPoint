# 09 — The CLI timeout is too tight for a long message

**Type:** defect

**Status:** completed

**Completed at:** 2026-09-17T23:15:17Z

**What to build:** a `claude-cli` pass stops going red on a filing call that took longer than four
minutes, so a timeout reads as a timeout rather than as a finding about the box.

**Reproduces:** once in 48 rows, on the row carrying the longest single message. Not a box defect
and not a model defect. It is the harness.

## What happens

`L213` sends a wedding invitation forwarded whole:

> forwarded: With the blessings of elders, Chi. Kunal weds Chi. Sau. Riddhi on Sunday 22nd November
> 2026, Reception 7:30 pm onwards at Shree Sadan Party Plot, Satellite, Ahmedabad. Ronak is asking
> if we are going.

The row went red on `a real model answered`:

> call 2 (filing) model='claude-haiku-4-5' failed='ModelFailed: the CLI did not answer in 240s'

Nothing was filed, the Capture stayed queued, and every other check on the row passed, which is the
run being honest about a call that did not come back.

## Why

`harness/claude_code.py:38` sets the bound:

```python
# Long enough for a composition call on a slow evening. The CLI starts a whole Claude Code
# session per call, so this is several times what the API alone would need.
CALL_TIMEOUT_SECONDS = 240.0
```

The comment is about a composition call, which is the longest call the box makes. A filing call on
this Vault is far smaller, so four minutes is generous in the ordinary case and this row still spent
it. Whether the message caused it or the evening did is not settled: one occurrence is not a rate.

The reason it matters is what it costs a pass. This is the check that stops a false green, per
`checks.py`, so it cannot be softened. A pass that goes red on its own shim wastes a person's
reading on a row that says nothing about the box, and the phase 10.85 index already carries two
tickets of exactly this kind: ticket 05, where the harness ran the wrong tier, and ticket 07, where
the free dry run was red by construction.

## What to change

Two things and they are separate.

The bound is raised, or read from an environment variable with 240 as the default, so a slow
evening does not cost a row. This is one constant.

A timeout is told apart from an answer in the report. `a real model answered` stays as it is, and
the row prints why it failed in a form a reader can see at the top rather than in the observations.
A pass ending `1 fail` reads as a finding, and this one was not.

Before either, re-run `L213` on its own five times and put the rate in this ticket. If it times out
every time, the message is the cause and that is a different ticket about the size of a forwarded
block reaching the filing prompt.

## The rate

`L213` was run five times alone, `python -m harness.live --only L213`, in `claude-cli` mode on
`claude-haiku-4-5`. **It timed out 0 of 5.** Every run passed every check.

| Run | Calls | Whole row |
| --- | ----- | --------- |
| 1 | 2 | 2m29s |
| 2 | 3 | 1m29s |
| 3 | 3 | 3m02s |
| 4 | 3 | 2m28s |
| 5 | 2 | 2m26s |

The whole row is two or three calls, so one call is well under a minute on a normal evening and
the slowest row of the five spent 182 seconds on three of them. The message is not the cause. One
occurrence in 48 rows is the evening, which is what this ticket assumed and now has a number for.
There is no second ticket about the size of a forwarded block.

The bound was both raised and made settable, rather than one or the other. The default is now 600
seconds and `MEMARK_CLI_TIMEOUT_SECONDS` moves it. A default left at 240 would still lose a row to
the next slow evening, which is the thing this ticket is about, and the variable is what a slower
machine needs on top of that.

## Done when

- [x] `L213` is run five times alone and the rate is in this ticket.
- [x] The timeout is raised or made settable, and the comment says what the number is for.
- [x] A row that failed on a timeout says so in the printed row rather than only in the call line.
- [x] `a real model answered` is unchanged, because it is the check that stops a false green.
