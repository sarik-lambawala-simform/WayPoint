# 06 — Should the model read the Vault itself?

**Type:** grilling

**Status:** closed. Its answer was overtaken by ticket 07 and its amendment went with ADR 0028 when ticket 09 superseded it. See the note at the bottom and the close note at the end.

**Blocked by:** none.

**Raised by:** the human, during ticket 02's session, 2026-09-10. Raised twice, so it is written down
rather than re-argued next session.

## The disagreement

ADR 0028, conversation finds Cards by matching words, has code pick what the answering call sees: BM25
through SQLite FTS5 over Card bodies and inbox Capture blocks, built per call and discarded. The model
never chooses what to open. It may only ask from the closed list in ADR 0002's amendment, deterministic
code selects what the model sees, which includes loading a Card **by name** but has no general search
entry, deliberately.

**The human's case.** Claude works on repositories of more than five thousand files and reliably finds
the right file to read and edit with no external search mechanism given to it. A Vault of a few hundred
Cards is smaller than that by an order of magnitude. Reading is not a write, so nothing is at risk.

## What is not in dispute

**Filing is untouched by this.** Every filing call carries every Registry row so the model can see every
subject that exists and cannot create a duplicate. ADR 0002 forbids pointing conversation's ranking at
what filing sees, and states the asymmetry: a bad chat answer wastes one reply, a bad filing decision
leaves two Cards for one person and nothing that can spot it. This ticket is about answering only.

**Reading is not risky.** ADR 0002 says it directly: code serves every request, so more searching is not
more risk, only more waiting.

## The case against, as recorded

**A wrong pick is invisible.** ADR 0028 considered a cheap-model pre-pass that reads and chooses, and
refused it in these words: when it picks wrong the answer still reads fine, which is the one failure
this spec keeps refusing everywhere else. In a repository a wrong pick breaks the build, fails a test,
or shows up in a diff the human reads. Here the human asked because they had forgotten, so they cannot
check the answer.

**A repository has handles a Vault does not.** Filenames, imports, symbol names. `getUserById` is
greppable. `am I being unfair about this` is not.

**Latency and the sources line.** Lookup costs about 27 ms at 400 Cards and 150 ms at 2000, inside a
Telegram round trip. A roaming read is a call per step. ADR 0028 also requires every answer to end with
one short line naming what it read, and that line is short because the pick is a short list.

## What the ADR already concedes

ADR 0028 writes its own weakness down and dates it: word matching cannot match on meaning, and
`am I being unfair about this?` shares no word with a Card about arguing with your mother. It says this
rests on a belief rather than a measurement, and it names the falsification: twenty real messages
written down with the notes each should find, checked at the two-week checkpoint when a real Vault
exists and again at roughly 200 Cards. Missing more than about a quarter is the trigger to escalate,
first to reordering by the link graph, then to embeddings.

**Agentic read is not on that ladder.** That is the omission this ticket exists to settle.

## Question

1. **Does agentic read become a rung on ADR 0028's ladder,** and if so where? Before link-graph
   reordering, between it and embeddings, or after? It sends less of the Vault to a third party than
   embeddings do, which is the reason embeddings are last.

2. **Is the twenty-message test still the gate,** or does the human's repository evidence stand in for
   it? The ADR's rule is that you climb on a quality symptom, and that symptom has never been measured
   because no real Vault exists yet.

3. **Who writes the twenty messages,** and when. It is a human artifact by definition: it is a list of
   what the person meant, which nobody else can supply.

4. **If it is adopted, what replaces the sources line.** A roaming path cannot be stated in one
   footnote, and ADR 0028 argues a line that appears only sometimes teaches you its absence means
   "trust me".

5. **Whether the closed list in ADR 0002 gains an entry instead.** A middle option nobody has costed:
   keep code as the picker, and let the model widen the search itself by asking again with different
   words, which is a bounded version of the same idea and already has its dry-round stop rule.

## Answer

Yes, as a rung that is written down and not built. Agentic read joins ADR 0028's ladder between
link-graph reordering and embeddings, and nothing about it is implemented in this build. The amendment
is on ADR 0028, which decided that conversation finds Cards by matching words.

**What it is, exactly.** Not a model roaming. The repository argument is missing a step: a model in a
repository lists filenames before it opens anything, and the answering call here has never been given
the equivalent list. `memark/answering.py:330` builds its prompt from the Cards, Captures and dated
lines the Lookup handed over, and nothing else, so the model cannot see which subjects exist. The
Registry is that list, about twenty tokens a row and eight thousand tokens at 400 Cards. So the rung is
the Registry listed to the answering call plus the model asking for Cards by name off it. That is
ADR 0002's amendment, the model may ask from a fixed list and code decides whether to serve it, with one
entry added for the listing. ADR 0002's refusal of a general search entry survives: a list of names that
already exist is not a search wearing a costume.

**Why the middle.** Three costs separate the three rungs and only one of them is money. Link-graph
reordering is code over links the Vault already holds: no new machinery, no wait, nothing stored.
Embeddings stay last because they send the contents of a person's life to a third party, which is the
reason ADR 0002's amendment already gives after it threw out the cost ordering. Agentic read sends
nothing off the machine, and what it costs is a tool loop. **The box has no loop anywhere.** Nothing in
`memark/` matches `tools=` or `tool_use`; every model call is one shot. So this rung is not a tuning
knob, it is a new class of system with variable latency, variable cost and partial failure halfway
through, and that is the real price of the middle slot.

