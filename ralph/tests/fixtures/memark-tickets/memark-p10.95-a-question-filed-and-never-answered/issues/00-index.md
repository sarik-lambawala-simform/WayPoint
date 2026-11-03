# Phase 10.95 issues

Seven findings from the live-model pass at the end of phase 10.9, and one found by hand at the box
afterwards. The pass ran the whole bundle, 294 rows, in `claude-cli` mode on the tiers ADR 0003
names for the box: `claude-haiku-4-5` for filing and `claude-sonnet-5` for judgement.
**273 passed and 21 failed.**

251 of the rows already existed and are the regression coverage. 43 are new, `L254` to `L296`,
written for the shapes an Indian household produces that no earlier row produces.

Every rate below was measured with `python -m harness.live.repeat`, which forces the tier onto that
model. **Two findings carry no rate and each says why in its own file**: ticket 02 is arithmetic in
`answering.py` and holds whatever any model answers, and ticket 04 is code that builds the same
list every run. Ticket 04 was filed as a grilling ticket, was grilled, and is now the defect the
answer turned it into.

**Ticket 08 did not come from the pass.** It was found by hand in the harness, so its own first job
was a probe that gives it one. It is here rather than on its own board because nothing on this board
blocks it and nothing it touches is open here. The probe it gained, `L297:confirmed`, then found a
second hole the write-up had missed: it still reproduced 3 of 5 with the fix the ticket described
already in. That is the case for taking a rate on a hand-found defect rather than only a fix.

| # | Ticket | Type | Status | Reproduces |
| - | ------ | ---- | ------ | ---------- |
| 01 | [Six checks cannot read the footnote phase 10.9 lengthened](01-six-checks-cannot-read-the-footnote-phase-10-9-lengthened.md) | defect | completed | every run, and not a model defect |
| 02 | [A forward window with only errands in it prints a footnote with a hole](02-a-forward-window-with-only-errands-in-it-prints-a-footnote-with-a-hole.md) | defect | ready-for-agent | every window of that shape, and not a model defect |
| 03 | [A question is answered with nothing and the person is told nothing](03-a-question-is-answered-with-nothing-and-the-person-is-told-nothing.md) | defect | ready-for-agent | `L242` 3 of 5 and `L82` 4 of 5 on `claude-sonnet-5`, 1 of 1 on `claude-opus-5` |
| 04 | [A plural makes a word one the notes never write](04-should-a-plural-make-a-word-one-the-notes-never-write.md) | defect | ready-for-agent | every run, and not a model defect |
| 05 | [The answering prompt never says the answer is always prose](05-the-answering-prompt-never-says-the-answer-is-always-prose.md) | defect | ready-for-agent | the same rates as ticket 03 |
| 06 | [A check demanded an answer for a message nobody asked anything in](06-a-check-demanded-an-answer-for-a-message-nobody-asked-anything-in.md) | defect | completed | every run, and not a model defect |
| 07 | [A claim in a long dump is lost and the Capture drains anyway](07-a-claim-in-a-long-dump-is-lost-and-the-capture-drains-anyway.md) | defect | completed | 2 of 5 on `claude-haiku-4-5`, and `L223:whole` 0 of 5 after |
| 08 | [A repeating Proposed Date cannot be confirmed in plain words](08-a-repeating-proposed-date-cannot-be-confirmed-in-plain-words.md) | defect | completed | 3 of 5 on `claude-haiku-4-5` with half the fix in, and `L297:confirmed` 0 of 5 after |

Where a comparison run on `claude-opus-5` is in a ticket, it is a diagnostic and never a fix. Both
tiers failing means the prompt is wrong. Only the cheap tier failing means the prompt is too thin
to carry it. Per ADR 0003 the cheap tier is what filing runs on either way.

## The one to read first

**Ticket 03.** A question costs a judgement call, the call comes back with an empty answer,
`answering.py:381` refuses it, `handler.py:742` swallows the refusal, and the person is left
holding this:

    Recorded: ?badminton coaching ki fees kitni thi club me

That is the same reply a thought gets. From the outside, a broken answer and a recorded thought
are three identical words. Six rows hit it and it reproduces on both tiers.

Ticket 05 is its other half, the prompt that allows the empty answer, and it is `Blocked by: 03`
on purpose. A prompt fix alone would lower the rate and leave the silent path exactly where it is.

## Two were built during the pass and both are the harness's own eyes

Tickets 01 and 06 are `completed`. Both are ticket 01 of phase 10.9's shape again: a check that
could not see what it was asserting about.

**Ticket 01 is the one worth reading twice.** Phase 10.9 added a sentence to the recall footnote
three tickets ago, per ADR 0045, and the six checks that read that footnote are anchored start to
end. Two of the six are in `COMMON`, so every row of every phase is held to them. The ones that
failed went red for the wrong reason. The ones that only compare got `None` and passed, which is
worse: an assertion that stopped asking.

**Ticket 06 is smaller and the same lesson.** `an_occasion_with_no_day_reached_the_cards` put a
reading in scope on a subject and an unresolved occasion alone, so `L54`, which names a person and
a season and asks nothing, was held to owing an answer.

## What the re-run said, including where I was wrong

The eight rows those two fixes should have touched were re-run: **5 pass, 3 fail.**

`L54`, `L140`, `L195`, `L280` and `L288` are green. `L117`, `L252` and `L253` still fail, all three
on ticket 02's hole in the footnote and none on the tail.

