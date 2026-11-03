# Phase 9.6 issues

Eleven tickets. Four were moved here from earlier phases. Tickets 05 and 06 were raised in session
while resolving 02, ticket 07 while resolving 05, ticket 08 while resolving 03, tickets 09 and 10 while
resolving 07, and ticket 11 while resolving 09.

All eleven are done. Ten are answered: 01, 02, 03, 04, 05, 07, 08, 09, 10 and 11. Ticket 06 was
answered, reopened when ticket 07 overtook it, and closed by ticket 09. **Nothing is open.**

Tickets 01 to 08 and ticket 11 are grilling tickets and an agent must not answer its own side of any of
them. Tickets 09 and 10 are tasks, and the arguments behind them are already finished, so an agent can
take both.

| # | Ticket | Came from | Blocked by | What it decides |
| - | ------ | --------- | ---------- | --------------- |
| 01 | [Which capitalised words are names](01-which-capitalised-words-are-names.md) | phase 9.5 ticket 01 | none, **resolved** | When the box says it knows nothing about something, which words may it say that about |
| 02 | [May the reserved Card hold a claim?](02-may-the-reserved-card-hold-a-claim.md) | phase 5.5 ticket 02 | none, **resolved** | Whether a thought that names nobody and asks for nothing is kept or dropped |
| 03 | [Should a Capture be filable in parts?](03-should-a-capture-be-filable-in-parts.md) | phase 4.6 ticket 06 | none, **resolved** | Whether two good facts wait on one disagreement |
| 04 | [Is the returning-errand link worth what it claims?](04-is-the-returning-errand-link-worth-what-it-claims.md) | phase 5.5 ticket 03 | none, **resolved** | Whether `again-of::` stays, is filled another way, or goes |
| 05 | [A Card for the person themselves](05-a-card-for-the-person-themselves.md) | ticket 02's answer | none, **resolved** | What the Card holding a fact about you actually is |
| 06 | [Should the model read the Vault itself?](06-should-the-model-read-the-vault-itself.md) | raised in session | none, **closed by 09** | Whether agentic read joins ADR 0028's escalation ladder |
| 07 | [The question that counts the whole Vault](07-the-question-that-counts-the-whole-vault.md) | ticket 05's session | none, **resolved** | What the box does with a question whose answer is a number over every Card |
| 08 | [What stops a Part Drained Capture landing twice?](08-what-stops-a-part-drained-capture-landing-twice.md) | ticket 03's answer | none, **resolved** | What refuses the second write of a fact that already landed |
| 09 | [The ADR that supersedes word matching](09-the-adr-that-supersedes-word-matching.md) | ticket 07's answer | none, **resolved** | Writing ticket 07's decision into `docs/adr/`, and what happens to the ten ADRs that cite 0028 |
| 10 | [Turn this map's answers into two specs](10-turn-eight-answers-into-two-specs.md) | the human, after ticket 07 | none, **resolved** | Splitting this folder's answers into `p10.7` and `p10.8` |
| 11 | [What Recall does when nothing ranks](11-what-recall-does-when-nothing-ranks.md) | ticket 09's work | none, **resolved** | What a date range does now that the Lookup no longer ranks, and what the 40-block cut was for |

## Why this order

**01 first, because work is already queued behind it.** Phase 9.5's ticket 02 is `ready-for-agent`
and blocked on this and nothing else. It is also the only one of the four whose subject is being
worked on right now: phase 9.5's ticket 03 is in progress and touches the same reply.

*Resolved. Take 02 next.*

**02 second, because it is the widest.** Three of the original four are one question in three shapes,
and this is the shape that decides the others. It asks whether the Vault keeps a thought with no home.
It also amends `CONTEXT.md`, and phase 5.5's ticket 05 waits on it as well.

*Resolved. The Vault does not keep it. Take 03 or 04 next, either order.*

**03 third, and this is the only real dependency in the set.** The question can be argued without
02. The naming cannot. A Capture that only partly landed needs a word in `CONTEXT.md`, and 02
decides whether a homeless thought is a thing the Vault keeps. Name the fourth state first, then
decide the Vault drops homeless thoughts, and you have named something the Vault does not do.

*Resolved. A Capture files in parts and stays queued while any part is owed an answer. The fourth state
is Part Drained. It opened ticket 08, which has to be answered before any of this is built.*

**05 and 06 are both free-standing.** Neither blocks anything and nothing blocks them. 05 finishes a
decision 02 only took in principle, so it should not sit too long. 06 argues with a shipped ADR and has
no deadline, but it is the one whose answer could reach furthest.

*05 resolved. The person gets an ordinary `person` Card named `Me`, reached by a literal the Intent Read
emits rather than by an alias.*

*06 resolved, then reopened by 07, then closed by 09. Agentic read became ADR 0028's middle rung, and
ADR 0028 is now superseded whole, so the rung went with it rather than being edited out.*

**07 next to 06, and they should be read together.** Both argue with ADR 0028's ladder and both leave
the sources line unanswered, so whichever is taken first should say what it expects of the other. They
are not the same question: 06 asks who picks what is read, and 07 asks what happens when the honest
answer is that everything must be read. 07 is the one with a worked failure behind it, asked in session
and reproduced against the code.

*07 resolved, and it did not stay inside its own question. Word matching leaves the Lookup and the
model reads the whole Vault. That reopened 06 and opened 09 and 10.*

**09 next, and it is takeable now.** A spec written against a superseded ADR is worse than no spec, so
the ADR goes before the specs. It is a task and an agent can run it alone.

*Resolved. ADR 0043 exists, ADR 0028 is superseded and nine of the ten citing ADRs are amended. The
tenth, ADR 0033, could not be brought into line, so it opened ticket 11 and ticket 11 took 09's place in
what ticket 10 waits on.*

**11 is now the second of the two questions a person has to answer.** ADR 0043 settled the Lookup and
never argued Recall, and Recall was built on two things ADR 0043 deleted: the ranking inside a date
range and the 40-block cut the daily cap sized. It is a grilling ticket. Take it in either order with
04, and both before 10.

**04 is no longer last. It is the other thing holding up 10.** For nine tickets it was the one nothing
waited on. Ticket 10 changed that. Ticket 10 is the hand-off off this map, and a hand-off happens when
the map is finished, so 04's answer has to be in a spec rather than left behind in this folder. It is
still a grilling ticket and still needs a person.

**10 last, blocked on both.** It is the only ticket here that reads every other answer, so it runs when
there are no other answers left to come.

**08 before 04, because it is the one thing holding up code.** It is not the widest question in the set
and it is the only one with an implementation waiting behind it: ticket 03's decision cannot be built
until it is answered. It is also narrow, so it should be a short session.

*Resolved. The duplicate is stopped on the read and not on the write: a Part Drained Capture is left out
of the filing scan until an answer lands on it. Ticket 03 is buildable. Take 06, 07 or 04 next.*

*The old note said 04 was last because nothing waits on it. Ticket 10 now does. The rest of that note
still holds: of its four options, the one the measurement most obviously supports deletes a field
rather than adding anything, so it should be a cheap session.*

## What each one unblocks

| Answer this | And this becomes buildable |
| ----------- | -------------------------- |
| 01 | **Done.** [phase 9.5 ticket 02](../../memark-p09.5-names-that-were-never-names/issues/02-the-miss-line-names-a-word-that-was-never-a-name.md) is unblocked, and its `Done when` list was rewritten: the answer removed the capital rule instead of narrowing it, so the work reaches `intent.py` and `handler.py` too |
| 02 | **Done.** Ticket 03 here is unblocked, [phase 5.5 ticket 05](../../memark-p05.5-days-and-the-reserved-card/issues/05-a-task-about-somebody-new-files-nothing.md) is unblocked, and ticket 05 here was opened by the answer |
| 03 | **Done and buildable.** It changes `memark/vault/apply.py` in three places, adds **Part Drained** to `CONTEXT.md`, adds a line to ADR 0010, amends ticket 02's answer, and opened ticket 08, which is now answered |
| 04 | **10 becomes takeable**, once 09 has landed too. One option amends ADR 0034's wording, one deletes the field. Either way it lands in `p10.7` |
| 05 | **Done.** It amends `CONTEXT.md` with `Me` and one sentence on `Loose Ends`, adds a Registry row and a Card, adds one emitted literal to phase 10's Intent Read, and moves the person's own Tasks off `Loose Ends`. It also opened ticket 07 |
| 06 | **Done.** It amends ADR 0028's ladder with a middle rung, names the aggregate class as out of that rung's reach, and makes the sources line a condition on climbing. No code in this build |
| 07 | **Done, and wider than asked.** ADR 0028 is superseded rather than amended, word matching leaves the Lookup, and `CONTEXT.md` gains no word because the class it expected to name no longer exists. It reopened 06 and opened 09 and 10 |
| 09 | **Done.** ADR 0043 is written, ADR 0028 is marked superseded, nine citing ADRs are amended, `docs/stack/search.md` is rewritten, `docs/stack/anthropic-api.md` and `CONTEXT.md` are corrected, and ticket 06 is closed. It opened ticket 11, which replaced it as what 10 waits on. No code |
| 11 | **Done, and 10 is now takeable.** Recall reads its window whole, ranks nothing and cuts nothing. ADR 0033's amendment decides instead of listing what is open, ADR 0043's "Recall is not settled here" is rewritten, and `CONTEXT.md` and `docs/stack/search.md` carry the path. No code |
| 10 | **Done. The hand-off landed.** [`p10.7`](../../memark-p10.7-a-capture-that-files-in-parts/spec.md) holds tickets 02, 03, 04, 05 and 08 in ten issues, [`p10.8`](../../memark-p10.8-the-model-reads-the-vault/spec.md) holds 07 and 11 in eleven. Ticket 01 needed no issue because its code already shipped in `e7e6b94` and `dee4c01`, and ticket 09's documents are the authority p10.8 builds against. The seam both phases touch is the `from::` link read: p10.7 builds it for Part Drained and p10.8 reuses it inverted. This map is finished |
| 08 | **Done.** Ticket 03's implementation is unblocked. It adds a filter to `memark/run.py:488` and a reader over every `from::` link in the Vault, leaves `memark/run.py:781` and `_extend_card` alone, and adds one sentence to `CONTEXT.md` and one to the filing prompt |

## Where the evidence came from

Each of the first four carries its own rates and its own reproduction command. Two things are true of
all four and are worth saying once. Tickets 05 and 06 carry no rates: neither came from the pass.

Ticket 07 carries no rates either, and unlike 05 and 06 it does carry a reproduction: the failure was
checked against `lookup.py` and `ranking.py` in session, and the finding that the Lookup cuts nothing is
what makes the wrong answer read as a sourced one.

**Every pass ran through the local Claude Code CLI.** So every call also carried Claude Code's own
system prompt and tool definitions, roughly twenty thousand tokens the box never sends. Each ticket
says which of its findings is structural and holds regardless, and which is judgement and would want
an API-key run to be certain of.

**Where a stronger model was tried, it is a diagnostic and never the answer.** Per ADR 0003 the
cheap tier is what filing runs on, so a comparison column saying Opus got it right means the prompt
is thin, not that the tier should change. Ticket 04 is the clearest case: Opus fails it too, and
harder, which is what places the fault in the design rather than in the model.

## How to resolve one

Per `docs/agents/issue-tracker.md`, the wayfinding half. Set `Status: claimed` and save before
starting. Append the answer under an `## Answer` heading, set `Status: resolved`, then put a one-line
gist and a link into [../map.md](../map.md) under Decisions so far.

`/wayfinder` drives that. `/mattpocock-skills:grilling` is the skill for the exchange itself, and
tickets 02 and 03 both name `/mattpocock-skills:domain-modeling` too, because both end in a word
`CONTEXT.md` does not have yet.
