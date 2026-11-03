# 22. A settled Contradiction dates the old claim

**Type:** task

**Status:** completed

**Completed at:** 2026-09-25T15:47:47Z

**Blocked by:** 21

**What to build:** when a person says which of two claims is true now, the Card says it. `new N`
dates the old line and writes the new one. `old N` declines the new words. `both N` writes the new
line beside the old one.

Decided in [21-what-a-settled-contradiction-does-to-the-old-claim.md](21-what-a-settled-contradiction-does-to-the-old-claim.md).
The rule is ADR 0049, a settled Contradiction dates the old claim. The amendments that point to it
are in ADR 0005, human claims are immutable to the agent, ADR 0010, contradictions surface rather
than resolve, and ADR 0026, a Card line has a fixed grammar. Read `docs/stack/python.md`,
`docs/stack/anthropic-api.md`, `docs/stack/telegram.md`, `docs/stack/git-and-files.md`,
`docs/stack/dates.md` and `docs/stack/tests-and-logging.md` first.

## The case this is built for

1. `I work at Simform. Mehul is my manager there.` files `work at Simform` into `people/me.md`.
2. `I now work at Google` is held as a Contradiction. The Digest asks, as item 6:
   `` `Me` says `work at Simform`. You now say `work at Google`. Which is true now? Reply new, old or both with its number. ``
3. The person sends `new 6`.
4. After the next filing run, `people/me.md` has:
   - `work at Simform · until:: 2026-09-25 · from:: [[inbox/...#^a1]]`
   - `work at Google · from:: [[inbox/...#^b2]]`
5. The Capture behind step 2 drains. The Digest does not ask again.

## What happens today

- The `contradict` edit has `subject` and `text` and nothing that names the old line.
  `_EDIT_FIELDS` and `ProposedEdit` are in `memark/distillation.py`.
- `_disagreement` in `memark/vault/apply.py` builds the question from the new text alone.
- `pick N <name>` is the only answer. `_a_pick_command` in `memark/commands.py` writes
  `resolve-contradiction` with a name when `an_ambiguous_name_in` finds no ambiguous name.
  `pending.py` applies it with `settle_subject`, which writes `subject::` on the Capture.
- `_picked` and `_check` in `memark/vault/apply.py` let a `contradict` through when every Capture
  it cites carries `subject::`. The next run writes the new line and nothing touches the old one.
- `CARD_KEYS` in `memark/vault/grammar.py` has no `until`. The inbox keys have no `against` or
  `settled`.
- Only `extend` reaches a file today. `_check` refuses every `compact`. So no model edit can drop
  `until::` yet. The guard below is for the day `compact` is let through.

## What to change

### 1. The grammar

In `memark/vault/grammar.py`:

- Add `until` to `CARD_KEYS`. Its value must parse as `YYYY-MM-DD`. The linter in
  `memark/vault/lint.py` fails any other value.
- Add `against` and `settled` to the inbox keys, with a constant each in `memark/vault/inbox.py`
  beside `QUESTION`. `settled` takes `new` or `both` and nothing else.
- Add `keep` to the fields a `resolve-contradiction` Pending Instruction may carry. It takes `new`
  or `both`.

### 2. The edit names the old line

In `memark/distillation.py`:

- Add `against: str | None = None` to `ProposedEdit`, and `"against"` to `_EDIT_FIELDS`. In the
  schema it is `["string", "null"]`.
- Schema description: the exact text of the Card line this `contradict` disagrees with, copied
  character for character, with no bullet, no mark and no fields. Null for every other kind, and
  null for a `contradict` about a pronoun.
- Add one line to the `contradict` rules in the prompt with the same meaning. Add one line that
  says a Card line with `until::` was true until that day and is not true now.
- An `extend` or `compact` with `against` set is malformed. Refuse it in `vault/apply.py` the way
  a `date` with an `occasion` is refused.

### 3. The filing run finds the old line and writes it on the block

In `memark/vault/apply.py`, where `_the_ask` builds a `CONTRADICTION` ask:

- Resolve the edit's subject to its Card. Look for a line whose text equals `edit.against`
  exactly. Compare the parsed text, never the raw line, so the mark, checkbox and fields do not
  count.
- Found: the question is
  `` `{subject}` says `{against}`. You now say `{text}`. Which is true now? Reply new, old or both with its number. ``
  Write `against:: {against}` on the block, in the same write that writes `question::`.
- Not found, or `against` is null: the question is
  `` `{text}` disagrees with what `{subject}` already says. Which is true now? Reply new, old or both with its number. ``
  Write no `against::`, and drop one left by an earlier run.
- A pronoun subject keeps today's question and adds `Reply pick with its number and the name.`
- Keep each wording as a module constant. The harness imports them.
- `against::` follows the rules `question::` follows: every run that gets a usable answer rewrites
  it, and a batch that failed leaves it as it was. Unlike `question::`, it stays after the person
  answers, because the run that applies the answer reads it. It goes when the Capture drains.

### 4. The three verbs

In `memark/commands.py`:

- Add `new`, `old` and `both` to `VERBS`, each `Shape.NUMBER`. Update the verb count in the
  comment above `VERBS`.
- Each resolves only against an unfiled Capture the Digest numbers that
  `an_ambiguous_name_in` says has no ambiguous name. Anything else is not a Command, per ADR 0041,
  a typed command is recognised by what it resolves against, so `new 6 month plan` goes to the
  Intent Read.