Ticket 01 was first written claiming `L252` and `L253` among the cured. That was wrong and the
ticket now says so. It also turned out to size ticket 02: the hole is not one odd row, it is every
forward window carrying errands and no notes, which was three of eight here.

## Watched, not filed

**A window resolved from a different calendar.** Four rows of the pass read a window matching the
real date rather than the Vault's. `?next week kya kya hai` on a Vault whose today is 27 Aug 2026
gave `2026-09-21 to 2026-09-27`, which is next week from 19 Sep 2026, the day the pass ran.
`?kal ka kya plan hai` gave `20 Sep 2026`.

**It did not reproduce on any row measured: 0 of 5 on `L239`, 0 of 5 on `L288`, 0 of 5 on `L117`.**
Nothing is filed, per the rule that one run is not a finding.

**The gap between the two runners is the real finding here, and it is about the instrument.**
`python -m harness.live` produced a wrong month seven times: four rows in the 294 row pass and
three more in an eight row re-run, and `L117` did it in both. `python -m harness.live.repeat`
produced it zero times in fifteen runs on those same rows. Both drive the same scenarios through
the same driver against the same model id. Until that is explained, a rate taken with `repeat` on
anything about dates cannot be trusted in either direction: it may be measuring a box that the
pass never ran.

The one difference already visible is that `repeat` forces the tier's model id through
`use_model`, which rebuilds the clients, where a pass uses the default. Whether that changes what
reaches the CLI is the first thing to read.

One other thing holds whatever the cause. The pass ran in `claude-cli` mode, where every call also
carries Claude Code's own system prompt stating the real day, so the model had two dates in front
of it. Only `MEMARK_PASS_MODE=live` settles whether a box sending one date does this, and that
needs `MEMARK_ANTHROPIC_API_KEY`.

**A URL is dropped.** `L260` pasted an IRCTC link with one line about why. The Note kept the time
and threw the link away. One run, no rate.

**A crossed out claim is shown in words the person did not type.** `L269` typed `ram a ben ne bola
kal nahi aa payegi` and the reply crossed out `ramaben ne bola kal nahi aa payegi`. The crossing is
ADR 0044 working. Whether it may paraphrase what it hands back is a question nobody has been asked.

**Half a claim about two people went without a mark.** `L265` said `jigu aur ronakbhai dono diwali
pe aa rahe hai`. Only Jignesh was filed. `ghar bhara rahega` was crossed out and Ronak was not.
This may be the same cause as ticket 07 and has no rate of its own.

## A write-up that was killed by reading the fixture

`L223` dropped the anniversary dinner on all five repeat runs, which looked like a second defect
next to the mixer ring. Khushbu's Card already carries `book the table for the anniversary on the
14th` as an open Task, so refusing it is the filing prompt working. The claim was removed before it
reached a ticket. This is the third worked example in three phases of the fixture killing a
finding, after phase 10.9's tickets 16 and 19.

## What worked, so a fix that breaks it is caught

The full list is in [`spec.md`](../spec.md). The six worth naming here, and every one is new
coverage from this pass:

**Nothing was filed from a one time password.** `L258` sent a real shaped SBI alert carrying an OTP
and a transaction amount. The filing call returned no changes at all.

**An account number and a phone number survived digit for digit.** `L259` filed `98250 41122` and
`SBIN0001234` unchanged, which is the one thing about those strings that matters.

**Devanagari digits were read as a number.** `L261` read `२१०००` as 21,000.

**A birthday was refused rather than borrowed.** `L277` asked for Khushbu's birthday. The Vault
holds one for Mummy and none for Khushbu, and the reply said so without reaching across.

**A Capture sent a minute ago beat the Card.** `L293` said Ramaben will now come on Sunday and take
Monday off, then asked which day she is off. The answer named the new word, said the Card still
reads the old way, and said which was newer.

**Hinglish reached the Command path.** `L296` typed `sandeep wala kaam ho gaya, close kar do` and
got `Will close: give the form sixteen to Sandeep. That is in Money.`

## The new rows

`harness/live/scenarios_p10_9_wide.py`, rows `L254` to `L296`, against `tests/fixtures/an-indian-life`
laid over `tests/fixtures/an-indian-household`. The same family in Bopal the last three passes used,
and not one new fixture, because a wide pass on a Vault of its own would measure the fixture rather
than the box.

Seven groups, and each is a thing an Indian house does weekly that no earlier row does once: a day
word that means two days, a secret and an identifier and a link, a name the Registry cannot reach,
a transcription rather than a typing, a question whose honest answer is no, more than one message,
and the evening list with a Command typed at it.

The rows add almost no check of their own, on purpose. `COMMON` carries forty and holds every row
to all of them, and a row written to catch a defect nobody has seen yet asserts the defect rather
than finding it. Four of the seven findings above came out of rows that passed their own hard
checks and were found by reading the soft observations.

`harness/live/repeat.py` gains three probes, `came_back_with_no_answer`,
`resolved_a_window_off_the_vaults_today` and `left_a_repeating_proposal_unconfirmed`, listed under
phase 10.95 in `PROBES`.

Ticket 08 also adds the phase's own scenario module, `harness/live/scenarios_p10_95.py`, holding
one row. `L297` answers two repeating Proposed Dates in one sentence of plain words, against
`tests/fixtures/two-repeating-birthdays` laid over the baseline. It is a module and a fixture of
its own because no fixture in the bundle held two repeating Proposed Dates, and "both" is the whole
of what that message says about which lines it means.
