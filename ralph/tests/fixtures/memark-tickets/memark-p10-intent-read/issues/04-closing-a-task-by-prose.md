# 04 — Closing a Task by prose

**What to build:** saying you did the thing ticks the box. Finishing something costs a sentence rather
than a number you have to look up.

A Task is the one target with no exact key, and this is the one place the front door guesses. The model
never saw a Card body, so it cannot return a block id. It returns what you said you did, and code
searches open Task lines for it.

The search is the word matching the Lookup already builds, per ADR 0028, which decided conversation
finds Cards by matching words. The corpus is the Card as a model may see it, so closed Tasks are
already stripped, per ADR 0034, which decided a closed Task is hidden from every model call and never
reopened. That is exactly the rule this needs: only an open Task can be closed. Use the one function
that renders that view. A second implementation would drift and the drift would be invisible.

Exactly one match closes it, as a `close-task` Pending Instruction, and the reply names the full Task
text. Several match and code closes nothing, listing every one of them in the reply so you can say
which. Guessing between two open Tasks is the failure this rule exists to refuse.

**Blocked by:** 01 — The receipt order, and the first change end to end.

**Status:** completed

**Completed at:** 2026-09-09T22:03:28Z

- [ ] A message closing a Task by prose where exactly one open Task matches writes a `close-task`
      instruction and the reply names the full Task text.
- [ ] Where two open Tasks match, nothing is closed and the reply lists both.
- [ ] Where no open Task matches, nothing is closed and the phrase appears under what could not be
      matched.
- [ ] A closed Task can never be matched, because the corpus is the model-facing view.
- [ ] The word matching is the Lookup's own, not a second copy.
