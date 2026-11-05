# 21. The model picks the fixed word, and code counts it

**Type:** task

**Status:** completed

**Completed at:** 2026-10-08T05:04:38Z

**Blocked by:** 20

**What to build:** `not yesterday, the day before. how was my mood?` on Wednesday 30 Sep 2026 is
answered about Monday 28 Sep. `how was my mood yesterday and today` is answered about 29 to 30 Sep.
When the model cannot be reached, the reply says so and guesses no day.

Spec: [../spec.md](../spec.md), "Strand 4". Decided in
[What does code do with two fixed words, or one the message takes back?](09-two-fixed-words-or-one-taken-back.md).
The rule is ADR 0057, the model picks the fixed word, and code counts it. It replaces two parts of
ADR 0052, code counts a day from today and the model never does.

Blocked by 20 because both change how `window_in` and `_window_for` hand the window to the answer.

## What happens today

`window_in` reads the first fixed word through `words_counted`, and `_window_for` in
`memark/handler.py` uses that before the reading's window. `L356` and `L357` got the wrong day.
When the model is down, `_answer` logs the failure and leaves the `Recorded:` echo.

## What to change

- **The Intent Read schema and prompt**, `memark/intent.py`: each end of the window may be
  `{"word": "..."}`. The prompt lists code's words from the same source `A_FIXED_WORD` uses, and
  shows ADR 0057's four rows as examples.
- **`memark/recall.py`**: a new function counts one copied word through the table `words_counted`
  uses. A word not in the message, or not matched whole by `A_FIXED_WORD`, is dropped and logged.
  `window_in` no longer reads a fixed word. `words_counted` stays for the reading-budget path only.
- **`a_clash`** now logs fields sent where the message held a list word, and names both. Rewrite its
  docstring.
- **`_window_for`**: a typed date, then a named occasion, then the reading's window with its words
  counted by code.
- **The model-down reply**: `I could not reach the model, so this question is not answered. Ask again
  later.`, a constant in `memark/answering.py`. The Capture is still saved. `MalformedAnswer` keeps
  `CAME_BACK_EMPTY`.
- **Past the reading budget**: code reads the first fixed word through `words_counted`, as before.
- Change the `recall.py` module docstring and `docs/stack/dates.md` where they say code reads the
  first word.

## Done when

- [ ] Each row of ADR 0057's table, with the reading stubbed, gives the days the table says.
- [ ] A word not in the message is dropped and logged, and with no day left the reply is
      `I could not tell which day you meant.`
- [ ] Fields sent where the message held `yesterday` are used, with one clash log line.
- [ ] A `FailingModel` gives the model-down reply, and the Capture is on disk.
- [ ] Past the reading budget, `how was yesterday?` is answered about yesterday.
- [ ] The tests from tickets 13 and 14 stay green.
- [ ] The unit suite, `mypy`, `ruff check` and `ruff format --check` are green.
