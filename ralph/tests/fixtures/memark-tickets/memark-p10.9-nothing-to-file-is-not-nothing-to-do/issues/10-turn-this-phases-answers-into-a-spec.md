# 10 — Turn this phase's answers into a spec

**Type:** task

**Status:** completed

**Blocked by:** 01, 02, 03, 04, 05, 06, 07, 08, 09, 11, 12, 13, 14, 15, 16, 17, 18, 19

## Question

Every other ticket here is either a defect with a fix written in it or a grilling ticket with a
decision still open. None of them is a build. This ticket is where all seventeen become one spec
somebody can implement from, so the work is planned once rather than sixteen times.

Use the `to-spec` skill at
`~/.claude/plugins/cache/claude-plugins-official/mattpocock-skills/1.2.3/skills/engineering/to-spec`.

**Extend `spec.md`, do not overwrite it.** The file already holds where this phase came from, what
the pass measured and what worked. That is the evidence the decisions rest on and it stays. What is
missing is the build.

It is `ready-for-human` rather than `ready-for-agent` for the reason phase 10.85's ticket 08 was:
tickets 06 and 07 are grilling tickets and an agent may not answer its own side of one. A spec
written before those two are answered would carry a guess where a decision belongs.

**Check the code before writing an issue for anything.** Phase 9.6's ticket 10 found two of its
answers already shipped and two more it had assumed were built and were not. Do the same.

## The seams, so nothing is built twice

**Tickets 11 and 04 both change when a Capture drains.** 11 says a Capture that proposed nothing
drains. 04 says a Capture that proposed too little does not. Those pull in opposite directions
through the same function, `vault/apply.py:_drained`, and a spec that lets them be built separately
will get one of them reverted by the other. 11 is small and certain and 04 is open, so 11 goes
first and 04 is written against the code 11 leaves.

**Tickets 02 and 03 are both the filing prompt.** One adds an occasion rule and one adds a language
rule. They do not conflict, and they are two edits to one file, so say which issue owns the file and
have the other rebase on it.

**Tickets 05 and 07 both change what goes around an answer.** 05 is the Recall footnote and 07 is
what may sit beside a miss line. Both are sentences `answering.py` owns and both are read as
evidence for the paragraph above them. Decide 07 first, because a rule about what an answer may
volunteer changes what 05's footnote has to cover.

**Tickets 01, 09 and 14 are the harness and touch none of the above.** All three should be built
early, because every rate this phase asks to be measured again is measured through them. Ticket 01
first of the three: it is the one that makes three checks in `COMMON` see the whole Vault again, and
until it lands every other measurement is taken through a partly blind instrument.

**Tickets 12 and 13 are both the Intent Read's prompt.** One is what a bare day number means and one
is when `Me` is a subject. Two edits to one file, so name the owner and rebase the other on it. They
do not conflict in meaning.

**Ticket 12 and ticket 06 argue about the same thing from two ends.** 12 wants a window ahead of
today pulled back to the nearest past. 06 asks whether a question about the days ahead should reach
Recall at all. Answer 06 first or 12 will be built against a guess.

**Tickets 15, 16 and 17 have no rates.** None of them is planned into the spec until its rate is
taken. A spec that schedules work for a finding that turns out not to reproduce is worse than one
that leaves a gap.

## What the spec has to carry

- Whether this is one spec or more than one. Decide on the code and the dependencies, not on the
  count of tickets.
- The answers to 06 and 07, written as decisions with the reasoning, because both change behaviour
  a person will notice.
- Which ADRs move. Ticket 02 sits under ADR 0003's tier split and phase 10.85's ticket 04. Ticket 05
  sits under ADR 0033 and ADR 0043. Ticket 06, whichever way it goes, changes ADR 0033's account of
  what Recall is for, and that is written before the code rather than after.
- The order, with 01 before 04 and 07 before 05.

## What was written

The spec is the `## The build` half of [`spec.md`](../spec.md). The evidence half above it is
untouched, which is what this ticket asked for.

**One spec, not three.** The three strands share no file. Ticket 04 is the filing path, ticket 06 is
the question path's routing and window, ticket 07 is one prompt in `answering.py`. No function is
written by two of them and no ordering runs between them. What they do share is the evidence and the
live pass that grades all three at once, so splitting them would copy the same rates three times.

**The code was checked before anything was planned, and it moved the plan twice.** Fifteen of the
eighteen tickets shipped while this one waited, so the spec opens with a table of what is built and
what is not, read off the tree rather than off the board. Two findings from it:

- **Ticket 05's fix is in and ticket 06's is not.** `fix(06)` named ticket 06 in its subject and
  wrote ticket 05's sentence: the Intent Read now calls a forward window an ordinary window. None of
  ticket 06's own decision is built. Recall returns no Task, `widened` still applies either side of
  today, and no forward rule tells a `?` line from an `x` one.
- **Phase 10.85 answered ticket 06's routing question a different way while ticket 06 was open.**
  `handler._written` sends a message naming a subject and a window down the Lookup's road, so it
  costs every Card plus the window. Ticket 06 decided one Card plus the window. Both send the
  question to material that can answer it and they differ by the bill, and the expensive one is
  ADR 0043 applied.

**That last one was put to the person driving this map and it is answered: one Card plus the
window.** So ADR 0043 is amended on the person arm rather than ignored, and strand B's new ADR
carries the reason. A window is not the Lookup. It is an exact filter code already resolved, so
every line the window covers goes in and ADR 0043's worry about a picker dropping the right line is
answered. The named subject's Card is added on top, so the worst failure is a missing piece of
context rather than a missing line. A question that resolves no window still reaches every Card.
**Nothing in the spec is open.**

**The two ordering rules this ticket wrote are spent.** Ticket 01 was to land before ticket 04 and it
did. Ticket 07 was to be decided before ticket 05 and it was.

**Three new ADRs, named in the spec and written before the code.** A Capture is drained by coverage
and not by writes alone. Recall reads forward. What a reply may carry after it admits a gap.
