# 11 — What Recall does when nothing ranks

**Type:** grilling

**Status:** resolved

**Blocked by:** none. Ticket 09 has landed and ADR 0043 exists. This is the part of ADR 0033 that ADR
0043 left open.

**Raised by:** ticket 09's work, 2026-09-14, while reading the ten ADRs that cite ADR 0028.

## Question

ADR 0043, the model reads the whole Vault, settled the Lookup and never argued Recall. ADR 0033, a day
is recalled from its Captures, builds Recall on two mechanisms that ADR 0043 removed from under it.

**One. A range is ranked by word matching, and there is no word matching.** ADR 0033 says a date range
narrows the corpus to the inbox blocks inside it and ADR 0028's existing word matching ranks inside
that range. That was the whole reason a window did not have to be read whole. Three shapes are
available and none is obviously right. Read the range whole, which is the ADR 0043 answer applied here
and makes the cut below unnecessary. Keep ranking on this one path, which means `ranking.py` gains a
third caller beside `tasks.the_task_said` and the box keeps a picker in the one place ADR 0043 argued a
picker is always wrong. Or narrow by date and let the model read what the date reached, which is the
first option under another name unless something still cuts.

**Two. The cut at 40 Capture blocks was sized by a cap that no longer exists.** ADR 0033 caps the
material rather than the range because a month of Captures fed into one call would break ADR 0028's
arithmetic of roughly forty answered messages a day at about two cents each. ADR 0043 removed that cap
and prices an answer near 30 cents, paid rather than capped, and a month of Captures is a small
fraction of a 1,000,000 token window. So the number has lost its reason. Whether it keeps the number
anyway, as a guard on the one question a person can ask that has no natural size, is a separate
argument from whether it keeps the ranking.

**Three, and it follows from the first two. What the sources line says.** ADR 0033 makes the cut part
of the sources line: `read 40 of the 180 notes in that window`. ADR 0043 changed that line to name the
Card lines the answer used, written by code after it confirms each one exists. A Recall answer has no
Card lines. It has Captures and Date File lines. So the line has a shape here that ADR 0043 did not
give it, and the rule it must keep is the one both ADRs already state: a cut that is not stated reads
exactly like completeness.

**What is not in dispute.** Recall stays a second function beside Lookup. One named day is read whole.
A window with no stated width is three days either side. Date File lines stay out of the Lookup's
material. ADR 0033's amendment records all of that as surviving.

## Why it is a question rather than paperwork

The first option looks obvious and it is the one that costs the most. Reading a range whole means a
loose window like "that week in April" pulls its inbox blocks into a prompt that already holds every
Card, and nobody has put a number on a busy month. ADR 0043 accepted its own cost after measuring
Cards at 600 KB over five years. Nothing has measured a range.

Invoke `/mattpocock-skills:grilling`. `CONTEXT.md`'s Recall entry says a range is ranked by the
Lookup's word matching and cut at a fixed number of Captures, so whatever this decides lands there too.

## Done when

ADR 0033 carries the answer as an amendment rather than a list of what is open, `CONTEXT.md`'s Recall
entry no longer describes machinery that does not exist, and `docs/stack/search.md` says what Recall's
path does.

## Answer

Recall reads its window whole, ranks nothing, and cuts nothing. The 40 block cut goes. What replaces
it is not a smaller cut but a refusal: code measures the bytes it is about to send, and a window too
wide to read is refused with its width named rather than read in part.

**The arithmetic the ticket said nobody had done.** ADR 0043 measured Captures at near 2.7 MB after
five years at ten messages a day. That is about 1.5 KB a day, near 375 tokens. A week is about 2,600
tokens. A month is about 11,000. A year is about 135,000. The ticket's own worry, that a loose window
pulls its inbox blocks into a prompt already holding every Card, dissolves twice over. The month is
7% on top of the Cards, and the Cards are not in this prompt at all.