**Nothing is built now.** Nothing waits on this ticket, and the trigger has never been measured because
no real Vault exists. Building a loop for a symptom nobody has seen is what ADR 0002, deterministic code
selects what the model sees, exists to refuse.

**The twenty-message test stays the gate, and the repository evidence does not stand in for it.** The
difference is the checker. A wrong file read in a repository breaks a build, fails a test, or shows in a
diff a person reads. Here the person asked because they had forgotten, so the wrong answer is the one
thing they cannot check.

That is not a reason to prefer BM25, though, and the session was careful about this. BM25 has the same
unverifiable failure: ticket 07 found `ranking.py` cuts nothing, in the code's own words at
`memark/ranking.py:34`, so the box returns everything the words reached, names its sources honestly and
says two people when the answer is nine. Both fail invisibly. What separates them is that word matching
fails in one fixed way a person can learn and work around by saying a name, and a roam fails differently
each run. For a box meant to survive years of neglect, a dumb failure you can learn beats a clever one
you cannot.

**The list carries no aggregate question.** A normal message is scored on the note it should find and an
aggregate question on the number it should return, which is not the same sheet. Counting questions here
would fail every run and drag the miss rate past a quarter, triggering a climb to a rung that fixes
nothing.

**What it does not fix, written into the ADR on purpose.** Ticket 07's class. A better picker returns a
better wrong number, because an aggregate question's correct material is every Card checked rather than
the best Cards found. Reading more by meaning would say six where the words said two, and would still
have no way to say what it had not read. Ticket 07 is where that class is decided, and this is the
handshake the index asked the first of the two to make.

**The sources line is recorded as unsolved rather than designed.** ADR 0028 requires one short line on
every answer naming what it read, and it is short because the pick is short. `read 41 of 412 Cards` is
short and useless. It is not designed here, because its shape cannot be argued before a real roam has
been watched, and a guess written now would be read later as a decision. It is a condition on climbing.

**One thing measured this phase argues the other way and is worth keeping.** Ticket 04 found the model
rewords an errand 15 times out of 15, so the words in a Vault drift. That hurts word matching more than
it hurts a read for meaning, and it is the strongest evidence for this rung. It also points at a cheaper
fix: if the twenty-message test fails, the filing prompt's word drift is worth attacking before the
Lookup is, because stable words help BM25 directly.

## Reopened by ticket 07, 2026-09-14

This ticket's answer put agentic read on ADR 0028's ladder, between link-graph reordering and
embeddings, as a rung nobody builds yet. Ticket 07 found there is no ladder.

The step this ticket missed is the same one the ladder missed. Every rung on it exists to pick the
material well before the model sees it, and picking is only necessary while the material does not
fit. `claude-sonnet-5` holds 1,000,000 tokens and `memark/answering.py:201` already runs on it. A
Vault of a few hundred Cards is near 150,000 tokens after five years. So the whole Vault fits, the
picker has no job, and a rung that picks better is a better answer to a question nobody is asking.

This ticket was also right about one thing and it survives. It said the model should read the Vault.
It was wrong only about how: it chose a tool loop over a list of filenames, and ticket 07 rejected
that, because a model that greps must guess the word before it greps and so cannot reach `pasta` from
`Italian food`. Reading beats asking.

**What is reverted.** The ladder amendment written into
`docs/adr/0028-conversation-finds-cards-by-matching-words.md`. ADR 0028 is superseded whole by ticket
09, so the middle rung goes with it rather than being edited out on its own.

**What carries forward.** The sources line for a roaming read, which this ticket deferred to ticket
07 on purpose. Ticket 07 answered it: the model names the Card lines it used, code checks them
against the Vault and writes the line itself.

**What to do with this ticket.** Nothing on its own. It is reopened so the map does not read as though
its answer still stands. Ticket 09 carries the work. Close it when ticket 09 lands.


## Close note, 2026-09-14

Closed by ticket 09, which was the condition this ticket was reopened under.

The half of this answer that was right is in ADR 0043, the model reads the whole Vault: the model
should read the Vault. The half that was wrong went with ADR 0028 rather than being edited out, because
there is no ladder left to carry a rung. Three specific things end here.

**The ladder amendment is not reverted, it is superseded.** ADR 0028's body is untouched under its new
status line, so the middle rung is still readable there as history. Nothing in the live ADRs points at
it.

**The Registry listing never reached ADR 0002.** This ticket described one entry added to the fixed
list, and ADR 0002's list was never edited, so there was nothing to take out. ADR 0002 now carries an
amendment saying so, and saying why nothing is added: a model given every Card has nothing to ask for.

**The sources line this ticket deferred is answered.** Ticket 07 answered it for both, and ADR 0043
carries it: the line names the Card lines the answer used, code confirms each exists and drops any the
model invented.

The twenty-message test survives as the accuracy gate, which is what this ticket wanted of it. What it
should now look like is still open and sits in the map's Not yet specified.
