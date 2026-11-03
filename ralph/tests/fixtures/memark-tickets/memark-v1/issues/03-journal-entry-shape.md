# What a journal entry is, and where it lives

Map: [map.md](../map.md)
Type: grilling
Status: resolved

## Question

Journaling is in v1 and generated from Captures (settled). Nothing else about it is settled — the spec
calls it "genuinely unresolved, not merely deferred".

Decide what a journal entry *is* in this domain, because the two obvious answers behave very
differently:

- **Like a Capture** — immutable, permanent, never rewritten, one per day, provenance-carrying. Then a
  journal is a derived-but-frozen record and compaction never touches it.
- **Like a Card** — the agent may revise it, and it competes with the Card compaction rules.
- **Neither** — a third kind of thing with its own rules, requiring a new `CONTEXT.md` term.

Then:

- Where does it live? A `journal/` top-level folder, or inside `thoughts/`? The spec forbids the agent
  inventing top-level folders, so this must be fixed by name. Note `thoughts/reflections` is reserved
  and must not be collided with (see `CONTEXT.md` on Reflection).
- Is it named by day, like a Date File and the inbox — and is that the same day-in-configured-timezone
  the rest of the system uses (ADR 0022)?
- Does it have frontmatter, and does the schema decision from ticket 01 apply to it?
- Is a journal entry ever a Pinned Claim target — can you correct a day the system got wrong, and if
  so is your correction the entry or an annotation on it?
- What happens on a day with no Captures at all? An empty entry, no entry, or a stated absence?
- Is the journal ever *sent* to you, or only written to the Vault? (The spec's hard rule is exactly one
  Digest a day and nothing else that notifies. A journal that pings you breaks it; a journal appended
  to the Digest lengthens the one message you promised to read in full.)

Likely produces a `CONTEXT.md` term and an ADR.

## Answer

**A Journal Entry is a third kind of thing, and its defining property is that nothing reads it.** Not
like a Capture, which is a source. Not like a Card, which has a subject. It is the narrative record of
one day, derived from that day's Captures and read by the human alone. The inbox has the day but not
its shape; the Cards have the meaning but the day is gone. That gap is the whole of what a journal is
for, and it is a gap in what a human wants to read rather than in what the system needs to work.

**Nothing reads it back.** No Card claim may cite a Journal Entry, and it joins no retrieval corpus. It
is model-written prose derived from a Capture, so it is strictly lossier than the Capture and cannot be
cited; a claim resting on it would put a second, uncheckable hop under ADR 0019's orphan arithmetic, and
a search corpus holding both would return two hits on one day where only one is traceable. The mirror
of this is a constraint handed to ticket 06: **retrieval must read the inbox**, because for a large
class of questions ("when did I last eat pizza") the raw Capture is the only place the answer exists.

**Being read by nobody licenses the rest of the shape.** No frontmatter, no `schema: 1`, no Line Marks,
no Line Fields, no block ids. Every piece of structure in this Vault exists so code can read it, and
`schema` in particular was for *refusal* so a mis-parse could not skip the ADR 0005 and ADR 0019 checks.
There is no parser and there are no checks. So ADR 0026's grammar governs Cards and Date Files, and
`inbox/` and `journal/` are prose. `journal/` is the one place in the Vault where prose is prose, and
the one file that can be rewritten freely without breaking anything.

**Frozen, and immutable to the agent rather than immutable outright.** A day does not change and there
is no subject to compact toward, so compaction never opens `journal/`. A typo is fixed by hand in
Obsidian, where it was found; the agent never writes to an entry after the day closes. This is ADR
0005's asymmetry pointed the other way: the human's lines are the agent's to leave alone, and the
agent's prose is the human's to correct. That also disposes of the Pinned Claim question, since a
Pinned Claim protects a human line inside a file the agent writes, and **a whole journal file is what a
Pinned Claim is by default**. An agent-side typo fix was rejected because it means a model reading and
rewriting a file it was told never to rewrite, with none of the usual gates applying, and a
regeneration would silently destroy a hand edit.

