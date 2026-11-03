# Phase 4.6 issues

Six defects in what the filing call is asked and what it is shown. Found by the live-model pass, with
filing on `claude-haiku-4-5` and judgement on `claude-sonnet-5`. See [../spec.md](../spec.md) for what
the evidence is worth and what it is not.

| # | Ticket | Status | Blocked by | Reproduces on Haiku |
| - | ------ | ------ | ---------- | ------------------- |
| 01 | [A bare pronoun is guessed, and ADR 0015 cannot see it](01-a-bare-pronoun-is-guessed-and-adr-0015-cannot-see-it.md) | ready-for-agent | none | 5 of 5 did not ask |
| 02 | [The one Card every subjectless Task lands on is never shown](02-the-one-card-every-subjectless-task-lands-on-is-never-shown.md) | ready-for-agent | none | structural, always |
| 03 | [A finished project is not asked to go Dormant](03-a-finished-project-is-not-asked-to-go-dormant.md) | ready-for-agent | none | 4 of 5 |
| 04 | [A day named by its number alone is not proposed as a date](04-a-day-named-by-its-number-alone-is-not-proposed-as-a-date.md) | ready-for-agent | none | 5 of 5 |
| 05 | [The prompt never states which edits have no home](05-the-prompt-never-states-which-edits-have-no-home.md) | ready-for-agent | 01 | seen once |
| 06 | [Should a Capture be filable in parts?](../../memark-p09.6-decisions-only-you-can-make/issues/03-should-a-capture-be-filable-in-parts.md) | moved to phase 9.6, ticket 03 | tracked over there | code behaviour, always |

## Dependency order

Only one dependency is real. 05 is blocked by 01, because 01 teaches the model to stop naming a person
it cannot pin down, and the obvious wrong turn from there is to return a null subject instead, which
is what 05 forbids. The two sentences have to be written against each other.

Nothing else blocks anything. 01, 03, 04 and 05 all edit the same constant, `INSTRUCTIONS` in
`distillation.py`, so they must land one after another rather than in parallel. Numeric order already
gives that, which is why they carry no blocker lines: a false blocker would be noise.

02 is the odd one out and could run at any point. It is the only ticket that touches
`filing.py`'s Card selection rather than a prompt.

## 06 is a grilling ticket, not implementation work

01 to 05 are implementation tickets and ran under `run-ralph-tickets.sh`. All five are `completed`.

06 is a wayfinder grilling ticket, so it is worked through [../map.md](../map.md) instead. It carries
a `**Type:** grilling` line and a `## Question` body, and it holds no `- [ ]` criteria because there is
nothing to implement until the question is settled.

Two trackers read this folder and neither reads the other's marks. `run-ralph-tickets.sh` matches
`**Status:**` and finds no line on 06, so it skips it. A wayfinder frontier query matches `Status:`
and finds `resolved` on 01 to 05, so 06 is the only ticket on the frontier.

Grilling is human in the loop. The question resolves through live exchange and an agent never answers
its own side of it. Invoke `/mattpocock-skills:grilling` and `/mattpocock-skills:domain-modeling`.

## Suggested reading order for a human

01 first. It is the only one that writes something false about a real person, and ADR 0015 already
says why that is the worst failure the system has.

02 next. It is structural, it needs no model to reproduce, and it is one change to `_cards_named_by`.

03 and 04 are the same prompt failing the same way on two different rules, and a change to that prompt
should be checked against both at once.

## What the live pass confirmed works

Recorded here so a fix that breaks one of these is caught as a regression.

- Aliases resolve, typos included: `her` reached `Wife`, and `priya abt the deck deadline movin`
  reached `Priya (colleague)`.
- A new Card came out clean, with the Registry note `kitchen fitter, met at the school gate`.
- Contradictions are raised rather than overwritten.
- A fact already on a Card under a `!` mark produced no proposal at all.
- `repeat` came back as a real iCalendar rule, not prose.
- Code refused a duplicate date proposal by name.
- `claude-sonnet-5` quoted every Digest item back character for character, so the strict check in
  `digest.py:_words_of` that would otherwise cost the whole Digest passed.
