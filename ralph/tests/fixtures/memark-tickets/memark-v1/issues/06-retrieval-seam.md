# The retrieval seam

Map: [map.md](../map.md)
Type: grilling
Status: resolved
Blocked by: 05

## Question

Decide how the system finds relevant Cards for an utterance that names no subject — and, given that,
what v1 must build so v1.1's conversation is an addition rather than a rewrite.

- Which mechanism, sited explicitly on or against ADR 0002's escalation path.
- Whether v1's Question path (ADR 0013, name-matching against the Registry) is rebuilt on the new seam
  immediately or left alone until v1.1. Deciding the mechanism now was justified precisely by not
  wanting two retrieval paths — check that this decision honours that.
- Whether the same seam is the answer to ADR 0002's *other* open problem: sending the whole Registry on
  every filing run. If it is, note that ADR 0002's escalation trigger is mis-filing rather than cost,
  and this must not become an excuse to optimise the Registry for money.
- What happens when retrieval finds nothing. The spec's hardest-won property is that a confident answer
  means it actually knew (stories 60, 75). Subject-less retrieval can return low-confidence matches,
  which is a new way to sound confident about nothing.
- The cost ceiling. Per-turn cost and a per-day cap, and what the system does on hitting it — refuse,
  degrade to cheap retrieval, or answer from less. Questions are already the largest line in the bill
  and conversation multiplies the turn count.
- What is testable through the existing single seam, given the spec forbids tests that reach inside a
  module or assert on prompts.

Likely amends ADR 0002 or produces a new ADR that sits on its path.

## Added by ticket 05's findings — do not skip these

- **Which corpus does the ranking run over?** ADR 0002's escalation ladder was written for *filing*:
  every rung concerns Registry rows and the no-duplicate guarantee. Conversation needs no such
  guarantee. BM25 over Card **bodies** (what all three surveyed prior-art projects actually do) is a
  materially different move from BM25 over Registry **rows**, and ADR 0002 reads differently for each.
  Say which, explicitly.
- **"Rebuildable cache" is not a specification.** A hash-keyed, fail-closed cache satisfies ADR 0020;
  an mtime-tracked one does not, though both are "rebuildable". If the answer involves any cache, this
  distinction goes in the ADR.
- **The ladder's ordering rationale has evaporated at this scale.** ADR 0002 ordered its rungs by
  increasing cost. At 400 Cards, BM25 costs 63 ms and embeddings cost $0.0032 a rebuild — all
  indistinguishable from zero. What still separates the options is state, egress and dependency weight.
  Decide whether that is the same ordering, and if not, say so rather than quietly reordering.
- **Prompt caching is available to conversation and the spec says otherwise.** Turns are seconds apart
  and the 5-minute cache refreshes free on each read. But haiku's 4,096-token minimum prefix means a
  60-Card Registry cannot be cached at all — caching helps past ~200 Cards and does nothing on day one.
  Any cost ceiling this ticket sets must be costed both ways.
- **The corpus is not too big to fit.** Anthropic's stated no-RAG threshold is 200,000 tokens; the
  Vault at year five is ~160,000. No option may be justified on context-window grounds — this is
  entirely a money and quality argument.
- **The quality question cannot be settled by citation.** No primary benchmark exists for BM25-alone
  on a few-hundred-document personal-notes corpus. If the decision rests on BM25 being good enough,
  it rests on a belief, and the ticket should say what would falsify it and when that gets checked.

## Answer

**Wrote [ADR 0028](../../docs/adr/0028-conversation-finds-cards-by-matching-words.md); amended
[ADR 0002](../../docs/adr/0002-deterministic-code-selects-what-the-model-sees.md); new `CONTEXT.md`
term Lookup.**

**The mechanism is word matching, and it sits beside ADR 0002's ladder rather than on it.** BM25 via
SQLite's FTS5 with the porter tokenizer, over Card **bodies** and inbox **Capture blocks**, one Card
and one Capture being the unit. The Registry is not the corpus: a row is ~20 tokens of name and gist,
built to stop duplicates, and too thin to match a message that names nothing. The journal is not in
the corpus, per ADR 0027. Because the corpus is bodies rather than rows, ADR 0002's rule that ranking
may decide whose description is expanded but never who is listed does not bind here. That rule protects
the no-duplicate guarantee, and conversation has no such guarantee to protect. The ladder is for filing.

