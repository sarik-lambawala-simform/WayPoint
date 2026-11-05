# Consolidate every answer into one spec

Type: task
Status: resolved
Blocked by: 01, 02, 03, 04, 05, 07, 08, 09

## Question

Nothing to decide. This is the last ticket of the folder, per the house rule that an issue folder
ends with a spec ticket.

Read the `## Answer` on every ticket above, and the map's Decisions-so-far, and write `../spec.md`
with the `to-spec` skill, in the shape
`.scratch/memark-p10.96-a-thought-marked-as-nothing/spec.md` uses: where it came from, the finding,
what ships, then the work broken into numbered issues.

Carry over from [../finding.md](../finding.md): the three findings, the rates tickets 02 and 04
measured, and the note that `claude-cli` mode adds Claude Code's own system prompt to every call.

End the issue list with the two the house rule requires: the AFK one that adds this phase's rows and
hard checks to `harness/live/`, and the HITL one that runs the live pass, marked `ready-for-human`
so the ticket runner skips it.

## Comments

**2026-09-30, while writing the spec.** Stopped before `../spec.md` was written. The code check found
that the box never writes an Agent Turn, so the Recent Exchange from ticket 03 has no bot side to
read. That is a decision, not a build step, so it is its own ticket:
[Where does the bot's side of a Recent Exchange come from?](09-where-the-bots-side-of-a-recent-exchange-comes-from.md)
This ticket is blocked on it. Everything else read clean: none of this map's decisions is built yet.
`memark/distillation.py:23` still sends every date the slow way, `window_in` in `memark/recall.py`
reads no relative word, and `_prompt` at `memark/answering.py:937` still takes no Thread.

## Answer

Written on 2026-09-30: [../spec.md](../spec.md). It carries the three findings, the rates from
tickets 02 and 04, and the `claude-cli` note. The build breaks into three strands and ten tickets,
10 to 19. Ticket 18 adds rows `L305` to `L313` to `harness/live/`. Ticket 19 is the live pass,
marked `ready-for-human`.

The code check on the same day found none of this map's decisions built. It also settled the two
details ticket 09 left to the spec:

- **The Chat Log's table:** one row per message, with its id, which way it went, its text, the id it
  replied to, when it was sent and when it was last edited. A wrapper around any `Transport` writes
  it, built in `transport_for` and in the harness session.
- **The baseline fixture's bot turn stays.** `tests/test_capture.py` and `tests/test_files.py` check
  that the inbox reader skips a block with no id, and an old Vault can still hold one. Only the
  docstrings that call it an Agent Turn change.

Two things the tree showed that the map did not:

- `tests/test_proposed_dates.py` asserts the rule ADR 0050 replaced. Ticket 11 brings it up to date.
- `L35` in phase 5's bundle sends `tomorrow` and is not broken, because filing reads no relative word.

One choice the spec made that no ticket named: the carried subject is named by the answer model,
told by code which subjects were carried. Ticket 03's example, `Things you and Wife both like: ...`,
reads as the model's words, so the spec follows it. A code-written line would be the other way.
