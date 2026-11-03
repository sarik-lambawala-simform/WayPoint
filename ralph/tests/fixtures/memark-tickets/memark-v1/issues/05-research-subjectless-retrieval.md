# Research: retrieval options for subject-less conversation

Map: [map.md](../map.md)
Type: research
Status: resolved

## Question

Casual conversation is v1.1, but its retrieval mechanism is decided now (map Notes). Today the system
finds Cards by matching names the human typed against Registry rows — which works only because a
Question names its subjects. Casual talk names nothing: "am I being unfair about this?" points at no
subject.

Establish the facts a decision waits on. Read `docs/adr/0002-deterministic-code-selects-what-the-model-sees.md`
first — it records an escalation order and the trigger for taking each step, and any answer must sit
somewhere on that path or argue with it.

Find out:

- **Lexical ranking.** What BM25 over a few hundred small markdown files actually costs to build and
  run in Python with no database — libraries, index freshness, whether an index must be persisted (the
  spec forbids a second store of state, per ADR 0020) or can be built per call from the files.
- **Embeddings.** Current per-token cost of embedding a few hundred Cards and re-embedding on change;
  what a local embedding model needs on a laptop that is already running local transcription; and
  whether a rebuildable cache genuinely avoids ADR 0002's objection or merely relocates it.
- **Model-driven pre-pass.** Sending the Registry to a cheap model and asking which rows are relevant
  to an utterance. Cost per turn at 60 / 200 / 400 Cards; whether it is reliable enough to be the only
  retrieval step.
- **Cheap non-semantic signals.** Recency of Capture, recency of Card edit, `status: live` vs
  `dormant`, Cards touched in this conversation. What quality these reach alone.
- **Prior art.** How khoj, claude-obsidian and agent-second-brain (all surveyed in the spec) actually
  retrieve for open-ended chat, and what each admits about it.
- **Cost envelope.** For each option, cost per conversational turn, so the answer can be checked
  against the spec's cost table where Questions are already the largest line.

Write findings to `.scratch/memark-v1/research/subjectless-retrieval.md` and link it here. Cite
primary sources; state plainly where a number could not be found rather than estimating silently.

## Answer

Findings: [research/subjectless-retrieval.md](../research/subjectless-retrieval.md) — seven options,
each with costed numbers and its own specific objection, plus six facts explicitly listed as *not*
established rather than estimated.

The four that change the decision:

1. **Prompt caching is not useless here, and the spec is wrong on this point for conversation.** The
   spec says caching cannot help because runs are a day apart. True for Filing Runs and the Digest;
   false for conversation, whose turns are seconds apart — the 5-minute cache is refreshed free on
   every read, at 0.1x. Caveat with teeth: haiku's minimum cacheable prefix is 4,096 tokens, so a
   Registry of 60 Cards (~1,200 tokens) cannot be cached at all. Caching helps only past roughly 200
   Cards — i.e. it helps exactly the case that gets expensive, and does nothing on day one.

2. **BM25 needs no persisted index, so ADR 0020 has no objection to it.** Measured on this box, a
   whole index built from scratch over 400 Cards: 15 ms via stdlib sqlite FTS5, 63 ms via `bm25s`.
   Rebuild-per-call is free. Library note: `rank-bm25` is dead (no release since 2022-02-16); `bm25s`
   is MIT, numpy-only, actively released.

3. **Cost is never the objection to embeddings at this scale.** A full re-embed of 400 Cards is
   $0.0032, and free under Voyage's 200M/month tier. The real objections are egress of Card text
   (hosted) and a measured 12.6 s warm process start plus 482 MB RSS (local). ADR 0002 ordered its
   escalation ladder by increasing cost — and at 400 Cards every rung costs indistinguishably nothing.
   What still separates them is state, egress and dependency weight, which may be a different ordering.

4. **Anthropic's own stated no-RAG threshold is 200,000 tokens; the Vault at year five is ~160,000.**
   So this is a money problem, not a context-window problem, and no option may be argued for on the
   grounds that the corpus is too big to fit. "Send everything" costs $0.027/turn at 60 Cards and
   $0.068 at 400 — about $26/month at year five against a total bill of $5.10. Viable this year, dead
   by year three.

Two things the research hands directly to ticket 06 as sub-questions it must not skip:

- **Which corpus the ranking runs over.** ADR 0002's ladder was written for *filing*, and every rung of
  it concerns Registry rows and the no-duplicate guarantee. Conversation does not need that guarantee at
  all. BM25 over Card *bodies* — which is what all three surveyed prior-art projects actually do — is a
  different move from BM25 over Registry *rows*, and ADR 0002 reads very differently for each.
- **"A rebuildable cache" is not a specification.** ADR 0002 permits embeddings as a cache rebuildable
  from the Vault by one command. The research finds a **hash-keyed, fail-closed** cache satisfies
  ADR 0020 and an **mtime-tracked** one does not, though both are "rebuildable". Whichever way 06 goes,
  that distinction belongs in the ADR it produces.

Prior art: all three surveyed projects default to BM25 over raw markdown with embeddings opt-in or
consent-gated, and two run no vector store at all. None uses a model-driven pre-pass over an index of
subjects — that option has no prior art to lean on.

Costs nothing in money: cheap signals only, BM25, hosted embeddings, local embeddings. Costs 5–19% of
the whole bill: the haiku Registry pre-pass. Unaffordable past year one: whole Vault in prompt.

The largest gap, and it cannot be closed by citation: **no primary benchmark for BM25-alone quality on
a personal-notes corpus of a few hundred documents exists.** Anthropic's comparison table has no
BM25-alone row. Only the real Vault can settle it.

