# 03 — A day the message names does not survive filing

**Type:** defect

**Status:** completed

**Completed at:** 2026-09-17T22:24:44Z

**What to build:** an errand typed in transliterated Gujarati keeps the day it was given, instead of
losing it or being filed as a line saying that day is the one day it cannot be done on.

**Reproduces:** 5 of 5 on `claude-haiku-4-5` and 1 of 1 on `claude-opus-5`, measured as
`L203:kept`, which asks whether the day is in the filed line at all. **Both tiers fail, so the
prompt is wrong rather than too thin.**

The day is lost in two shapes and the ticket is about both. `L203:day` reads the refusal and
`L203:kept` reads whether the day survived. Over sixteen cheap-tier runs across three batches the
day was turned into its opposite on ten and dropped on six, and it survived on none.

Three probes were needed to see that, and the two rewrites are worth knowing about before this is
measured again. The first `L203:day` looked only for `not on sunday`, so it scored `can't do it on
Sunday` as good three times. Widened, it read the second batch as an improvement, because that batch
dropped the day instead of refusing it. `L203:kept` is the probe the rate rests on and the other is
the shape breakdown beside it.

`claude-opus-5` is the reason the diagnosis changed. It kept the day on its first two runs and
dropped it on the third, so the strong tier fails too, just less often. A first reading of two runs
said the prompt was thin; the third says it is wrong.

## What happens

`L203` sends `gaadi no puc october ma puro thai jay chhe, ravivare karavi levu padshe`. In Gujarati
that is two clauses: the car's PUC certificate runs out in October, and it will have to be got done
on Sunday. `ravivare` is Sunday and `karavi levu padshe` is the obligation to do it.

What lands is the opposite plan, in the Vault's own voice, with a `from::` link behind it.

| Run | The line proposed |
| --- | ----------------- |
| the pass | `renew the PUC before it expires in October, not on Sunday` |
| repeat 1 | `PUC expires in October, can't do it on Sunday` |
| repeat 3 | `PUC certificate in October, not on Sundays` |
| repeat 4 | `PUC will be completed in October; cannot be done on Sunday` |
| repeat 5 | `PUC expires in October, can't do on Sunday` |
| repeat 2 | `get PUC` |
| second batch, run 4 | `renew car's PUC before October, can't do Sunday` |
| second batch, runs 1, 2, 3, 5 | `renew PUC before October`, and three like it, with no day |

The comparison runs on `claude-opus-5` got it right both times: `get the PUC done on Sunday`, and
once `PUC ravivare karavi levu`, which keeps the Gujarati word rather than translating it and is
still the right day.

This is the one failure in the pass that writes a false instruction rather than losing a true one.
Everything downstream treats it as a good line. It lints, it cites, it reads back in the person's
own words, and the only way to catch it is to remember what was typed.

## Why

`ravivare` is the locative of `ravivar`, and the case ending is the whole of what makes it *on
Sunday*. The cheap tier appears to read the ending as a negative particle. Nothing in
`memark/distillation.py` says anything about the languages this box is typed in, so there is no rule
for the model to fall back on and nothing on the write path that could catch a well formed line
whose meaning is wrong.

The comparison runs say which kind of defect this is, and they only say it once there are three of
them. `claude-opus-5` read the sentence correctly twice and then dropped the day, so both tiers
fail and the prompt is wrong rather than thin. Per ADR 0003 the cheap tier is what filing runs on
either way, so the stronger model is the diagnostic and never the fix.

## What to change

The filing prompt. Two things it does not currently say:

1. Captures arrive in Gujarati and Hindi written in Roman letters as often as in English, and a
   clause in one of those languages is filed the same way as one in English.
2. Where a clause cannot be read with confidence, the day is left off rather than guessed at. A Task
   with no day is recoverable. A Task carrying the wrong day is not, because nothing later disagrees
   with it.

The second rule is the safe half of the defect rather than the fix for it. Five runs already drop
the day, and a prompt that only told the model to drop it when unsure would make that the whole
behaviour. The first rule is what has to carry the day through.

