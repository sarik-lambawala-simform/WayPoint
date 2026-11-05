# 14 — The wider question rule

**What to build:** a question buried in the middle of a longer message is answered, and the reply quotes
back the exact words it read as the question.

Phase 9 recognised a Question by a question mark at either end and nothing more. That was a deliberate
two-step: answering had to work before there was a model call on every message. The Intent Read is that
call, so the wider rule switches on here.

The quote is the scope of what was answered. It answers those words and nothing else. If a neighbouring
sentence mattered to the reading, it quotes that too, so a wrong read is visible in the reply rather than
buried in it.

A Question is still also a Capture, per ADR 0018, which decided a question is answered and then appended
to the inbox as an ordinary Capture. The whole message is saved whole, as always, and the question inside
it is never cut out.

The answer is written by the answering path phase 9 already built, on the strong tier per ADR 0003, and
it still ends with the line naming what it read. Nothing about how an answer is written changes here.
What changes is what counts as a question.

**Blocked by:** 01 — The receipt order, and the first change end to end.

**Status:** completed

**Completed at:** 2026-09-10T19:55:15Z

- [ ] A question in the middle of a longer message is answered, and the rest of the message is still
      acted on and saved.
- [ ] The reply quotes the exact words it read as the question, verbatim.
- [ ] The answer addresses those words and nothing else.
- [ ] Where a neighbouring sentence was needed to read the question, it is quoted too.
- [ ] The question-mark rule from phase 9 still answers on its own, with no regression.
- [ ] The whole message is still appended to the inbox as one Capture.
