# 09. What does code do with two fixed words, or one the message takes back?

**Type:** grilling

**Status:** resolved

## Question

ADR 0052, code counts a day from today and the model never does, has `recall.words_counted` read
the **first** fixed English word in a message. Where code read a word, the model's window is not
used, and a clash only writes a log line.

Two messages show where the first word is not the answer. In both, the model was right, and code's
day won.

    you   not yesterday, the day before. how was my mood?
    bot   Tuesday 29 Sep 2026

The model sent `days -2`, Monday 28 Sep. Code read `yesterday`. `L356`: 1 of 1.

    you   how was my mood yesterday and today
    bot   Tuesday 29 Sep 2026

The model sent 29 to 30 Sep. Code read `yesterday` and stopped. `L357`: 1 of 1.

Clock: Wednesday 30 Sep 2026 20:00, `claude-cli` mode. Both are code, so the rate is the rule.

Which of these?

- **Code reads every fixed word**, and two of them make one window from the first day to the last.
  A word after `not` is not read.
- **Code steps aside** when a message holds more than one fixed word, or `not` before one, and the
  model's fields are used. The clash log line says why.
- **Neither.** Keep first-word-wins and accept these cases.

Settle also what `yesterday, not today` and `today or yesterday` should read as.

## Answer

Grilled on 2026-10-07. Written down as ADR 0057, the model picks the fixed word and code counts it:
[../../../docs/adr/0057-the-model-picks-the-fixed-word-and-code-counts-it.md](../../../docs/adr/0057-the-model-picks-the-fixed-word-and-code-counts-it.md).

- **Neither listed option.** The model picks, code counts. For each end the model sends a fixed
  word copied from the message, `{"word": "yesterday"}`, or ADR 0053's fields where no word on
  code's list fits. Code counts both. The prompt lists code's words.
- `not yesterday, the day before` is 28 Sep. `yesterday and today` is 29 to 30 Sep. `yesterday, not
  today` is 29 Sep. `today or yesterday` is 29 to 30 Sep.
- A word not in the message, or not on the list, is thrown away. No day left gives `I could not
  tell which day you meant.`
- Fields where the message held a list word are used, with one log line. Code does not override.
- Model down: no guess. The reply says `I could not reach the model, so this question is not
  answered. Ask again later.` The question is still saved.
- Past the day's reading budget, `intent-read-cap`: code reads the first fixed word, as before.
- Typed dates and named occasions stay code first. Not reopened.
- `CONTEXT.md`: the Recall entry says the model picks the word and code counts it. ADR 0052 is
  marked partly replaced.

Build: the Intent Read schema and prompt in `memark/intent.py`, `window_in` and `words_counted` in
`memark/recall.py`, `a_clash` and its log line, `_window_for` in `memark/handler.py`, and the
model-down reply in `_answer`. Ticket 03, the hyphen fix, is still needed. The `harness/live/` bars
for `L356` and `L357` expect the model's days.