**No index is stored, so there is no refresh question.** Built inside the call, in memory, discarded on
return. At 400 Cards: 11.5 ms read, 14.7 ms build, 0.38 ms query, about 27 ms total, ~150 ms at 2000
Cards. Nothing can go stale because nothing persists. ADR 0020 is untouched rather than argued with.
FTS5 over `bm25s` (4x faster to build here, and it ships with Python) because the spec asks for a system
that survives years of neglect and every third-party package can rot.

**The query is the conversation so far, not the last message.** A genuinely subject-less utterance is
usually turn three; turns one and two had words in them. This is the answer to lexical matching's
central weakness, and it creates a dependency on ticket 08: how much of the conversation is available
to query is exactly what dialogue state decides.

**One Lookup, built in v1, with name matching surviving inside it.** The v1 Question path moves onto
the seam now rather than in v1.1. A named subject still resolves exactly against the Registry, because
three promises die under a top-k: stories 60 and 75 (say which names it has nothing on), ADR 0015
(ambiguous names are asked about), ADR 0025 (Merge Proposals). Ranking runs when nothing was named, and
as an addition when something was, and never suppresses a named match.

**Filing is untouched, and this is not a Registry cost fix.** Filing still sends the whole Registry.
ADR 0002's trigger stays mis-filing, not money, as the Cost section insists. Written into both ADRs that
the two must not be merged: ranking what filing sees trades a guaranteed no-duplicate property for a
top-k that can miss, and the failure costs are not comparable. A bad chat answer wastes one reply; a bad
filing decision leaves two Cards for one person and nothing that can spot it.

**Finding nothing is an absolute, not a threshold.** Zero shared meaningful words means the bot says it
does not know what you are referring to and asks. A weak match is answered, with the notes it used
named, so a wrong pick is visible when it happens. Deliberately no confidence threshold: khoj admits
its equivalent is hand-tuned per model, and such a number cannot be asserted through the single test
seam against a Vault that does not exist yet.

**Observability is the reply naming its sources, and nothing else in v1.** ADR 0013 already requires
this for Questions, so it is not new work. No log file, because that is a file nothing else reads. If
named sources prove insufficient to debug a bad answer, that is real evidence for adding a `why`
Command later.

**The cost ceiling, with one of its three options emptied.** Retrieval is free, so "degrade to cheap
retrieval" does not exist under this decision. Per turn the cost is the answering call alone, ~$0.02,
unchanged from a Question today. The cap is on answered messages, ~40/day; on reaching it the bot says
so and keeps saving everything sent. It never switches quietly to a weaker model.

**What is testable through the single seam.** The message handler's existing seam covers it, asserting
on reply text rather than on prompts or call counts: a message naming a subject in the Registry,
asserting the named Card's Captures are cited; a message naming nothing but sharing distinctive words
with one Card, asserting that Card's Captures are cited; a message sharing no meaningful word with
anything, asserting the reply asks rather than answers; a message naming a subject *and* sharing words
with another Card, asserting the named match is still cited. Ranking *quality* remains unassertable, as
the spec already says, which is why it gets a falsification date instead.

**What would falsify this, and when it gets checked.** Twenty real messages written down with the notes
each should find, checked at the two-week checkpoint (ticket 11) and again at ~200 Cards. Missing more
than about a quarter is the trigger to escalate: first to reordering results by the link graph the Vault
already has for free (every Card claim links to its Capture, every Review Date names its Card), only
then to embeddings.

**Graphify and code knowledge graphs, asked during the session and ruled out.** It parses source with
tree-sitter into call graphs, imports and dependency chains, and persists three files. The Vault has no
functions and no imports, so there is nothing of that kind to extract, and the persisted graph is the
staleness problem ADR 0020 refuses. The useful half of the question survives as link-graph reordering
above, which needs no tool because the links are already in the files.

**Note for a later escalation.** If embeddings are ever added, a cache keyed on the SHA-256 of a Card's
bytes holds no independent fact and satisfies ADR 0020 (43.8 ms to hash all 400 Cards); an
mtime-or-timestamp cache holds a new fact about the Vault and does not. Both get called "rebuildable".
Recorded in ADR 0028.

**Downstream of this decision.** Ticket 08 (dialogue state) now carries a stated dependency: Lookup
queries the conversation so far, so how much of it survives between turns is load-bearing for retrieval
quality, not only for pronoun resolution. Ticket 11 inherits the twenty-message check. Ticket 13 carries
the ~40/day cap and the amended Out of Scope entries into the spec.
