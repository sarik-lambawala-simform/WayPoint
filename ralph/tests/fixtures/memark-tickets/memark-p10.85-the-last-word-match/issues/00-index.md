# Phase 10.85 issues

Four defects and three questions, from the live-model pass at the end of phase 10.8. Two of the
defects are the box: a sentence written above an answer that contradicts it, and a festival date the
model worked out for itself. The other two are the harness, filed here because this is where they
were found.

The pass ran in `claude-cli` mode. Every rate below was measured with
`python -m harness.live.repeat`, which forces the tier onto the model ADR 0003 names, because the
harness defaulted one tier above the box. That was ticket 05, and it is fixed: the harness now
defaults to filing on `claude-haiku-4-5` and judgement on `claude-sonnet-5`, the same ids the box
runs, and the pass prints both beside the mode. No row moved on the change, because the only run
made after it was `auto`, which calls no model. **The next `claude-cli` pass is the first one
measured on the box's own tiers.** A row that goes red there is a finding of its own and never a
reason to raise the tier back.

| # | Ticket | Type | Status | Reproduces |
| - | ------ | ---- | ------ | ---------- |
| 01 | [A common noun is not a subject](01-a-common-noun-is-not-a-subject.md) | defect | completed | 5 of 5 on `claude-haiku-4-5`, 1 of 1 on `claude-opus-5` |
| 02 | [Should the miss line have survived the picker?](02-should-the-miss-line-have-survived-the-picker.md) | grilling | completed | not a rate |
| 03 | [A question that names a festival never reaches the Cards](03-a-question-that-names-a-festival-never-reaches-the-cards.md) | grilling | completed | 2 of 5 on `claude-haiku-4-5`, 5 of 5 on `claude-sonnet-5` |
| 04 | [A festival date is never the model's to know](04-a-festival-date-is-never-the-models-to-know.md) | defect | completed | 2 of 5 on `claude-haiku-4-5`, 0 of 1 on `claude-opus-5` |
| 05 | [The pass runs on models the box does not](05-the-pass-runs-on-models-the-box-does-not.md) | defect | completed | not a rate, and not a model defect |
| 06 | [What does a count cite?](06-what-does-a-count-cite.md) | grilling | completed | not a rate |
| 07 | [The free dry run is red by construction](07-the-free-dry-run-is-red-by-construction.md) | defect | completed | every run, and not a model defect |
| 08 | [Turn this phase's answers into a spec](08-turn-this-phases-answers-into-a-spec.md) | task | completed | not a rate |

Ticket 01 fails on both tiers, so the prompt is wrong. Ticket 04 fails only on the cheap tier, so
the prompt is too thin to carry it. Either way the prompt is what changes: per ADR 0003 the cheap
tier is what this runs on, and the stronger model is a diagnostic and never the fix.

Tickets 05 and 07 are the harness rather than the box. Both were found by using it: one by the rates disagreeing with the pass, one by the free dry run coming back red on a row this phase never touched.

Tickets 02, 03 and 06 are grilling tickets because each one asks a decision to cover a case it did
not consider. An agent must not answer its own side of those.

Ticket 08 is last and it is blocked by every other ticket. Nothing here is a build: each defect
carries a fix and each grilling ticket carries a decision, and 08 is where all seven become one
spec somebody can implement from. It copies phase 9.6's ticket 10, which did the same for that
map. A spec written before a grilling ticket is answered would carry a guess where a decision
belongs.

**Ticket 02 is resolved.** The miss line stays and stops being a statement about the vocabulary.
The answering call is asked which subjects it **covered**, never which it missed, and code prints
the line only where the model did not cover a subject **and** no word of it is written in the
Vault. `lookup._nothing_on` is untouched and becomes one of two conditions instead of the trigger.
ADR 0028's rule that code writes this line and the model never does is kept whole, because the
shape is the one ADR 0043 already gave the sources line. ADR 0043's paragraph "The miss line keeps
its check and loses its index" is amended in place.

**Ticket 06 is resolved.** A count cites the whole Vault, and the list it already printed is the
working. The footnote becomes one fixed sentence saying every Card was read and the list above is the
count. The answering call returns a boolean beside `lines` to declare a count, because the empty list
that fires `NO_SOURCES` today also covers a model whose invented lines were all dropped, and the
count sentence under that answer would read as a claim of completeness. A named line that survives
the check always wins, so `L174`'s nine errand Task lines stay. A malformed response prints no count
sentence. Recall is untouched, because `answering.what_was_read` is already this shape. ADR 0043's
paragraph "The sources line names the Card lines the answer used, and code writes it" is amended in
place, and `L173`'s hard check is edited to assert the new footnote.

## The bundle

`harness/live/scenarios_p10_8_india.py`, rows `L168` to `L198`, against
`tests/fixtures/an-indian-life` laid over `tests/fixtures/an-indian-household`: a family in Bopal,
thirty five Cards, parents in Rajkot, a wife whose office went to a four day week, a six year old
starting first standard, a cousin who does the society wiring, a CA who wants the form sixteen by
July. One more overlay, `an-indian-life-loose-captures`, carries the Captures nothing links to.

Two modules are new and neither existed before this pass:

- `harness/live/twenty.py` is ADR 0028's twenty-message test, which had never been written down as
  anything but a paragraph in the ADR. It is the accuracy gate, per ADR 0043.
- `harness/live/bill.py` prices a question off a pass's own call log.

29 of the 31 new rows pass their hard checks, and 8 of phase 10.8's own 9. The three that went red
are tickets 03 and 04. **Every other finding here came out of the soft observations**, which is the
usual lesson about reading the output rather than the tally.

## What worked, so a fix that breaks it is caught

Write this down or nobody knows a regression when they see one.

**ADR 0028's twenty-message test: 20 of 20 found the note, and 20 of 20 reached its Card.** The
trigger to escalate is missing more than about a quarter, so nothing escalates. Five of the twenty
share no word and no stem with their note. This is the phase's central claim, measured:

| Sent | The note it found |
| ---- | ----------------- |
| `?what did the doctor say about my sugar` | the fasting report at 118, on Health |
| `?where do we go when we want Rajasthani food` | the dal baati at the dhaba, on Eating Out |
| `?what suffers if we are out of town for a few days` | the tulsi that dries in two days, on Plants |
| `?what do I do when the net stops working at home` | the router behind the TV, on Phone and Internet |
| `?where do we keep the important documents` | the steel almirah, second shelf, on Money |

**The bill is the number the decision was taken on.** $0.0069 a question on this Vault's 2,723 token
prompt. Carried up to the 150,000 tokens ADR 0043 costed, one question is $0.301 against the $0.30
assumed, a week of ten a day is $21.10, and a month is $90.45 against ADR 0043's "about $90 a
month". Tokens are estimated at four characters each and the estimate is stated wherever it is used.

**Depth in the read does not decide a miss.** `L176` reached a line on the tenth Card of thirty five
and `L177` a line on the twenty seventh. Both were answered and both quoted the line.

**Counting is right, twice, by hand.** `L173` said fourteen people and listed fourteen, which is the
count of `people/` in the fixture. `L174` said nine open errands and listed nine, which is the count
of `- [ ]` lines across eight Cards. `L175` asked the same in Hinglish and got the same nine.

**The language a question arrives in does not decide the answer.** Hinglish (`?mummy ke ghutne ka
kya chal raha hai`), transliterated Gujarati (`?gaadi ne shu thayu chhe`), phone shorthand with the
vowels gone (`?wat did dr say abt mummy bp`) and a nickname carried as an alias (`?khushi ke office
ka kya scene hai`) all reached the right Card and quoted the right line.

**A wrong premise is refused rather than agreed with.** `L185` sent `?ronak ki shaadi december me
hai na, kya plan hai` and the reply opened `Your notes don't say December`, then gave November and
said nothing is fixed. That is ADR 0015's posture on a question, and it is the failure a box that
reads everything is most tempted into.

**Recall widens and says so, in both shapes.** `L191` turned a quiet day into 7 days and named them.
`L192` turned a quiet week into 21 days reaching back into the month before. `L193` said both
windows were quiet and stopped, and cost no call at all.

**A festival resolves off the Vault and never off a calendar.** `L194` asked `?what did we do on
Holi this year`, found the Vault's own 4 March line, read that day and footnoted `2 notes and 1
dated line`. Ticket 04 is the other half of this and does not touch it.

**A question with no punctuation is still a question.** `L186` sent `tell me what is pending with
aarohi's admission` and got an answer with the quote-back line above it.

**A follow-up naming nobody carries the question forward.** `L187` sent `?mummy ki tabiyat ka kya
haal hai` and then `?and papa`, and the second answer was about Papa's health.

**The Captures nothing links to reach the prompt.** `L198` answered out of a block sent since the
last run, `the tempo is booked for the sixth and the painter wants half in cash`, which no Card line
points at.

## Watched, not filed

Neither of these is a ticket. Both are worth a second look in the next pass.

**An answer volunteers material nobody asked for.** `?what suffers if we are out of town for a few
days` came back with the tulsi, then the spare key, then the SIP and the credit card bill. Every
sentence was true and cited. Reading everything makes the answer wider than the question, and
whether that is helpful or noisy is a judgement one pass cannot settle.

**A subject the model skipped whose word the Vault does hold.** New, from ticket 02. Its answer
prints no line there, because the second condition blocks it. Under the line's new promise that is
a gap. It needs the model to ignore something written in front of it, and nothing in the pass shows
that. `L184` asked about the society paperwork and the passports in one sentence and was answered
on both. Closing it means dropping the second condition, which brings back a warning that argues
with the answer below it. Watched, not filed.

**A recalled answer can contradict its own window.** `L195` asked `?pichle hafte kya kya hua tha`,
code parsed 17 to 23 August, and the answer opened by saying there is nothing from last week before
quoting three notes from 18 August, which is inside that window. One run, so it is an observation
and not a rate.

## The build

Ticket 08 is answered and this phase now has a build. `spec.md` carries it and the issues are `09` to
`17` in this folder. Tickets 01, 04, 05 and 07 are shipped in the code, so none of them has an issue.
What is left to build is tickets 02, 03 and 06.

| # | Issue | Type | Status | Blocked by |
| - | ----- | ---- | ------ | ---------- |
| 09 | [The routing rule is written down](09-the-routing-rule-is-written-down.md) | task | ready-for-agent | none |
| 10 | [The Cards go in unless the message names a time and nobody](10-the-cards-go-in-unless-the-message-names-a-time-and-nobody.md) | task | ready-for-agent | 09 |
| 11 | [The miss line's promise is amended](11-the-miss-lines-promise-is-amended.md) | task | ready-for-agent | none |
| 12 | [The answering call says what it covered](12-the-answering-call-says-what-it-covered.md) | task | ready-for-agent | 11 |
| 13 | [The sources line's rule carries a count](13-the-sources-lines-rule-carries-a-count.md) | task | ready-for-agent | none |
| 14 | [A count cites the whole Vault](14-a-count-cites-the-whole-vault.md) | task | ready-for-agent | 12, 13 |
| 15 | [What the cheap tier does with subjects](15-what-the-cheap-tier-does-with-subjects.md) | research | ready-for-agent | 10 |
| 16 | [AFK: this phase's rows reach the bundle](16-afk-this-phases-rows-reach-the-bundle.md) | task | ready-for-agent | 10, 12, 14 |
| 17 | [HITL: run the live pass](17-hitl-run-the-live-pass-and-file-what-it-finds.md) | task | completed | 16 |

Three seams are named in `spec.md` so nothing is built twice. Issue 12 owns the miss line and the
shape of the answering schema, issue 14 adds its boolean to what 12 leaves, and issue 10 owns the
route and edits no footnote.

## What the pass at the end of this phase found

Ticket 17 has run. The whole bundle went through `claude-cli` on the tiers ADR 0003 names, which is
what this index said the next pass would be the first to do. **246 rows, 227 pass, 19 fail**, and
the findings are filed as
[phase 10.9](../memark-p10.9-nothing-to-file-is-not-nothing-to-do/issues/00-index.md): sixteen
findings and a spec ticket.

**A row this phase wrote went off.** `L200` is the guard ticket 16 added for this phase's own cost
argument, and it caught the thing its module said it was afraid of. `?holi pe kya kiya tha` names
nobody, Hinglish drops the pronoun, the Intent Read answered `Me`, and all 34 Cards went down the
cheap path: 2,705 tokens against 375, on 3 runs of 5 and on both tiers. Writing that row is the best
thing this phase did.

**The three rules this phase built all held.** The miss line firing only where both its conditions
hold, a count saying what it was read from, and an occasion with no confirmed day reaching the
Cards are in `COMMON`, so all 48 new rows were held to each of them and none broke. `L232` showed
ticket 14's rule working on an empty list: `From: no line of your notes I can name.`

**Eight of the nineteen failures are this phase's own rows left behind.** Tickets 12, 13 and 14
changed the footnote rules and the routing rule, and eight earlier rows still assert what they
replaced. Nobody could have seen it: those assertions are wrapped in `only_when_a_model_answered`,
so they are silent in the free dry run, and this phase's pass ran forty rows rather than the whole
bundle. Phase 10.9's ticket 14 brings them up to date and asks the pass to report how many checks
were vacuous, so a green dry run stops reading as coverage it does not have.

**The bill is unchanged.** $0.301 a question carried up to ADR 0043's 150,000 tokens, which is 1.00
times the number that decision was taken on, and $90.38 a month against its "about $90".
