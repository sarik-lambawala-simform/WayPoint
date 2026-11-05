# 06 — Should a question about the days ahead reach Recall?

**Type:** grilling

**Status:** completed

## Question

`?next week kya kya hai, kuch important to nahi` is one of the two or three commonest things a
person asks a notes system. Today it goes to Recall, which reads the inbox, which by construction
holds only what has already been sent. So the box widens a window into days that have not happened,
reads nothing from them, and answers that nothing is coming up.

The Vault does know what is coming up. Review Dates, repeating rules and open Tasks all point
forwards, and the Digest is built out of exactly those every evening. None of them is what a
forward question reaches.

So the question is where a forward window belongs, and there are three answers and no obvious
winner.

**It stays in Recall and Recall learns to look forward.** One function for "tell me about these
days", whichever side of today they fall. The cost is that Recall's whole shape is the inbox read
whole, per ADR 0033, and there is no inbox ahead of today, so it would be reading a different kind
of material under the same name.

**It goes to the Cards, like any other question.** The routing rule of ADR 0033 as amended sends the
Cards unless the message names a time and nobody. `next week` names a time and nobody, so it takes
the cheap path today. Sending it to the Cards would reach the Tasks and the dated lines and cost a
full read.

**It is a third function beside the two.** What is coming up is what the Digest already composes, so
a forward question is the Digest asked for on demand rather than at eight in the evening. That is
the cleanest answer and the most work.

The decision also settles a smaller thing: whether `recall.days_around`'s comment stays true. It
says a window running past today is not clipped, on the ground that a quiet tomorrow is as quiet as
a quiet last year. That reads differently once somebody has decided what a forward question means.

## What the pass saw

`L239` is the row. It cost one judgement call, widened a future week to 25 August through
14 September, and answered that nothing is coming up while this Vault carries a dated line on
27 August and a rejected one beside it.

This is fog on the map rather than a defect on its own. Ticket 05 fixes the sentence that goes out
today. Whether the question should have gone to Recall at all is this ticket, and an agent must not
answer its own side of it.

## Answer

A forward question reaches Recall, and Recall is widened to deserve it. None of the ticket's three
answers survived as written: the first was picked and then changed, and the other two were refused.

**Recall is one function for any window, past or future.** It keeps its name and its seam. What it
reads for a window is now three things rather than two: the inbox Capture blocks inside it, the Date
File lines inside it, and every open Task when the window touches today or later. A window wholly in
the past carries no Task, because a Task is a thing still to do and nothing about it is a fact of
last March.

This is the first answer of the three, with the cost the ticket named accepted rather than dodged.
Recall is no longer the inbox read whole. It is the Vault read for a stretch of the calendar, and
what a stretch holds depends on which side of today it falls on. ADR 0033's sentence that Recall
answers when, and Lookup answers what, is unchanged and is the reason this is not a new function.

**The Notice Schedule is not read.** A forward Recall returns every dated line the window covers,
whatever its `notice::` says. This is the one place a Review Date speaks outside the days its
schedule names, and ADR 0016 is untouched by it: the schedule decides when a date speaks on its own,
and this is a person asking. Without this the feature does not work at all. A birthday in March with
a fortnight of notice would stay silent in a question asked in September, which is exactly the
question people ask.

**Code picks the window and nothing else. The model narrows.** `next one year` can cover fifty
dated lines where five are about Mohan's work. Code does not drop the other forty five. Every line
the window covers goes into the prompt and the model answers the question that was asked. This is
ADR 0043, the model reads the whole Vault, applied where it has not been applied yet: a subject
filter in code is a picker, and a picker that drops the right line leaves an answer that reads
perfectly well. A year of dated lines is a smaller read than the Cards ADR 0043 already sends every
question.

