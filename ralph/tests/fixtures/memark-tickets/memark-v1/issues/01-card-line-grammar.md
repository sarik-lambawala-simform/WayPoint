# Card line grammar and schema version

Map: [map.md](../map.md)
Type: grilling
Status: resolved

## Question

The spec fixes Card frontmatter at three fields (`subject`, `kind`, `status`) and shows a body of
`##` sections with bullet lines carrying a wiki link back to their Capture — but nothing below the
frontmatter is actually specified. What exactly is a line in a Card?

The spec repeatedly says "code checks this", and code cannot check what it cannot reliably find.
Three v1 rules already depend on parsing the Card body:

- ADR 0019 — every Capture that ever produced a line must still have a line pointing back at it.
- ADR 0005 — Pinned Claims are filtered out of the applicable-edit set before writing.
- ADR 0021 — `done 3` must tick one specific checkbox at a known path and line.

Decide, precisely enough to write a parser and a validator against:

- A `schema:` version field in frontmatter — is it added, and what does it buy beyond a future
  migration script's ability to tell converted files from unconverted ones?
- Are section headings a fixed vocabulary, a fixed vocabulary per `kind`, or free-form for the agent
  to invent? (The Registry stops duplicate subjects but not near-miss headings — `## Wants`,
  `## Wishlist` and `## Would like` could all appear.)
- The claim line: where does the source wiki link sit, may a line carry more than one, and what
  happens to a line derived from two Captures after compaction?
- The Task line: checkbox shape, where the shown-count field the spec promises actually lives, and
  how it survives being ticked.
- The Contradiction pair: how two unadjudicated claims are marked so both are visibly unsettled and
  neither reads as settled (story 56).
- What a validator rejects versus repairs, and when it runs.

Constraint: the format must stay legible to a human reading it in Obsidian. A grammar that makes the
files unpleasant to read has defeated the point of a plain-markdown Vault.

Likely produces an ADR (the format is hard to reverse once Cards exist) and new `CONTEXT.md` terms.

## Answer

A Card line has a fixed grammar with five parts, in this order and no other. Everything but the text
is optional.

```markdown
- [ ] ! chase the plumber · shown:: 3 · from:: [[inbox/2026-08-24#^c118]] ^b91d
```

`- [ ]` checkbox, `!` Line Mark, the text, `·` separated Line Fields, block id last.

**Frontmatter gains `schema: 1`.** Not for migration. For refusal. A parser meeting a version it does
not know stops rather than reading the file wrong, because a mis-parse is exactly how the ADR 0005 and
ADR 0019 checks get skipped without anyone noticing.

**Block ids only where code must address a line.** So Tasks, for ADR 0021's footer, and nothing else
in v1. Line numbers break the first time a bullet is added by hand in Obsidian; a hash of the text
breaks on a typo fix; a block id survives both and is already the Vault's idiom in inbox files.

**Three Line Marks, split by who writes them.** `!` is a Pinned Claim and only the human writes it.
`?` is a claim that is not settled, written by the agent, carrying the same meaning `?` already has in
a Date File. The checkbox makes a Task. `x` is reserved and unused in a Card so its Date File meaning
cannot be claimed later by something else. Marks the human owns are safe by construction; every mark
the agent must apply is a rule a cheap model can get wrong and code then has to check, so the set of
agent-written marks is kept small deliberately. `!` and `?` cannot combine, and that needs no rule:
adding `?` is an edit, and ADR 0005 forbids the agent editing a Pinned Claim.

Todoist's `@` and `#` were considered and declined. Todoist needs them because it has no links. This
Vault has `[[Priya (colleague)]]` with Obsidian backlinks for free, and Date Files already own every
date in the system. Importing them would add a second way to do two jobs already done one way, which
is the same rot the fixed heading list exists to prevent.

**Only a marked line is protected.** The free rule was tempting: agent lines always carry a `from::`
link, so a link-less line must be the human's. It fails on the second half of story 53. Correcting an
agent line in place keeps its link, so the correction would read as the agent's own and stay editable.
Marking is therefore explicit and mandatory, and an unmarked line the human typed is an ordinary line
that compaction may reword or drop. This is a deliberate trade, decided by the human: a class of loss
in exchange for a grammar with no hidden state, where "protected" is a character you can see. Git
blame is not a substitute, because the next Filing Run commits whatever is in the worktree and so
attributes hand edits to the bot. **Story 53 needs amending to say the human marks the line.**

