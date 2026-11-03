# 13 — HITL: run the live pass and file what it finds

**What to build:** the pass itself, run by a person, with whatever survives filed as the next bug
phase.

**Status:** ready-for-human

This is `ready-for-human` on purpose. `run-ralph-tickets.sh` picks `in-progress` first and then
`ready-for-agent`, so it skips this one rather than failing it. It needs a person for two things no
agent may do alone.

The messages have to come from the person whose Vault it is. A set an agent invents tests its own idea
of a thought, and this phase is answered from real thoughts or it is not tested at all. The drafts from
ticket 12 are a starting point to edit, not a substitute.

And nothing is filed as a defect until it reproduces, five runs out of five on the filing model, via
`python -m harness.live.repeat`. This rule exists because the first pass of this bundle produced a
write-up claiming a defect that five repeat runs then killed.

Whatever survives is filed as `.scratch/memark-p09.5-<slug>/` before phase 10 starts. A finding that
needs a human decision rather than an implementation is a wayfinder grilling ticket, not an
implementation ticket.

The manual pass in the spec is part of this ticket. Ask twenty real questions across a week, of both
shapes, and write down for each whether the answer was right, wrong, or honestly absent. Wrong is the
only bad outcome.

**Blocked by:** 12 — AFK: add this phase's live scenarios and checks.

- [ ] The scenarios were edited or replaced with messages the Vault's owner actually wrote.
- [x] The pass ran against a real model and the write-up separates what must be true from what the
      model chose.
- [ ] Twenty real questions were asked across a week and each answer was recorded as right, wrong or
      honestly absent.
- [x] A question about somebody the Vault has never heard of was asked, and it said so.
- [x] A question about two people where one is unknown was asked, and the warning came before the
      answer.
- [x] A question whose answer has since been corrected was asked, and the known cost of the inbox
      being in the corpus was seen at least once knowingly.
- [ ] Ten sources lines were read and every source was found in Obsidian.
- [x] Every claimed defect reproduced five runs out of five via `python -m harness.live.repeat`.
- [x] What survived is filed as `.scratch/memark-p09.5-<slug>/`.

## Comments

Run on 9 September 2026. Findings filed as
[../../memark-p09.5-names-that-were-never-names/](../../memark-p09.5-names-that-were-never-names/):
one grilling ticket and two implementation tickets.

### Three boxes are still open, and they are open on purpose

**The messages are not the owner's.** The owner read this ticket, saw that an agent-written set
tests the agent's idea of a thought, and asked for the set to be written anyway so that Indian and
Hinglish phrasing got covered thoroughly. So the 23 rows in
`harness/live/scenarios_p09_india.py` are mine, not theirs. Ticket 02 of phase 9.5 does not care:
it is code, it is deterministic, and it reproduces at the function level with no model in the loop.
Ticket 03's rate could move on a set of real messages. What makes it solid anyway is that the same
defect reproduces 5 of 5 on `L73`, which is a phase 9 row written against the other household.

**No week of real use happened.** 23 questions were asked in one sitting against a fixture, not 20
across a week against a live Vault. Every answer was read and recorded as right, wrong or honestly
absent, and that record is the "What the pass proved works" section of phase 9.5's `00-index.md`.
Two answers were wrong, and both are filed. Nothing was recorded as wrong that is not in a ticket.

**Nothing was opened in Obsidian.** What I did instead: parsed all 15 sources lines the pass
produced, split each into its cited sources, and resolved every one against the fixture on disk. 45
of 45 resolve. 9 Card citations to files under `people/`, `projects/` and `areas/`, 34 `your note
from` citations to inbox files, 2 `your dates for` citations to Date Files. These are test fixtures
rather than the owner's Vault, so there was no Obsidian to open them in. The check the box was
written for is that a cited source is a real file, and that held.

### The pass caught the harness before it caught the box

The first real run reported 16 of 23 rows failing, all of them with
`ModelFailed: this mode needs the claude CLI on the PATH and it is not there`. No model call was
made. That is the `a real model answered` check doing the one job the README says it exists for: an
empty Vault satisfies every other check, so without it the run goes green on nothing. Worth writing
down because it worked.

### What this leaves for a person

Ticket 01 of phase 9.5 is a grilling ticket and nobody may answer their own side of it. It asks
which capitalised words in a message are names, and every option on the table trades one true line
against another. Story 60 says an unknown person must be named. Story 75 says the miss line must be
true. `?did the EMI go out this month` is where those two meet.
