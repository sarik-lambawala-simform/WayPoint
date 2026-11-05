# Phase 10.975 issues

Filed by phase 10.97's ticket 19, the live pass, on 2026-10-01. Findings, bars and rates are in
[../spec.md](../spec.md). The grilling tickets are on [../map.md](../map.md).

## Structural

These hold in any mode, because code decides them.

| # | ticket | type | status | evidence |
| --- | --- | --- | --- | --- |
| 01 | [The answer prompt names today and the days asked about](01-the-answer-prompt-names-today-and-the-days-asked-about.md) | task | completed | `L308` 5 of 5 |
| 02 | [Each reply line reads back its own piece's line](02-each-reply-line-reads-back-its-own-pieces-line.md) | task | completed | `L329` 8 of 8 |
| 03 | [`day-before-yesterday` with hyphens is two days back](03-day-before-yesterday-with-hyphens.md) | task | completed | `L355`, code |
| 04 | [A range with a bare first number is read whole](04-a-range-with-a-bare-first-number.md) | task | completed | `L358`, code |
| 05 | [An `undo` message is not filed as a claim](05-an-undo-message-is-not-filed-as-a-claim.md) | task | completed | `L368`, code |
| 06 | [Harness checks judge each call, not the whole row](06-harness-checks-judge-each-call-not-the-row.md) | task | completed | `L309` 5 of 10 |

## Judgement

One step short of proof until a `live` run.

| # | ticket | type | status | evidence |
| --- | --- | --- | --- | --- |
| 12 | [An exact relative day is not `around`](12-an-exact-relative-day-is-not-around.md) | task | completed | `L361` 3 of 5, cheap tier only |
| 13 | [A correction of the day just asked about is a question](13-a-correction-of-the-day-just-asked-about.md) | task | completed | `L353` 5 of 5 |
| 14 | [A follow-up counts from the day just named](14-a-follow-up-counts-from-the-day-just-named.md) | task | completed | `L351` 3 of 5 |

## Decisions

Grilling tickets. No status line, so the ticket runner skips them.

| # | ticket | evidence |
| --- | --- | --- |
| 07 | [Which pieces may a typed date come off?](07-which-pieces-may-a-typed-date-come-off.md) | `L307` 7 of 15, `L316`, `L375`, `L337` |
| 08 | [Where does an errand go when its subject has no Card?](08-where-does-an-errand-about-yourself-go.md) | `L319` 5 of 5, both tiers |
| 09 | [What does code do with two fixed words, or one the message takes back?](09-two-fixed-words-or-one-taken-back.md) | `L356`, `L357`, code |
| 10 | [Which year does a typed date with no year name in a question?](10-which-year-does-a-typed-date-in-a-question-name.md) | `L377` 3 of 3, code |
| 11 | [What does the box do when a weekday and a date disagree?](11-a-weekday-that-disagrees-with-its-date.md) | `L335`, code |
| 15 | [May a month that is no English word come first, before a word?](15-a-month-first-date-before-a-word.md) | `L371` 2 of 3 |
| 16 | [Consolidate every answer into one spec](16-to-spec.md) | resolved, the spec is written |

## Build

From the spec's "The build". Seven build tickets, then the two every phase ends with.

| # | ticket | type | status | blocked by |
| --- | --- | --- | --- | --- |
| 17 | [A typed date may come off more than one piece](17-a-typed-date-may-come-off-more-than-one-piece.md) | task | ready-for-agent | |
| 18 | [An errand with no Card goes to Loose Ends, and a Task may open Me](18-an-errand-with-no-card-goes-to-loose-ends.md) | task | ready-for-agent | |
| 19 | [A month-first date is guarded only where English collides](19-a-month-first-date-is-guarded-only-where-english-collides.md) | task | ready-for-agent | |
| 20 | [A question date with no year takes the nearest one](20-a-question-date-with-no-year-takes-the-nearest-one.md) | task | ready-for-agent | |
| 21 | [The model picks the fixed word, and code counts it](21-the-model-picks-the-fixed-word-and-code-counts-it.md) | task | ready-for-agent | 20 |
| 22 | [A weekday that disagrees with a typed date is named in the reply](22-a-weekday-that-disagrees-with-a-typed-date.md) | task | ready-for-agent | 17 |
| 23 | [A question checks its weekday too](23-a-question-checks-its-weekday-too.md) | task | ready-for-agent | 20, 21, 22 |
| 24 | [AFK: this phase's rows and hard checks reach the bundle](24-afk-this-phases-rows-and-hard-checks-reach-the-bundle.md) | task | ready-for-agent | 17 to 23 |
| 25 | [HITL: run the live pass and file what it finds](25-hitl-run-the-live-pass-and-file-what-it-finds.md) | task | ready-for-human | 24 |

## Found by hand

| # | ticket | type | status | evidence |
| --- | --- | --- | --- | --- |
| 26 | [A link in a Capture reaches its Card line](26-a-link-in-a-capture-reaches-its-card-line.md) | task | completed | harness `^34ca` on 2026-10-08, and `L260` in p10.95 |
| 27 | [Advice may use what the model knows](27-advice-may-use-what-the-model-knows.md) | task | completed | harness messages 1003 to 1010 on 2026-10-08, `^908a` and `^29a1` |
| 28 | [A general fact about a name the notes never write](28-a-general-fact-about-a-name-the-notes-never-write.md) | task | completed | harness messages 1004 and 1005 on 2026-10-08 |
| 29 | [The box may search the web when you ask or agree](29-the-box-may-search-the-web-when-asked.md) | task | ready-for-human | asked for on 2026-10-08; ADR 0063 built, real call owed |
| 30 | [The miss check allows the day line above it](30-the-miss-check-allows-the-day-line-above-it.md) | task | ready-for-agent | `L414` message 1001, 2026-10-08 |

## What worked

The full list is in [../spec.md](../spec.md), "What worked". In short: typed dates in Hinglish, in a
formal voice with a tier, and beside a phone number, a fraction or a time were confirmed and named.
Relative words, typos and numeric dates waited for a yes. The day line was right on `kal`,
`gai kale`, `pichle hafte`, `last weekend`, `yday` and `kal aur parso`. `and me?`, `how much did
that cost?` and `remove jasmine from that` were answered from the turn before. The day line bars
`L308`, `L309`, `L311` and `L313` met 0 of 25. `L305`, `L306`, `L309:mood`, `L310` and `L312` met
their bars.