**Line Fields use `::`.** A migration script greps for a key, and `from:` with one colon occurs in
prose and inside quoted Captures, so a single colon cannot distinguish a field from the human's own
words. `from::` can, and it is Obsidian's own inline-field syntax, so the fields stay queryable in the
tool the Vault is read in. The parse rule and the grep rule are the same one: a `·`, a key, then `::`,
or it is prose. This also gives a cheap regression test, grepping for each key over the whole Vault and
asserting every hit is a real field. **Date File lines adopt the same grammar**, since two grammars in
one Vault is the thing being avoided, and changing them costs nothing today and is impossible after a
year of files. ADR 0011's decision is untouched; its examples are not.

**Sources.** `from::` at the end of the line, and a line may carry several links, which ADR 0019
already assumes when it predicts the pressure landing on how compactly a line carries several sources.
Forbidding it would ban merging and Cards would only ever grow.

**The Task line.** Checkbox first, so `- [ ] ! text`. The shown-count lives on the line as `shown:: 3`,
because the count belongs to the Task rather than to a run, and a Card is a file the system already
writes, so this stays inside ADR 0020. A ticked Task is ordinary content: compaction may fold its text
into a normal line and lose the checkbox, provided its `from::` link survives, which ADR 0019 already
requires. So a Card does not accumulate a graveyard of ticked boxes.

**Headings are a fixed list per `kind`, held in a file in the Vault.** Not in code, because a heading
approved by replying to a Digest cannot deploy a code change. Rejected proposals are kept in that file
as `x` lines, mirroring how a Date File remembers a rejected date, and the distillation call builds its
allowed set from the file at run time. The agent writes only under a known heading and may offer a
**Proposed Heading**, inert until confirmed. A heading the human adds by hand is kept, never written
into, and does not fail the Card. Without that last part, typing `## Health` into a Card would freeze
all filing for that subject until it was undone.

**A Contradiction writes nothing.** This ticket exposed a real conflict: ADR 0010 and the spec's
implementation notes say a `contradict` edit never reaches the write path, while story 56 says an
unresolved Contradiction stays visible in the Card. Both cannot hold, since nothing written means
nothing there to mark. Resolved in favour of the routing rule: nothing is written, the Capture stays
undrained, and every Digest asks again until it is settled, which is the behaviour a Date Request
already has. The cost is that an ignored Contradiction nags daily and is not visible while reading the
Card. It buys a rule with no exceptions, and it removes the case where the agent would have had to add
`?` to a Pinned Claim. **Story 56 needs amending**, and ADR 0010 carries an amendment paragraph.

**One gate, before write, run by a script.** In the same place ADR 0014 enforces the Pinned Claim rule
and ADR 0019 the orphan rule. There is deliberately no pass on read: nothing changes on read, and what
protects a read is not a second check but a parser with no quiet fallback, one that fails the whole
file on a line it cannot classify rather than returning the part it understood. A partial parse is what
makes the orphan count too low and a `!` invisible. The check is lint, not a model call, so it costs no
tokens, is testable against a folder of deliberately broken fixture Cards, and can run as a git hook.
One rule set, two callers: the write path over the files it is about to touch, and a `lint` command
over the whole Vault after hand editing.

**Nothing is ever repaired automatically.** A Card that fails takes the existing Stale Target path:
pending edits dropped, Captures left undrained, path named in the Health Canary. Repair would mean a
program rewriting a human's file with a grammar it just said it could not read.

**Written as part of this resolution:** ADR 0026 (the grammar), an amendment paragraph on ADR 0010,
and four `CONTEXT.md` changes: new terms Line Mark, Line Field and Proposed Heading, a rewritten Pinned
Claim, plus edits to Task and Contradiction.

**Left for ticket 13:** amend stories 53 and 56, update ADR 0011's examples and every Date File and
Card example in the spec to the `::` grammar, and add the Card grammar section to Implementation
Decisions.