- `new N` writes `resolve-contradiction` with `keep:: new`. `both N` writes it with `keep:: both`.
  `old N` writes `reject-edit`, the code `no N` writes.
- Replies, as module constants:
  - `new N`, `against::` present: `Will settle: {text}. It replaces {against}.`
  - `new N`, no `against::`: `Will settle: {text}. I could not find the old line, so I dated nothing.`
  - `both N`: `Will settle: {text}. Both stay.`
  - `old N`: reuse `WILL_DECLINE`.
- `pick N <name>` on a Capture that carries `against::` is not applied. It replies
  `{N} asks which is true now. Reply new {N}, old {N} or both {N}.` and writes nothing. On a
  Capture without `against::`, `pick` keeps today's behaviour, because that is the pronoun case
  and the not-found case, and for the not-found case it is the same write as `both`.

In `memark/intent.py`, the Intent Read gets one new intent: a Contradiction settled, with the item
number and one of `new`, `old` or `both`. It goes through the same checks as `_a_subject_picked`
and ends in the same Command the typed verb writes. `I work at Google now` against item 6 reads as
`new 6`. `I have both jobs` reads as `both 6`.

### 5. The answer is applied

In `memark/pending.py` and `memark/vault/apply.py`:

- `resolve-contradiction` with `keep::` applies a new write, `settle_contradiction`, beside
  `settle_subject`. It writes `settled:: new` or `settled:: both` on the Capture and drops
  `question::`. It returns `False` and writes nothing when the block is filed or already carries
  `settled::`, like `settle_subject`.
- `resolve-contradiction` with a name keeps `settle_subject`.
- Replace the `contradict` exception in `_check`. A `contradict` reaches a file when every Capture
  it cites carries `settled::`, or carries `subject::` for the pronoun case. Add a `_settled`
  reader beside `_picked`, with the same one-answer-or-none rule. `_the_ask` asks nothing for a
  settled Capture, as it does for a picked one.
- When a settled `new` Capture's edit lands on a Card, and the Capture carries `against::`, code
  finds the line with that exact text on the same Card and adds `until:: {today}` to it, in the
  same write that adds the new line. `today` is the run's day.
  - The line is not there, or is on another Card, or already carries `until::`: date nothing, log
    it at info, and still write the new line.
  - A Pinned line is dated. ADR 0005 filters the model's edits, and this is not one.
  - Two lines with the same text: date nothing and log it. Code does not guess.
- A settled `both` Capture writes the new line and touches no other line.

### 6. `until::` is guarded

In `memark/vault/apply.py`, beside the Pinned Claim filter:

- Refuse a model edit that removes a line carrying `until::`, removes the field, changes its
  value, or folds a dated line with an undated one. Today `_check` already refuses every
  `compact`, so write the guard where a `compact` would be applied and test it against a
  `compact` built by hand.
- Code is the only writer of `until::`. `_check` refuses a model edit whose `text` holds
  `until::`.

## Tests

Use checked-in vault fixtures, per `docs/stack/tests-and-logging.md`.

- The schema carries `against`, and an `extend` with `against` set is refused.
- A held `contradict` whose `against` matches a line writes `against::` and the both-claims
  question on the block.
- A held `contradict` whose `against` matches nothing writes the fallback question and no
  `against::`.
- A pronoun `contradict` asks the `pick` question.
- `new 6`, `old 6` and `both 6` each write the right Pending Instruction and reply. `new 6 month
  plan` is not a Command.
- `pick 6 Me` on a Capture with `against::` writes nothing and replies with the three words.
- `pick 6 Priya` on a pronoun Capture still writes `subject::`.
- The Simform to Google case end to end: after `new 6` and one filing run, the Simform line
  carries `until::` with the run's day, keeps its `from::`, the Google line is written, and the
  Capture drains.
- A Pinned old line gets `until::` and keeps its `!`.
- `both 6` leaves the old line byte for byte.
- `old 6` marks the Capture `filed:: declined` and touches no Card.
- `new 6` with no `against::` writes the new line and dates nothing.
- The linter fails `until:: soon`.
- The `until::` guard refuses a hand-built `compact` over a dated line.
- Rewrite the tests that assert `pick N <name>` settles a which-is-true Contradiction. Each
  docstring names this ticket as the decision that replaced the old rule. Find them with
  `grep -rn "resolve-contradiction\|RESOLVE_CONTRADICTION" tests/`.

## The live bundle

Add one scenario to `harness/live/`, per `.claude/skills/live-pass/SKILL.md`. Do not edit an
earlier scenario to make this one pass.

- Send `I work at Simform. Mehul is my manager there.`, run filing, send `I now work at Google`,
  run filing, run the Digest, reply `new N`, run filing.
- Hard checks: the Digest item shows both claims; the Simform line carries `until::` and its
  `from::`; the Google line is written; the Mehul claim is still where the first run wrote it,
  with no `until::`.
- Soft check, scored apart: the model copied `against` exactly. Record the rate. A low rate is a
  finding for ticket 20, not a failure here, because the fallback path still writes the answer.

## Done when

- [x] Every test above is written and passes.
- [x] The unit suite is green.
- [x] The dry run of the live bundle proves the new scenario's wiring.
- [x] The docstrings and comments that say `pick` settles a Contradiction are updated, including
      the comment above `PICK_SUBJECT` in `memark/commands.py` and `settle_subject`'s docstring.
- [x] It commits with ADR 0049, the amendments to ADR 0005, ADR 0010 and ADR 0026, and the
      `CONTEXT.md` entries, if no earlier commit carried them.
