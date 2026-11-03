# 14 — Eight earlier rows assert rules phase 10.85 replaced

**Type:** defect

**Status:** completed

**Completed at:** 2026-09-18T01:00:19Z

**What to build:** the eight rows that went red on rules this phase's parent changed are brought up
to the rules that now hold, and the free dry run stops being able to hide that kind of drift.

**Reproduces:** every run, and not a model defect. The box is right on all eight and the rows are
out of date.

## What happens

Eight of the seventeen regression failures are rows asserting behaviour the design no longer has.

**Six Recall rows want a `From:` sources line at the bottom.** `L68`, `L70`, `L71`, `L86`, `L88` and
`L89` each end with `_the_sources_line_names(...)`, which requires the reply's last line to open
with `From: `. A recalled answer now ends with the window footnote instead:

```
Read all 3 notes and 4 dated lines from 24 Aug 2026.
```

That is `answering.what_was_read`, and it is deliberate: per ADR 0043 as amended, Recall reads its
window whole, so the honest footnote is the size of what was read rather than a pick out of it. The
rows want the Lookup's footnote on a Recall answer.

**Two rows count the notes in a Recall prompt.** `L69` and `L87` use `reads_the_window_whole`, which
asserts the prompt's `## Captures` count equals the inbox count for the window. `L69` got 41 in the
window and 43 in the prompt. Both messages name a subject as well as a time, so the merged branch of
the routing rule fired and the Cards' own unlinked Captures went in beside the window's. **That
branch is this phase's parent's own ticket 10.** The rows assert the count from before it.

## Why nothing caught it

Both assertions are wrapped in `only_when_a_model_answered`. In `auto` the composition raises on the
empty answer, no call is made, and the check is vacuous. So these eight rows are green in the free
dry run and can only ever go red in a real one.

Phase 10.85's pass ran forty rows, not the whole bundle. Its own `00-index.md` says so. So the last
time these eight were scored against a real model was before the footnote rule and the routing rule
changed, and nothing in between could have noticed.

This is phase 10.85's ticket 07 pointing the other way. That one was a row red in the dry run and
green for real. This is eight rows green in the dry run and red for real. Both come from the same
place: a check that reads a reply says nothing when no reply was written.

## What to change

The six Recall rows assert the footnote Recall actually writes. `harness/live/checks.py` already has
`a_window_was_recalled` and the `READ_OPENS` constant for exactly this, so this is using what is
there rather than writing a ninth spelling of the sentence.

`L69` and `L87` assert what the merged branch puts in the prompt, which is the window's notes plus
the Cards'. Do not weaken them to a bound: the number is the point, and a row that only checks
`at least the window` would pass on a box that sent the whole Vault.

**Do not edit these rows to make anything pass.** They are regression coverage and the skill is
explicit about it. What is changing is an assertion that names a rule nobody uses any more, and each
edit says in a comment which ticket replaced the rule, so a later reader can tell this apart from a
row quietly loosened.

Then the dry run's blind spot. A row whose only real assertions are model-gated is a row that says
nothing in `auto`, and nothing reports that today. The pass should say how many checks were vacuous,
so a green dry run cannot be read as coverage it does not have.

## Done when

- [ ] `L68`, `L70`, `L71`, `L86`, `L88` and `L89` assert the Recall footnote and pass.
- [ ] `L69` and `L87` assert the merged branch's count and pass.
- [ ] Each edited row carries a comment naming the ticket whose rule replaced the old one.
- [ ] The pass prints how many checks were vacuous in the run, in every mode.
- [ ] `MEMARK_PASS_MODE=auto python -m harness.live` is still green.
