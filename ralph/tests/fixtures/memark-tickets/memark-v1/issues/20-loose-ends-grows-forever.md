# Loose Ends grows forever, and poisons retrieval on the way

Map: [map.md](../map.md)
Type: grilling
Status: resolved

## Question

`areas/loose-ends.md` is the reserved home for every Task that names no subject and every dated errand
that belongs to nobody. It has no mechanism that ever makes it smaller, and four separate decisions each
remove one:

- **Closing a Task ticks the checkbox.** The line stays in the file. Nothing removes a `- [x]` line,
  ever.
- **Compaction cannot delete it.** Per ADR 0019 every Capture that produced a line must keep at least
  one line pointing back at it. A closed errand whose Capture fed only that line is unshrinkable by
  construction. Compaction rewords and merges; it does not remove. And compaction is out of the First
  Loop anyway.
- **It can never go dormant.** Dormancy needs a subject that has gone quiet, and Loose Ends is by
  definition always in use.
- **Task decay is out of scope.** The `shown::` field is recorded from day one so decay can be added
  without a migration, but v1 has no lifecycle.

So the file accumulates every subjectless errand you have ever had, permanently, in one document. Ten a
week is five hundred a year.

**The retrieval damage is worse than the size.** ADR 0028 ranks whole Card bodies by word overlap. Loose
Ends is the one Card guaranteed to be a grab bag of unrelated vocabulary, so it will weakly match almost
any question and can outrank the Card that actually holds the answer. It becomes a permanent noise floor
in the corpus, and it gets louder every week. Nothing in the current design notices this happening.

This matters more under the constraint recorded in [ticket 18](18-one-message-many-intents.md), that
opening Obsidian is optional. "Tidy the file by hand once a year" is no longer an available answer.

Decide:

- **Whether closed Tasks stay in the Card at all.** Options: leave them; move them under a `## Done`
  heading in the same file; move them to a dated archive file the way the inbox already works. The
  orphan rule of ADR 0019 constrains all three, and it is worth checking whether it actually forbids a
  *move* or only a deletion, since a moved line still points back at its Capture.
- **Whether closed Tasks belong in the retrieval corpus.** A ticked errand answers no question anyone
  will ask. Excluding them is a one-line change to what the Lookup indexes and probably fixes most of
  the noise problem without touching the files at all. Check that against ADR 0027's insistence that the
  raw Capture is where a whole class of answers lives, since the Capture stays indexed either way.
- **Whether the reserved Card splits.** `areas/loose-ends/YYYY.md` keeps the reserved-name property and
  bounds each file, at the cost of the invariant currently being checkable against exactly one path.
- **Whether this is Loose Ends only or every Card.** A ten-year Card for a spouse has the same growth
  with none of the vocabulary dilution. Say whether the answer generalises or is deliberately special to
  the one Card that has no subject.
- **When it starts to hurt, and whether anything watches for it.** The Checkpoint runs at two weeks and
  cannot see this. The Health Canary already reports the Registry's row count and token size. Decide
  whether a per-Card size or line count joins it, so the failure announces itself rather than being
  discovered.
- **Whether Task decay comes back into scope.** It is currently deferred, and it is the mechanism that
  would answer most of this. Say whether the answer here is a substitute for it or a stopgap until it
  is built.

Likely amends ADR 0019 or ADR 0028, the spec's Task representation and Vault layout sections, and the
Health Canary's contents. Feeds a re-run of [ticket 13](13-amend-the-spec.md).

## Answer

**A closed Task is hidden from the model, kept where it is, and never reopened.** Wrote ADR 0034;
amended ADR 0028, ADR 0026 and ADR 0019, and `CONTEXT.md`'s Task entry.

The ticket framed one problem and there were two, with different fixes and different prices.

