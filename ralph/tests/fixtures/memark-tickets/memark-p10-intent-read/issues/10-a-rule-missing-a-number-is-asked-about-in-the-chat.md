# 10 — A rule missing a number is asked about in the chat

**What to build:** when you say something incomplete, the bot asks which day you meant, right then,
instead of inventing one or waiting for tomorrow.

The test is mechanical and code runs it: can the rule be written without inventing a number nobody gave?
"Every month" asks which day of the month. "Every year" asks which date. "Every week" asks which day.
Those three and no others.

Everything else is complete as it stands. "Every three months" is complete once `since::` defaults to
today, because the anchor supplies the day. "The first Monday of every month" already names its day.
Asking about those would be asking a question the message already answered.

The question is asked in the chat straight away, not raised as a Digest item, because a rule you are in
the middle of setting is a rule you still have in your head. Nothing is written while it waits.

**Blocked by:** 09 — A repeating rule always takes the tap.

**Status:** completed

**Completed at:** 2026-09-10T00:21:50Z

- [ ] "Every month" with no day replies asking which day of the month, and writes nothing.
- [ ] "Every year" asks which date and "every week" asks which day, both writing nothing.
- [ ] "Every three months" is written without asking, with `since::` defaulting to today.
- [ ] "The first Monday of every month" is written without asking.
- [ ] The answer to the question completes the rule and then goes through the ordinary tap from ticket
      09.
- [ ] The incompleteness test is code and makes no extra model call.
