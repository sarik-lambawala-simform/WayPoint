# 04 — One edit may carry a Task and a day, and code refuses the pair

**Status:** done

**Reproduces on Haiku:** structural, always. The measured cost is 1 of 4 runs of one ordinary
message filing nothing at all.

`remind me to ping Mehul about office seating tomorrow` is a Task and a day in one sentence. The
prompt describes both fields as separately true of it and never says an edit may carry only one.
Code refuses the pair. When the model writes one edit instead of two, the Capture files nothing,
and the person is told it was not filed.

## What happened

Not from the pass. Found on 2026-09-08 in a running harness window, so read the count below as a
hand probe and never as a pass row.

The message was `Went to office today. Quite a tiring day. Remind me to ping Mehul about office
seating tomorrow.`, sent on 2026-09-07. The filing run logged:

```
INFO memark.vault.apply: refused a date proposed about 'Mehul': it proposes a day and a Task at
once, and a dated line has no checkbox
INFO memark.run: filing run: queued=3 batches=1 drained=2 cards_created=1 refused=1 held_back=0
```

One edit for that Capture, carrying `task: true` and `date: 2026-09-08` together. It was the only
edit that Capture had, so the refusal took the errand and the day with it. The block kept no
`filed::` field and that evening's Digest listed it under `**Not filed**`:

```
**Not filed**
5. Went to office today. Quite a tiring day. Remind me to ping Mehul about office seating tomorrow.
```

The person reads that as the box declining to file an ordinary reminder, which is what it looks
like from the chat.

## Why code refused it

`memark/vault/apply.py:1626`, in `_a_proposed_date`:

```python
if edit.task:
    raise Refused("it proposes a day and a Task at once, and a dated line has no checkbox")
```

The refusal is right and is not the defect. ADR 0011 put dates in Date Files and ADR 0026 fixed the
grammar of a line, and a Review Date line has no checkbox to tick. One edit cannot be both, so the
Task belongs on a Card and the day belongs in a Date File, which is two edits.

## Why the model wrote one edit

`INSTRUCTIONS` never states the rule. Three places between them make the pair look correct.

`memark/distillation.py:328` describes `task` on its own:

```
- `task` is true when the line is something to do.
```

`memark/distillation.py:388` describes `date` on its own:

```
- `date` is the day a Capture is about, as `YYYY-MM-DD`, and it is how you propose a date.
```

Both are true of `remind me to ping Mehul tomorrow`. It is something to do, and it is about
tomorrow. The schema descriptions at `memark/distillation.py:196` and `memark/distillation.py:220`
read the same way, one field at a time, with nothing saying the two are exclusive.

The split is shown once and never stated, at `memark/distillation.py:404`:

```
- A day is proposed even when most of the Capture is about something else. `cant remember if i
told priya abt the deck deadline movin to the 4th` asks for two edits, not one: the errand as a
Task on Priya's Card, and the 4th as its own date proposal on Priya with `text` as `deck
deadline`.
```

That example carries the whole rule. It works when the errand and the day belong to different
things, as they do there: the deadline moved, and telling Priya is the errand. It carries nothing
when they are the same thing, which is the ordinary case. In `remind me to ping Mehul tomorrow`
there is one thing, and the day is when to do it, so an edit that is both reads as the honest
answer rather than as a rule broken.

## What it costs, and what it does not

Per `memark/filing.py:25` a block with no `filed::` stays in the queue, so the next filing slot
sends it again. It healed itself here on the next run, commit `d1999fc` in the harness Vault:

```
people/mehul.md             + - [ ] ping Mehul about office seating · from:: [[inbox/2026/09/2026-09-07#^4da9]] ^cc25
dates/2026/09/2026-09-08.md + - ? [[Mehul]] office seating · from:: [[inbox/2026/09/2026-09-07#^4da9]] · proposed:: 2026-09-08
```

So the cost of one occurrence is a delay, one wasted model call, and one `**Not filed**` line in a
Digest the person already read. Nothing is lost and no wrong line is written. That is why this is
filed as a prompt gap and not as a data-loss ticket.

Two things stop it healing quietly. A Capture the box files nothing for is not parked by the retry
path, only by the Digest asking about it `PARK_AFTER` times, so a message the model keeps combining
is retried at every slot and pays a call each time. And the person is told it was not filed on the
evening it happens, whatever the next run then does.

## Reproduction

No checked-in scenario covers it. The probe was a `LiveDriver` on `baseline`, clock at
`2026-09-08T09:00:00+05:30`, one `send`, then `step(FILING)`, reading `driver.edits()`.

