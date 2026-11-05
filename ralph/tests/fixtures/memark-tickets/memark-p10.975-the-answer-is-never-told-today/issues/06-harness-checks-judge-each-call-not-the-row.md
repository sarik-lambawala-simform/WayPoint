# 06. Harness checks judge each call, not the whole row

**Type:** task

**Status:** completed

**What to build:** four shared hard checks in `harness/live/checks.py` give the right answer on a
row whose messages take different roads.

Spec: [../spec.md](../spec.md), structural finding 7.

This changes shared checks, not scenarios. No earlier row's scenario is edited. A check that is
fixed must still fail on the failure it was written to catch: say so in its docstring, with the
row that proves it.

## What happens today

Each of these reads the row as one thing when its calls are several.

1. **`a_recall_prompt_holds_no_cards`.** `a_window_was_recalled` is true if any reply has a Recall
   sources line. Then every answering prompt in the row must hold no Card. In `L309`, the first
   question named `Me` and took the one Card plus window road, and the follow-up was a recall. The
   first call's Card fails the check.
2. **`a_recall_window_was_read_whole`.** It pairs the `at`th sources line with the `at`th answering
   prompt. When the first call was not a recall, line 0 is compared with prompt 0, which is the
   wrong call. `L309` said `2026-09-28 to 2026-09-28 holds 2 notes and 5 reached the model`.
3. **`a_wider_window_was_always_stated`.** `_windows_asked_about` reads the whole message. The box
   reads the question the Intent Read pulled out. `How was my mood yesterday? also remind me to call
   the electrician on 2nd oct` gives the check 2 Oct, while the box rightly read 29 Sep. `L354`.
4. **`a Capture owed an answer kept no filed:: mark`.** After `undo` takes a filing back, the first
   Capture keeps its `filed::` with 0 lines landed, by design. The check reads that as a lost
   answer. `L368`.

## Rates

- `L309`: checks 1 and 2 failed in 5 of 10 runs. Each red run had one call on each road.
- `L367`: checks 1 and 2 failed in 1 of 1.
- `L354`: check 3 failed in 1 of 1.
- `L368`: check 4 failed in 1 of 1.

## Done when

- [ ] Checks 1 and 2 judge each answering call by the road that call took.
- [ ] Check 3 reads the windows from the question each reading pulled out, where there is one.
- [ ] Check 4 passes over a Capture whose filing an `undo` took back.
- [ ] `L309` passes both recall checks on 10 of 10 runs in `claude-cli` mode, or each red run is a
      real defect named in a new ticket.
- [ ] `MEMARK_PASS_MODE=auto python -m harness.live` is green, and `mypy` and `ruff` are green on
      `harness/live/`.