**Location: a new fixed top-level `journal/`.** Not `thoughts/journal/`, because `thoughts/` is a Cards
folder and every file in one is a Card with a Registry row. A Journal Entry is not a Card and must not be
in the Registry, or the Registry stops being the list of subjects. `journal/` sits alongside `inbox/`
and `dates/`, the other non-Card folders. `thoughts/reflections` stays reserved and untouched.

**One entry per calendar day in the configured timezone**, ADR 0022's day and the same day the inbox
file uses, because two definitions of "day" in one Vault would put an evening Capture in one file and
its journal sentence in another.

**A day with no Captures still gets an entry, stating the absence.** The Health Canary's argument
applied to the journal: a missing file that could mean either a quiet day or a broken run is
unreadable two years later, and the Canary only spoke on the day. If every day has a file, a missing
file is unambiguously a fault. It also matches what the journal is for, since the weeks you were too
busy or too flat to write are information about those weeks. The cost is 365 files a year regardless,
some of them one line, and a little work on a day the run would otherwise skip.

**Never sent.** Vault-only. Appending it to the Digest doubles the length of the one message promised to
be read in full and mixes "what to do today" with "what happened yesterday". Even a one-line pointer
spends Digest space on something always true and never actionable. Sending it on request is a later
thought, not decided here.

### The folder layout, decided now because it cannot be decided later

ADR 0001 already settles the archiving worry: **"Archiving is a mark, not a move. The inbox is the
archive."** A filed Capture is marked in place, and the file is never relocated, because every Card
claim links back by path. So the inbox is never archived away and search over it stays cheap: about 3KB
a day is roughly 1MB a year and 5MB at five years, against the 15 to 63ms BM25 rebuild ticket 05
measured over 400 Cards.

But that same never-relocate rule makes the layout a decide-now-or-never question, and `inbox/` was
specced flat. So **all three date-keyed folders nest by year then month: `inbox/YYYY/MM/YYYY-MM-DD.md`,
`dates/YYYY/MM/`, `journal/YYYY/MM/`.** The filename keeps its full date rather than shrinking to the
day, so links are self-describing and grep output reads on its own. The month is `08`, not `AUG`,
because month names sort alphabetically and would start every year in April; `08-aug` was offered as a
middle ground and declined as text in a path that adds nothing its position does not already say.
`dates/recurring/MM-DD.md` is unaffected, capped at 366 files forever.

**A configurable date format in filenames was raised and rejected.** `YYYY-MM-DD` is a sort order, not
a display choice, so `DDMMYYYY` would put 01-01-2027 before 02-01-2026 in every listing. Every Card
claim links by path, so changing the format later rewrites every link in the Vault, which ADR 0001
forbids; a setting that can only be set before any data exists and never changed is a decision wearing
a settings key. And multi-user support is out of scope, so "someone else might prefer" is a user this
system does not have. **The axis splits instead: storage stays ISO, display becomes configurable.** A
config file already exists, since ADR 0022 makes the timezone a config value, so a date-display key and
a time-display key sit next to it and can be changed any day.

### Written as part of this resolution

ADR 0027 (the journal is written and never read), an amendment paragraph on ADR 0001 for the folder
layout, and a new `CONTEXT.md` term Journal Entry.

### Handed to other tickets

- **Ticket 04** (generation): written once after the day closes, never regenerated, and generated from
  the day's inbox file **whole** rather than from what filing drained, so it never waits on filing and
  needs no second pass.
- **Ticket 06** (retrieval seam): the inbox must be in the retrieval corpus; `journal/` must not be.
- **Ticket 13** (amend the spec): add `journal/` to the fixed top-level folder list; renumber every
  date-keyed path in the spec to `YYYY/MM/`; add the display date and time format config keys; state
  that ADR 0026's grammar governs Cards and Date Files only.
- **New ticket 15**: which timestamp dates a Capture. Surfaced by this decision.