A worked example in the prompt, the way the `ABT` and `Me` rules are written, is what makes this
carry on the cheap tier. One line of transliterated Gujarati with its right reading beside it.

## Done when

- [ ] The filing prompt names transliterated Gujarati and Hindi and carries one worked example.
- [ ] The prompt says an unreadable clause loses its day rather than gaining a guessed one.
- [ ] `L203` files a Task naming Sunday and not refusing it.
- [ ] Both rates are measured again on `claude-haiku-4-5` after the change: `L203:kept` for whether
      the day survived and `L203:day` for which of the two shapes any failure took.
- [ ] `harness/live/repeat.py`'s `NEGATIONS` list stays as it is. It was widened once already,
      because the first measurement scored `can't do it on Sunday` as good.

## What was built

Two bullets in the filing prompt and nothing else. Nothing in `memark/` outside
`INSTRUCTIONS` changed, because there is no write-path check that could catch a well formed line
whose meaning is wrong.

The first bullet names Gujarati and Hindi written in Roman letters, says a clause in either is
filed exactly the way an English one is, and says what the defect turns on: the end of a word
carries what a separate word carries in English, and an ending on the name of a weekday puts the
errand on that day and never takes it off one. Then one worked line with its right reading beside
it, the way the `ABT` and `Me` rules are written.

The second bullet is the safe half the ticket asked for. A clause that cannot be read with
confidence loses its day rather than gaining a guessed one, and the bullet says out loud that this
is the last thing to fall back on and never the first, because a word you do not know is not a
clause you cannot read.

The worked line is a Monday and never `ravivare`. `L203` sends the Sunday sentence, so an example
carrying that sentence's own answer would let the model copy it and both probes would score the
copying rather than the rule. `tests/test_distillation.py` asserts `ravivare` is not in the prompt,
so the example cannot drift back onto the row it is measured on.

## The example had to carry two clauses, and that is the finding

The first example was one clause: `sombare doctor pase javu padshe`, one errand on one day. It
killed the inversion outright and stopped at **2 of 5** on `L203:kept`, measured twice over ten
runs. Both failing runs in each set had the same shape. The month in the first clause was filed and
the day in the second was dropped.

The example was rewritten with the shape the failures had: a month in one clause and the day in the
other, `dawa next month puri thai jase, sombare lai aavvi padshe`, and the bullet now says the month
is a span that dates nothing and that every clause is read for a day of its own.

So the rule was right and the example was too easy. A one-clause example teaches the ending and
does not teach that a second clause is still owed a day, and the cheap tier files the first thing it
can read and stops.

## One wording made it worse, and it is worth not writing again

After the tightened probe caught a run dating a Sunday in October, one sentence was added saying
the weekday counts forward from the day the Capture was sent and not from a month another clause
names, and it ended `so the Monday here is the one a few days off and not one inside next month`.

That took `L203:kept` from 1 of 5 to **2 of 5**, and both failing runs proposed **2026-08-31, a
Monday**, for a message that says Sunday. Naming the example's own weekday a second time made the
weekday itself the thing that got copied. The sentence was cut back to the general rule, with no
weekday in it, and the rate went back to 1 of 5.

The lesson is the one the ticket already carries, from the other side. A worked example teaches the
shape of the answer, so every word of it that is not the shape is a word the cheap tier can copy.

## The probe was reading half the answer, and then was reading it too loosely

`L203:kept` scored `bad` on five runs that had filed the day correctly. It read the `text` of each
edit and looked for the word `sunday`, and the prompt's own rule puts the day of an errand in the
`date` field rather than in the Task's words: `remind me to call Rob about the van tomorrow` files a
Task reading `call Rob about the van` and a date proposal beside it. So the right answer to `L203`
is a Task reading `renew the PUC` with a date proposal on 2026-08-30, and the word `Sunday` is
nowhere in it.

