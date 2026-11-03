# Which shapes beyond a day count does the model send?

Type: grilling
Status: resolved

## Question

Ticket 05 decided that the model never counts days. For a relative word code does not know, the
model sends a day count per end, `{"start": -4, "end": -4}`, and code turns it into a day. See
[Who counts yesterday: code or the model?](05-who-counts-yesterday.md) and ADR 0052 (code counts a
day from today, and the model never does).

A day count cannot say everything a person says about a day. The model would have to count to fill
it in, and counting is what it gets wrong.

Settle:

- Whether the model can send a weekday, like `{"weekday": "monday", "which": "last"}`, and what
  `last Monday` means when code counts it: the most recent Monday, or Monday of last week.
- Whether `this weekend`, `last week` and `N weeks ago` get a shape, and how wide each one is.
- Whether a shape the model cannot fill falls back to `I could not tell which day you meant.`

## Answer

Settled in a grilling session on 2026-09-30. Recorded in ADR 0053 (the model sends relativedelta
fields and a grain).

**The shape is `dateutil.relativedelta` fields plus a `grain`, one set per end.** The fields allowed
are `years`, `months`, `weeks`, `days`, `weekday` with an optional count like `MO(-1)`, and `day`.
`grain` is `day`, `week`, `weekend`, `month` or `year`. Code applies the fields to today, grows the
start to the first day of its grain and the end to the last day of its grain. One end only is used
for both. `earlier this week` is `start: {weekday: MO(-1)}`, `end: {}`.

**`dateparser` was tested and lost.** On 23 phrases it read 10, and gave wrong days inside a
sentence. The fields could say 22, and all 23 with one set per end. See
[dateparser against relativedelta with a grain](../assets/08-dateparser-vs-relativedelta.md).

**The words:** a week is Monday to Sunday. `last Monday` is the most recent Monday before today,
`this Monday` is Monday of this week, `next Monday` is the first Monday after today. `N weeks ago`
and `last to last week` are a whole week. `this weekend` is Saturday and Sunday of this week.

**Code reads the English words first**, `last/this/next <weekday>`, `last week`, `this weekend`,
`last weekend`, `N weeks ago`, and makes the same fields. The model is the fallback. Code wins a
clash and logs it.

**A shape code cannot read** gives `I could not tell which day you meant.` and no answer.
