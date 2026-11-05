# Phase 10.75 issues

Two defects and one question, from a third live-model bundle over phase 10.7. The question is
answered and ticket 04 is the work it named. Both defects are the same hole: `_drained` at
`memark/vault/apply.py:1977` can hold a Capture back for an edit that was refused or asked about,
and can do nothing at all about a thought the model never proposed.

The pass ran in `claude-cli` mode, and the harness defaults its filing tier to `claude-sonnet-5`
where ADR 0003 puts it on `claude-haiku-4-5`. See [../spec.md](../spec.md) for what that is worth.
Every rate below was measured with `python -m harness.live.repeat`, which forces the tier onto the
model ADR 0003 names.

| # | Ticket | Status | Blocked by | Reproduces on the filing tier |
| - | ------ | ------ | ---------- | ----------------------------- |
| 01 | [A claim about nobody is dropped before code can refuse it](01-a-claim-about-nobody-is-dropped-before-code-can-refuse-it.md) | ready-for-agent | none | 5 of 5 on `claude-haiku-4-5`, 1 of 1 on `claude-opus-5` |
| 02 | [A fact about the person is dropped when it shares a sentence](02-a-fact-about-the-person-is-dropped-when-it-shares-a-sentence.md) | ready-for-agent | none | 3 of 5 on `claude-haiku-4-5`, 0 of 1 on `claude-opus-5` |
| 03 | [Is an errand for a new month the old one coming back?](03-is-an-errand-for-a-new-month-the-old-one-coming-back.md) | resolved | none | not a rate |
| 04 | [The link says the words repeat, and is named for it](04-the-link-says-the-words-repeat-and-is-named-for-it.md) | ready-for-agent | 03, resolved | not a rate |
| 05 | [The trail shows the run is alive while a tool works](05-the-trail-shows-the-run-is-alive-while-a-tool-works.md) | completed | none | not a rate, and not a model defect |

Ticket 05 is the odd one out. It is not a model defect and it came from watching this phase's own
runner rather than from a scenario. It is filed here because this is where it was found: ticket 01's
live repeat ran twenty minutes behind a silent terminal and looked wedged.

Ticket 01 fails on both tiers, so the prompt is wrong. Ticket 02 fails only on the cheap tier, so
the prompt is too thin to carry it. Either way the prompt is what changes: per ADR 0003 the cheap
tier is what filing runs on, and the stronger model is a diagnostic and never the fix.

## The bundle

`harness/live/scenarios_p10_7_india.py`, rows `L143` to `L167`, against
`tests/fixtures/an-indian-household`. Three new overlay fixtures:
`an-indian-capture-half-landed`, `an-indian-closure-long-past` and
`a-card-for-the-person-in-india`. All 25 rows pass their hard checks, which is the point worth
making about a tally: every finding here came out of the soft observations.

## What worked, so a fix that breaks it is caught

Write this down or nobody knows a regression when they see one.

**The returning-errand link fills, in every shape.** This is the phase's biggest win. The old code
match filled `again-of::` 0 times in 24. Four rows filled it here and each covers a different reach:

| Row | The errand | What it matched |
| --- | ---------- | --------------- |
| `L162` | "i still have to get the activa insurance renewed" | the closed "renew the two wheeler insurance" on the reserved Card |
| `L163` | "have to book mummy's rajkot ticket" | a closed Task on Mummy's Card, so across files |
| `L164` | "should take one more quotation from another shifting company" | a closed Task on a project Card, so across folders, with no shared words |
| `L165` | "must send nikhil the september estimate sheet" | a closed Task on a person's Card. Correct by wording, and ticket 03 decided that is what the field means |

**The 36-month bound holds.** `L166` proved it where it is applied. The two Tasks ticked in 2022 were
not in the index the model was shown, and the model answered `finished: null`.

**The second call fires on a Task and on nothing else.** `L167` filed a Note about Mummy's tea and
made no returning-errand call.

**`remind me` is not a fact about the person.** `L151` in English and `L152` in Hinglish, "mujhe yaad
dila dena ki geyser wale ko friday ko bulana hai". Both produced a Task and a dated line with a null
subject, and neither put anything on the `Me` Card.

**The durability test bounds the Card.** `L153`, "aaj bahut thak gaya, traffic mein do ghante nikal
gaye", proposed nothing at all, and the Capture stayed queued because nothing derived from it. `L154`
in almost the same register, "har ekadashi ko main fast rakhta hoon", landed on `Me`. The pair works
and the words that separate them are `aaj` and `har`.

**A claim aimed at the reserved Card by name is refused.** `L161` said "put this under loose ends:
the ration card office is shut on second saturdays". The model aimed a Note at `Loose Ends`, code
refused it, nothing was written, and the Capture stayed queued for the Digest to ask about. This is
the phase working exactly as designed, and it is the shape ticket 01 is missing.

**Part Drained holds on the read side.** `L147` ran against a Vault whose Capture had already landed
a line on Mummy's Card and was still unfiled. That block reached no filing prompt, so the landed line
was not proposed a second time.

**The seeding interview fills `Me` sideways.** `L157` sent five answers as ordinary Captures. Five
facts landed on `Me`, and the parts about the flat and about Mummy split onto their own Cards.

**The self Card takes a contradiction like any other.** `L159` said the person had stopped the walk
their Card records. The model proposed `contradict` plus the new habit, code held the edit back, and
the Capture stayed queued.

## Rows that found nothing, and why that is a scenario result and not a pass

Three rows were written expecting a homeless part and did not get one. The model found a home for
each, and the home was fair:

- `L145`'s milk vendor account became a Task with a null subject, which is allowed and goes to the
  reserved Card. Its ration card rules went to `Society Paperwork`.
- `L148`'s corpus fund went to `Society Paperwork`.
- `L160`'s aadhaar seeding deadline went to `Society Paperwork` with a date.

A Vault carrying an area Card for government paperwork has fewer homeless claims than one that does
not. That is worth knowing about the finding in ticket 01: it bites hardest on a thin Vault, which is
every Vault in its first month.
