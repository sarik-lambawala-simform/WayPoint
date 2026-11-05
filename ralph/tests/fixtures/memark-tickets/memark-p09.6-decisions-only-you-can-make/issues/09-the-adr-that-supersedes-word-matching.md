# 09 — The ADR that supersedes word matching

**Type:** task

**Status:** resolved

**Blocked by:** none. Ticket 07 is resolved and carries the whole decision. This ticket writes it down.

**Raised by:** ticket 07's answer, 2026-09-14.

## Question

Nothing is left to decide. Ticket 07 settled it: the Lookup stops matching words, code puts every Card
in the prompt, and the model reads them. This ticket is the paperwork, and it is a task rather than a
grilling because the argument is finished and the writing is not.

## What has to be written

**A new ADR that supersedes ADR 0028.** Its decision is that the model reads the whole Vault. It must
carry ticket 07's four mechanical rules, because the ADR is what code is written against:

1. No word matching on the Lookup. Code assembles, the model reads.
2. One call, no tool loop. ADR 0002, deterministic code selects what the model sees, is kept: code
   still selects and what it selects is everything.
3. Every Card always. A Capture only when a Card line the answer used links to it.
4. Plus every Capture no Card line points at. Today's inbox, Parked blocks, refused claims and Part
   Drained leftovers, in one rule.

It must also carry what ticket 07 measured, because a decision with no numbers is re-argued: the
1,000,000 token window on `claude-sonnet-5` against near 150,000 tokens of Cards after five years, the
30 cents a question, and the roughly 30 years before Cards fill the window.

And it must carry the two things left open, stated as conditions rather than designed blind. Caching
only pays if the prompt is ordered stable first behind a breakpoint, and nobody has built that. The
read is reopened if it ever passes about half the window.

**ADR 0028 marked superseded, body untouched.** 55 files reference it, 16 in `memark/` and 10 other
ADRs. Deleting it would make the next person re-argue BM25 with no record that it was tried and why it
lost. One status line at the top, nothing else changed. The middle rung ticket 06 added to its ladder
goes with the whole ADR rather than being edited out on its own.

**Every ADR that cites 0028 checked.** Ten of them do. Each needs reading to see whether its own
argument rested on the picker. ADR 0002's amendment is the one to read first: it says the model may
ask from a fixed list, and rule 2 above means nothing asks any more.

**Ticket 06 closed.** It is reopened with a note saying ticket 07 overtook it. It closes when this
lands.

**Two stack docs.** `docs/stack/search.md` describes the Lookup that is being deleted, so it is
rewritten or removed. `docs/stack/anthropic-api.md:22` says caching does not help the scheduled runs at
v1 size, and the Vault read makes that line wrong.

**`CONTEXT.md`.** The Lookup's entry changes, because it no longer ranks. No new word is added: ticket
07 expected one for the aggregate class and found there is none left to name, because a box that reads
everything answers a counting question as an ordinary one.

## Done when

ADR 0028 reads as superseded, a new ADR holds the four rules and the three numbers, the ten citing ADRs
have each been read and either amended or left alone on purpose, `docs/stack/search.md` and
`docs/stack/anthropic-api.md` match the new decision, `CONTEXT.md`'s Lookup entry no longer says it
ranks, and ticket 06 is closed.

No code changes here. The code is ticket 10's spec.


## Answer

Written. **ADR 0043, the model reads the whole Vault**, is the new decision, and ADR 0028 carries one
status line saying it is superseded with its body and every amendment untouched.

ADR 0043 carries ticket 07's four rules, the three numbers, and the two open conditions as conditions.
It also carries three things that were in ticket 07's answer but not in this ticket's list, because
code is written against the ADR and each of them would otherwise be lost.

**The daily cap is gone, and that is a fifth rule.** Ticket 07's rule 7 said cost is paid rather than
capped. ADR 0028's cap of roughly forty answered messages a day was priced on a two-cent answer, and an
answer now costs near 30 cents. Two other ADRs cite that cap as a live number, so it had to be stated
as a deletion rather than left to be inferred.

**`ranking.py` is not deleted, and rule 1's wording is why.** It says no word matching *on the Lookup*.
`docs/stack/search.md` records a second caller, `tasks.the_task_said`, which closes a Task by what
somebody said they did over a corpus of the Vault's open Task lines. That caller keeps FTS5, the porter
tokenizer and the term selection. Without this written down the first person to act on "delete word
matching" would take the Task close with it.