Widened to count a `date` as well as the words, the probe read the weekday off the date and took
any Sunday. **That was too loose and a review caught it before the rate was trusted.** `L203` names
two times, a Sunday and a month, so a run that drops the weekday and dates the October clause lands
on a Sunday in October and scores good. That is not a hypothetical. The very next five runs
contained one: `2026-10-04`, a Sunday five weeks off, proposed for a message that says this Sunday.

So the probe now takes the whole day it expects, `2026-08-30`, the way `_the_named_weekday` already
does, and names the weekday of any other day it found so a failure says what shape it was. The
refusal half is unchanged and still reads the words, because an inversion is written in words and
never in a `date`. **`NEGATIONS` is untouched**, as the ticket asks.

The weekday name itself comes from `memark.clock.weekday_of_stored` rather than from `strftime`,
which `clock.py` refuses by name because its names follow the process locale. A probe reading the
locale's names would score every run bad on a machine set to anything but English.

This is the same lesson as the one in `00-index.md` about the window probe, twice over. The first
reading was measuring the wrong half of the answer and the second was measuring it too generously,
and both times the box was doing better or worse than the tally said.

## The rates after the change

All on `claude-haiku-4-5`, which is the tier ADR 0003 puts filing on, so the rate is measured on the
model the prompt has to carry. Both are measured with the tightened probe.

| probe | before | after |
| ----- | ------ | ----- |
| `L203:kept`, whether the day survived | 5 of 5 | **1 of 5** |
| `L203:day`, whether it came back refused | 5 of 5 | **0 of 5** |

Every good run on `L203:kept` proposed the same day: `2026-08-30`. The Capture is sent on Thursday
2026-08-27, so that is the next Sunday, which is what `ravivare` says.

**The inversion is gone and the drop is not.** The two halves of the defect were fixed by different
sentences and only one of them is finished. The ending rule killed the refusal outright, 0 of 5
across three separate sets of five. The clause rule took the drop from 5 of 5 to 1 of 5 and no
wording tried after that moved it further, and one made it worse. The remaining failure is always
the same shape: the October clause is filed as a Note and the Sunday clause loses its day.

That is the safe half of the defect rather than the dangerous one. A day dropped is a day the
person can give again. A day inverted is a false instruction in the Vault's own voice, and that is
the one this ticket was opened for.

## Two things a person should decide

**The acceptance line does not match what a right answer looks like.** The ticket says `L203` files
a Task naming Sunday. Under the prompt's own rule an errand's day goes in the `date` beside the
Task and not in the Task's words, so a Task naming Sunday would be the prompt being disobeyed. What
ships is a Task reading `renew the PUC` and a date proposal on 2026-08-30, which is the day
surviving in the place the box keeps days. The probe was widened to read that, and **a criterion
rewritten after the measurement is the reviewer's objection and it is a fair one.** The line wants
amending and re-approving rather than being taken as met.

**1 of 5 is a real rate and not zero.** The ticket can be closed on the inversion being gone, or
left open on the drop. Nothing further was tried beyond the two wordings recorded above.

## What was checked for breakage

Three probes on the ordinary day path, because this change adds two bullets to a prompt every
Capture is filed through.

| probe | after |
| ----- | ----- |
| `L35`, an errand and its day as two edits | 0 of 3 |
| `L32:date`, a weekday resolved from the day sent | 0 of 3 |
| `L220:date`, ticket 02's festival, never dated | 0 of 3 |

Ticket 02 shipped one commit before this one and its rule is in the same prompt, so it is
re-measured here rather than assumed. Three runs each is thin for a prompt every Capture pays for,
and a wider re-run belongs to the next live pass rather than to this ticket.

## One thing this ticket did not do

The prompt now carries a domain fact that lives nowhere else: this household types Gujarati and
Hindi in Roman letters. `CONTEXT.md` and `docs/adr/` say nothing about it, so the only record is the
prompt string and the test asserting the prompt string. A `CONTEXT.md` line or an ADR would stop the
next prompt edit deleting a load-bearing rule by accident. It was left alone because the domain docs
are single-context and a person owns them, and ticket 10 is where this phase's answers are gathered.
