# 18 — A recalled answer contradicts its own window

**Type:** defect

**Status:** completed

**What to build:** A Recall answer that read something never says nothing was found, and a Recall
answer that read nothing never carries a footnote counting what it read.

**Reproduces:** Seen once on `L195` in phase 10.8 and once on `L239` here, and measured at
**0 of 5 on `claude-sonnet-5`** after the fix, in `live-repeat-p10.9-t18-v2.json`. Three of those
five runs carried a footnote counting six notes and four dated lines, and none of the three called
the window empty. The other two read no window at all, which is `L239:route`'s dimension and not
this one. No comparison run on `claude-opus-5` was made: `claude-sonnet-5` is the tier ADR 0003
puts judgement on, and a diagnostic against a stronger model closes nothing.

The measurement before the fix is in `live-repeat-p10.9-t18.json` and is not a rate for this
finding. See `## What the first measurement actually measured`.

## What happens

`L239` reached Recall, and the reply said:

> You sent me nothing between 01 Sep 2026 and 07 Sep 2026, so I widened to the 21 days from
> 25 Aug 2026 to 14 Sep 2026.
>
> Next week, your notes don't actually show anything at all.
>
> Read all 3 notes and 4 dated lines from 25 Aug 2026 to 14 Sep 2026.

The middle line says nothing was found. The last line says seven things were read. One of the two is
wrong and the person cannot tell which.

## Why

The window's material and the sentence about it are written by different things. Code counts what it
read and prints the footnote. The model writes the sentence. Nothing checks the two against each
other, so a model that read seven lines and judged none of them relevant says "nothing at all" and
the footnote contradicts it in the next breath.

This was watched rather than filed twice, in phase 10.8 and in 10.9, both times because the route
was too rare to measure. It is graduated here because ticket 06 changes that: a message naming days
now reaches Recall whether or not it names a person, so every forward question takes this path.

## The rule, decided

**The prompt separates the two claims. Code writes no second call and refuses no answer.**

Two sentences are being run together, and they are not the same kind of sentence.

*Nothing was sent in those days* is a fact about the window. Code already knows it before any model
is asked: a window holding neither a note nor a dated line costs no call at all, and
`sent_nothing` is code's own sentence for it, per ADR 0043, which made the footnote and the miss
line code's rather than the model's. The model is never in a position to state this one, because
the only windows it ever sees are the ones that held something.

*Nothing here answers what you asked* is a judgement about the material. It is the model's, and it
is a true and useful answer. Four dated lines about a wedding do not answer a question about work.

So the prompt tells the model which of the two it is allowed to write. Where any note or dated line
was shown to it, the window is not empty and it may not say the window is empty. It says the lines
it was shown do not answer the question, and says what they are about instead.

**Option B is refused, and it stays refused for a reason, not for being bigger.** The failing run
counted right and wrote wrong. The footnote said three notes and four dated lines and that was
exactly what the window held. Nothing about the count needed fixing, so a mechanism that re-reads
the count catches this bug by accident rather than by aim. It would also put a second model call on
every Recall, which is a price paid on every correct answer to catch a wording fault on a rare one.

This is not the shape of phase 10.85's ticket 14. There the model was asked to name the lines it
used and named none, so code had a list of the model's own to compare against. Here there is no
list. The disagreement is between a number and a sentence, and reading a sentence for what it
claims is the model's job, not a parser's.

**Per ADR 0002, deterministic code selects what the model sees.** That is untouched. Code still
picks the window, still counts it, still writes the footnote. What changes is one paragraph of what
the model is told about the material it was handed.

**B stays on the shelf.** If the rate does not go to zero on five runs, the refusal loop is the next
move and this section is the record of why it was not the first one.

## What to change

- `memark/answering.py`, the window paragraph of `SYSTEM`: the two claims are named and separated,
  and the empty-window claim is put out of the model's reach where the window held lines.
- `harness/live/checks.py`: a hard check reading the footnote's count against the answer's words,
  in both directions. A reply carrying a footnote never claims the window was empty, and a reply
  claiming the window was empty never carries a footnote.
- `L239` in `harness/live/scenarios_p10_85_india_wide.py` gains that check beside the route one.

## What the first measurement actually measured

`named_nothing_it_was_read` asked whether the answer's `lines` list was empty while the prompt
carried material, and on a recall that list is empty by construction. `lines` is for Card lines the
answer states; a recall prompt holds no Card, per `a_recall_prompt_holds_no_cards`. So a correct
recalled answer always leaves it empty.

The first five runs show it. Two came back `4 shown in the window and 4 named`, which is a model
putting dated lines into a field asking for Card lines. One came back `named none`, which is a model
doing what the prompt asks. The probe scored the obedient run bad and the two disobedient ones good,
and the `3 of 5` it printed is a rate for neither this finding nor any other.

The probe now reads the hard check, so the number and the row say one thing. The old reading is
described in its docstring rather than deleted, because the next person to see a `lines` list on a
recall should find out there why it is empty.

## Still open, and not this ticket's

`L239:route` measured **4 of 5 bad** on the same five runs, and at least some of those are the probe
rather than the box. `read_a_window_at_all` calls a run bad when no answering call was made, and a
window holding nothing costs no call at all: code writes `sent_nothing_in` or the widened form and
stops. So a correct quiet recall reads there as a question that never reached Recall.

Two other things showed up in the replies and belong to ticket 05, which owns the reading's window:

- The Intent Read returned `31 Aug 2026 to 06 Sep 2026` and `24 Aug 2026 to 13 Sep 2026` for
  `next week` on a clock standing in September. That is the past, and it is the wrong window
  rather than the wrong wording.
- A forward window was widened. Ticket 06's answer says `recall.widened` applies to a window
  wholly in the past and to no other.

Neither is touched here. The routing prompt is ticket 05's and doing both in one pass would leave
neither measurable.

## Done when

- [x] A Recall answer over a window holding lines never claims the window held nothing.
- [x] A Recall answer over an empty window still says so, and carries no count of what it read.
- [x] The row carries a hard check comparing the footnote's count against the answer's claim.
- [x] The rate is measured on five runs, now that ticket 06 makes the route reliable.

## Where it came from

`00-index.md` under **Watched, not filed**, and the map's **Not yet specified** before ticket 06
resolved. Ticket 06's answer is what made it measurable.