**The miss line keeps its check and loses its index.** Ticket 01 decided a subject that reaches no
Registry row, no fold and no typo neighbour is asked of the corpus before the reply says the Vault
holds nothing on it. That question is a boolean rather than a rank, and code already holds every Card
and Capture it is about to send, so it needs no index. Carried as a consequence of rule 1 rather than
as a new decision, and written into ADR 0043 so `docs/stack/search.md` still traces to an ADR.

### The ten citing ADRs

All ten were read. Nine are amended and none is left alone, because every one of them cited ADR 0028
for a mechanism rather than in passing.

- **0002**, deterministic code selects what the model sees. Read first, as the ticket asked. Its title
  survives whole: code still selects, and what it selects is everything. The clause about not pointing
  conversation's ranking at what filing sees lost its subject rather than its force. Nothing is added to
  the fixed list and ticket 06's entry never reached it, so there was nothing to revert.
- **0005**, human claims are immutable to the agent. The second reader's gap shrinks without closing.
  The Pinned Claim that corrects a Capture is now always in the prompt beside it, which is the failure
  ADR 0028 created. Nothing still marks the Capture as no longer believed, so the model judges a
  contradiction rather than reading a mark.
- **0013**, the bot answers questions. Retrieval repointed at ADR 0043, citation rule kept, cap deleted.
- **0026**, a Card line has a fixed grammar. The `aka::`-on-the-Registry argument rested on ADR 0028
  resolving names exactly. The conclusion is unchanged and the reason moves to ADR 0032. The `from::`
  field gains a second reader on the answering path.
- **0027**, the journal is written and never read. The field strip survives, with the reason changing
  from noise in a ranking to noise in a prompt, which is worse rather than better.
- **0029**, both sides of a conversation are written. The missing block id still keeps an Agent Turn out,
  now out of a prompt rather than out of an index. The forty answered messages a day are gone.
- **0034**, a closed Task is hidden from the model. The strip survives on the second of its two reasons.
  The ranking argument is history; the token argument grew, because five hundred dead errands a year now
  go to the model on every answered message and ADR 0043 records that a long prompt is where a small fact
  gets lost.
- **0035**, the bot writes the inbox and never a Card. The one caller that keeps word matching, written
  up as such.
- **0037**, an unanswered question is parked never abandoned. A Parked block is exactly rule 4's set, so
  the promise that its words stay findable is now kept by reading rather than by ranking.
- **0033**, a day is recalled from its Captures. Amended, and **not** resolved. See below.

### One thing this ticket could not write down

**ADR 0033's Recall has two mechanisms that ADR 0043 removed from under it, and ticket 07 never argued
Recall.** A range is ranked by ADR 0028's word matching, which is deleted. And a range is cut at 40
Capture blocks, a number sized by the daily cap and by what one call could hold, both of which are gone.
The sources line for a Recall answer has a third shape, because a Recall answer has no Card lines to
name.

Reading a range whole is the obvious answer and it is the one nobody has costed: a loose window pulls
its inbox blocks into a prompt that already holds every Card, and ticket 07 measured Cards and not
ranges. So this is filed as **ticket 11, what Recall does when nothing ranks**, rather than decided as
paperwork. ADR 0033 carries an amendment naming what survives, what does not, and that ticket 11 holds
it. `docs/stack/search.md` says not to pick one in code first.

### The rest of the list

`docs/stack/search.md` is rewritten rather than removed, in four parts: the Lookup assembles, the
sources and miss lines, word matching in the one place it survives, and Recall's open half.
`docs/stack/anthropic-api.md` keeps its v1 Filing Run line, narrowed to the Filing Run, and gains the
answering call as the opposite case with the ordering condition on it.

`CONTEXT.md`'s Lookup entry no longer says it ranks and gains `ranking` on its avoid list. No new word
was added, as ticket 07 predicted. Its Recall entry is amended too, because it named the cut and the
ranking as built things.

Ticket 06 is closed with a note saying what of it survived and where each piece went.

**No code changed.** Ticket 10 holds the spec.


### One number in this ticket was wrong

This ticket and ticket 07 both say 55 files reference ADR 0028, 16 of them in `memark/`. The 16 is
mentions rather than files. Six modules under `memark/` carry those 16 mentions. ADR 0043 states it
that way instead. The argument is unaffected, because it rests on the references being spread through
the code and the specs rather than on the count.