**A named subject rides along as its Card, and never as a filter.** Where the Intent Read names
subjects beside the window, code loads each named subject's Card and sends it with the window. The
Registry already turns a name into a Card, at `lookup.names_a_subject` and the rows behind it, and
ADR 0032's amended list of what code may load already carries "load the Review Dates for a named
subject", which is this move on the same material. The Card is added, so nothing is taken away, and
the worst failure is a missing piece of context rather than a missing line. One name reaching two
rows is the Ambiguous Subject and is asked about rather than guessed, per ADR 0015, which needs no
new rule here.

**A message naming days reaches Recall whether or not it also names somebody.** The routing rule of
ADR 0033 as amended sends a message naming a time and nobody to Recall, and that arm is what sent
`?next week kya kya hai` to the right door for the wrong reason. It becomes: a message naming days
reaches Recall, and a subject named beside them adds that subject's Card to what Recall sends. So
`what is coming up with Mohan's work in the next one year` and `what did Mohan say about the school
fees last March` both read their window, and both carry his Card. One rule, predictable by reading
the message.

**A forward window that holds nothing is answered as empty.** `recall.widened` applies to a window
wholly in the past and to no other. You asked about next week, so next week is what you are told
about, and a thing on the 30th named under a question about next week reads like next week to
anybody not reading the footnote. ADR 0028's rule that finding nothing is an absolute is the same
rule read forwards: nothing next week is a true answer and a complete one.

**Forward, a line you turned down stays out and a line you never confirmed comes in, marked.** A `?`
line is a plan still floating and is worth knowing about, so it is returned and said to be
unconfirmed. An `x` line will fire on no day and is not part of what is coming, so it is not
returned. A `handled::` line is returned and said to be dealt with. ADR 0033's rule that Recall
never presents an inert line as a live one holds throughout, and its rule that nothing is suppressed
is narrowed here to the past, where a rejected proposal is part of what happened. Nobody was asked
about the `handled::` case; it follows from the other two and the spec should say so.

### What this costs and what it changes

- **One new ADR.** Recall reads forward, and what a window holds depends on which side of today it
  falls on. It amends ADR 0033 (a day is recalled from its Captures) on the shape of the material,
  ADR 0033's routing rule on the person arm, and states the Notice Schedule exception against
  ADR 0016 (a Review Date fires on the days its schedule names).
- **`memark/intent.py:327` is rewritten, not deleted.** It today tells the model that the month
  after today has not happened so a window inside it holds nothing. That sentence is now false. The
  new sentence says a window ahead of today is read for what is due in it. Ticket 05 is the ticket
  that writes it, and this is the answer it was blocked on.
- **`recall.widened` gains a direction rule** and `recall.days_around`'s docstring changes with it.
  The comment saying a forward window is not clipped stays true, and its reason changes: a forward
  day is not empty by construction any more, so it is read rather than reported quiet.
- **`recall.recall` gains open Tasks** and a rule for when they travel.
- **Every phrasing of a forward question now costs a window read plus one Card at most,** where six
  of seven runs used to cost the whole Vault. The bill goes down for the common case.

### The two refusals

**A third function beside the two was refused.** The ticket called it the cleanest answer and it is
not, once the material is checked. The Digest is not a forward list. `selection.what_is_due` returns
what today names through each line's Notice Schedule, so a Digest asked for on demand in September
says nothing about March and answers none of the three questions this ticket exists for. A third
function would therefore not be the Digest on demand. It would be a new window read sitting beside
an existing window read, with a second prompt to keep true and a third door for the routing to
choose between, buying only the name.

**Sending it to the Cards was refused.** It is what six of seven runs did. It costs the whole Vault,
it reaches dated lines only through the Cards that backlink them, and it cannot answer `pending
tasks today` as a question about today at all, because nothing in that path knows what today is.

### What was asked and what came back

Five questions were put to the person driving this map. The answers were: a forward question must
return what will happen rather than what was written about it, and it must take a subject filter and
a width; one door reads dated things and Tasks together; the whole window goes to the model with no
code filter; an empty forward window is answered as empty; and a turned down line stays out while an
unconfirmed one comes in. The sixth answer was the person's own and replaced both options offered:
the date door wins and the named person's Card goes along with the window.