**One. Recall's prompt holds date material only.** The Captures inside the window and the Date File
lines it covers. No Cards. ADR 0033 already says Recall is a second function beside Lookup rather
than a mode of it, and this is that sentence paid for in the prompt. A month of Captures on its own
is about 11,000 tokens, so a Recall answer costs a fraction of a Lookup answer's 30 cents rather than
slightly more than it. The cost of the split is a question that is half when and half what: "what did
I decide about the flat that week" gets the window and not the `places/flat.md` Card. That is accepted
and it is the Intent Read's problem rather than Recall's, because a question about a topic is a Lookup
and always was.

**Two. A range is read whole.** The date is the filter and nothing else cuts. This is ADR 0043's rule
applied here rather than a new rule. Ranking was rejected for the reason ADR 0043 gives: a picker in
the one place ADR 0043 argued a picker is always wrong, and `that week in April` fails the way
`Italian food` failed, because a day's Captures rarely carry the words the question uses. ADR 0033
already wrote that down itself, in the sentence that word matching does not degrade here but fails
outright. So `ranking.py` gains no third caller. Its one caller stays `tasks.the_task_said`.

**Three. Nothing found means code widens once, by the window's own width, and then stops.** A named
day that holds nothing becomes three days either side, which is the width ADR 0033 already uses for a
window with no stated width. A seven day range becomes twenty one days. A month becomes three months.
The window always triples, so it is predictable without being read. At most two reads, both chosen by
code, so ADR 0002, deterministic code selects what the model sees, holds unchanged and no tool loop is
built. The model asking for more days was rejected on ADR 0043's three grounds, unchanged by swapping
words for dates: round trips while a person waits in Telegram, a first tool loop bought for one path,
and a guess made before the ask.

If the widened window is still empty the box says so and stops. It names the window it read and the
widening it did. Widening until something turns up was rejected: an answer about the wrong week reads
exactly like an answer about the right one, which is ADR 0028's rule that finding nothing is an
absolute, and ADR 0033's own rule that an empty day is a fact read from the absence of an inbox file.

**Four. The guard is measured bytes, not a count of blocks or days.** Code measures the text it has
assembled and refuses past about 500,000 tokens, half the 1,000,000 token window. That is ADR 0043's
own reopen condition reused rather than a number invented here. At 1.5 KB of Captures a day it is near
four years of material, so ordinary use never meets it and there is no cut on any real window. Days
were rejected as the unit because a quiet fortnight and a frantic one hold different amounts, and code
already holds the bytes. The widen step is checked against the same guard: where widening would cross
it, the box does not widen and reports the original window empty.

A refused window answers nothing. It names the width it will not read and asks for a narrower one.
Reading part of it and staying quiet is the failure both ADRs exist to refuse.

**Five. The sources line says what was read, not what was used.** One line: `read all 37 notes and 2
dated lines from 1 to 7 April`. Nothing is cut, so completeness is the true statement, and there is
nothing to hide behind. ADR 0043's shape, naming the exact lines the answer used, does not transfer:
a Recall answer has no Card lines, and naming Capture anchors like `inbox/2026-04-03#^c118` puts a
dozen ids that mean nothing by eye into a Telegram reply. Code writes the line, as ADR 0028 required
and ADR 0043 kept, and the model never does.

Both quiet acts are always stated. A widened answer says it widened and by how much. A refused window
says the width. The rule ADR 0033 and ADR 0043 share, that a cut you cannot see reads exactly like
completeness, is what forces both.

**What this did not touch.** Everything ADR 0033's amendment listed as surviving survives. Recall is a
second function beside Lookup. One named day is read whole. A window with no stated width is three
days either side. Date File lines stay out of the Lookup's material. An inert line is returned and
stated for what it is. The journal stays out.

**Reach outside this map.** ADR 0033 carries this as an amendment that decides rather than one that
lists what is open. `CONTEXT.md`'s Recall entry stops saying what a range does is open.
`docs/stack/search.md`'s Recall section stops telling code not to pick one of these before this ticket
lands. Ticket 10 loses its last blocker, and after it the map is machine work.