| Run | What came back |
| --- | -------------- |
| the harness window | one edit, `task: true` with `date: 2026-09-08`. Refused |
| 1 | two edits, the Task plus a separate date proposal |
| 2 | one Task, no date |
| 3 | two edits, the Task plus a separate date proposal |

One in four on `claude-haiku-4-5`. No row reaches five of five, and that is why this is filed on
the structural gap the way ticket 01 is. The gap holds on every call: code enforces a rule the
prompt never states, and the one example that implies it is an example where the errand and the day
belong to different subjects. The rate is what that costs.

Run 2 is worth noting for whoever fixes this. It filed the Task and proposed no day at all, so the
`tomorrow` was dropped. That is the failure the rule in ticket 01 is about and not this one, but a
fix that only says "never both" and does not say "so propose two" would turn every occurrence into
that.

## How to fix it

State the rule in `INSTRUCTIONS`, beside the `date` rules where the day words already live. It
needs to say two things and not one: an edit that carries a day carries no checkbox, and a Capture
that is an errand with a day asks for two edits, the Task on its subject's Card and the day as its
own proposal on the same subject. A worked example on a message where the errand and the day are
one thing, which is what the deck-deadline example is not.

Nothing in code changes. The refusal at `apply.py:1626` is correct and the schema already allows
both edits.

## Done when

- [x] `INSTRUCTIONS` states that an edit carrying a `date` carries `task: false`, and that an
      errand with a day is two edits rather than one.
- [x] The worked example is a message where the errand and the day are the same thing, such as
      `remind me to ping Mehul about office seating tomorrow`.
- [x] A scenario for that message is in `harness/live/scenarios_p05.py`, checking both that the
      Task landed on the Card and that a Proposed Date was written for the day.
- [x] `python -m harness.live.repeat` on that row reports 5 of 5, with no run refused and no run
      dropping the day.
- [x] `pytest`, `mypy`, `ruff check` and `ruff format --check` are green.

## Comments

Fixed. `INSTRUCTIONS` gained two bullets below the four day rules ticket 01 left. The first says
an edit that names a day carries `task` as false, and says why: a dated line has no checkbox on
it, so code refuses the pair and that Capture files nothing at all. The second says the errand
and the day are two edits even when they are the same one thing, which is the half a rule saying
only "never both" would leave out. Run 2 of the probe in this ticket filed the Task and dropped
the day, and that is the failure the second bullet exists to stop.

The two schema field descriptions changed too. `task` and `date` are read one at a time and
neither said the other was out, which is how one edit came back carrying both. Each now names the
other.

Nothing in code changed. `apply.py:1626` is untouched.

### The worked example and the scenario are different messages

The example in the prompt is `remind me to call Rob about the van tomorrow`. Rob is already in
`INSTRUCTIONS` as the person in the dormant example, so the example introduces nobody new.

`L35` sends `remind me to ping Priya about office seating tomorrow`. Two changes from the message
written above, and both were needed.

The person is Priya and not Mehul because `baseline` has a Registry row for Priya and none for
Mehul, and a Task about somebody with no row is refused whatever the prompt says. That is a
second defect, filed as ticket 05, and running `L35` on Mehul would have measured that one
instead of this one. The errand words are the ticket's own.

The scenario message is not the prompt's example, for the reason ticket 01 gives for its weekday
examples: a row that can be answered by copying the prompt scores the copying and not the rule.

### What was run

`python -m harness.live.repeat L35 --runs 5` reports 0 of 5 reproduced, all five coming back as
a Task plus 2026-08-28. `python -m harness.live --only L35` passes, with the Task on
`people/priya-colleague.md` and a `- ? [[Priya (colleague)]] office seating` line in
`dates/2026/08/2026-08-28.md`.

Both ran in `claude-cli` mode, which is what `MEMARK_ANTHROPIC_API_KEY` not being set in this
session leaves. `repeat.py` labels the rows `claude-haiku-4-5` because that is the model id it
sets, and the CLI answered on `claude-sonnet-5`. So the 0 of 5 is not the Anthropic API on Haiku
and should be re-run as `MEMARK_PASS_MODE=live` when a key is available.

`pytest` (955), `mypy`, `ruff check` and `ruff format --check` are green. `mypy` needed three
pre-existing errors in `harness/server.py` cleared to be green at all: `server.session` was
annotated by an ignore on the wrong line. A local variable holds the session now and two of the
three ignores are gone.