**Retrieval noise is fixed by what is indexed, not by what is stored.** Code strips closed Task lines
out of a Card body before the Lookup builds its corpus. That is the whole of the noise fix, it touches
no file on disk, and nothing becomes unfindable, because the Capture that produced the errand stays in
the inbox half of ADR 0028's corpus and stays reachable by date through ADR 0033. One fact checked
along the way narrows the ticket's claim without changing the answer: FTS5's bm25 divides by document
length, so a long Card is already penalised and the noise floor rises more slowly than the ticket
assumes. It is still the right fix, because the problem is the mixture of words rather than the count
of them, and length normalisation does nothing about a mixture.

**The bigger cost was the one the ticket did not name.** The filing call reads the target Card, and
Loose Ends is the Card filing touches most, since every subjectless errand lands there. So a Done
section of five hundred lines is paid in cheap-tier tokens on many runs, forever, for lines nobody will
act on again. The same strip runs there, which makes this one function with two callers rather than a
retrieval tweak. Without that second caller, keeping closed lines in the file is a slow token leak.

**The line does not move, and ADR 0019 is why.** The ticket asked whether the orphan rule forbids a
*move* or only a deletion. Read for its wording it says "in that Card" and forbids the move. Read for
its purpose it forbids it harder: many errands are the only line their Capture ever made, so moving one
means opening Loose Ends, searching for the plumber, and finding nothing, which is exactly the amnesia
the rule was written against. So the `## Done` heading in the same file wins, the archive and the
`areas/loose-ends/YYYY.md` split both lose, and the reserved Card keeps the property that its invariant
is checkable against exactly one path. Three costs follow the archive and none follows the heading:
generalising to every Card means every Card gets a shadow file, which is a new class of file needing its
own rules about Registry rows and corpus membership; two homes means the ADR 0019 check, the linter and
the repeat matching each read two files; and the size is already free at run time once the lines are
stripped, so the archive buys tidiness in a tool the map says you never have to open. The argument
against is recorded rather than dismissed: stripping is enforced at read time and an archive would be
structural, and this design usually prefers structural. It loses because the amnesia cost is certain and
the forgotten call site is a maybe. This defers the ADR 0019 amendment rather than avoiding it, since
both remaining options need it if growth ever forces the move.

**Closing is terminal, which was the session's one addition from the human side.** A closed Task never
reopens. A returning errand is a new Task carrying `again-of::` at the old line's block id, filled by
code on an exact text match within the same Card, never by the model, since the strip rule means the
model cannot see the id it would have to cite. Stated cost: "chase the plumber" recreated as "chase the
plumber again" is a different string and gets no link, so the link is best effort and the ban on
unticking is the absolute part. Closing also writes `done:: YYYY-MM-DD`, without which the closed half
of a Card is undated, and a `done` Command naming an already-closed Task writes nothing and says so.
The rule binds the agent and not the human: a hand untick in Obsidian reopens the Task and is accepted
silently, because enforcing it would mean a program re-ticking a box a human deliberately unticked,
which is what ADR 0005 refuses.

**The answer generalises to every Card, for consistency rather than need.** A ten-year Card for a spouse
has the growth without the vocabulary dilution, so it has half the problem. One Task lifecycle is easier
to build and to check than two, and the noise half costs nothing where there is no noise.

**Task decay stays out and this is not a stopgap.** ADR 0007 still names Tasks as the layer where decay
is correct and `shown::` is still recorded from day one, but decay governs what the Digest shows you
while this governs what the file holds and what a model reads. They solve different problems, so decay
landing later replaces nothing decided here.

**The failure now announces itself.** The Health Canary gains one number: the line count of the largest
Card, with its name. Not a per-Card list, because the Canary is one line and a list grows with the
Vault. It counts every line including the closed ones, since an open-line count would never grow and
would hide the growth this exists to watch. No threshold, in the style of ADR 0002: the design is
revisited when the number stops looking sane to the person reading it. Without it the failure is
invisible, because the Checkpoint runs at two weeks and this takes years.

**For ticket 23.** The spec's Task representation paragraph gains closing behaviour, `done::`,
`again-of::` and the `## Done` heading; the Health Canary's contents gain the largest-Card number; the
Lookup and Filing Run sections both gain the strip rule as one shared function; the Card grammar
section gains the two field keys.
