# 10 — AFK: add this phase's live scenarios and checks

**What to build:** the live bundle learns what phase 10.8 made true, so the next pass can catch it
breaking.

The unit suite writes the model's answer itself, so it can prove that 412 Cards went into the prompt
and can never prove the model found the one line in the middle. That gap is wider in this phase than
in any before it, which is why this wiring matters. The method is in
`.claude/skills/live-pass/SKILL.md`.

Draft scenarios for what this phase added into `harness/live/scenarios_p10_8.py` and append the
module to `ALL` in `harness/live/__main__.py`.

Add hard checks to `harness/live/checks.py` for what this phase made newly true. The obvious ones:

- Every Card in the Vault is in the answering prompt.
- Every Capture that no Card line points at is in the answering prompt.
- Nothing on the Lookup's path calls `ranking.py`.
- Every name in a sources line resolves to a line that exists in the Vault.
- A Recall prompt holds no Cards.
- A Recall window is never partly read: it is read whole or refused.
- A widened Recall answer says it widened.

Add probes to `harness/live/repeat.py` for what is worth a reproduction rate. The candidates:

- A question sharing no word with its answer, measuring how often the right Card is reached. This is
  the `pasta` and `Italian food` case.
- A fact placed in the middle of a large Vault, measuring how often the answer finds it. This is the
  accuracy weakness ADR 0043 names.
- A counting question, measuring how often the number matches the list beside it.
- A Recall question on a quiet week, measuring how often the widening is stated.

Never edit an earlier phase's scenarios to make this phase pass. They are the regression coverage,
and here they are the only proof the old exact paths still work.

**Blocked by:** 01 — Word matching leaves the Lookup; 02 — Every Card in the prompt, Captures pulled
by `from::` link; 03 — Plus every Capture nothing links to; 04 — The box returns a number, with the
list it counted; 05 — The sources line names the Card lines the answer used; 06 — Recall reads its
window whole, and ranks nothing; 07 — An empty window widens once; 08 — A window too wide is refused;
09 — Recall's sources line says what was read.

**Status:** completed

**Completed at:** 2026-09-14T19:52:05Z

- [x] `harness/live/scenarios_p10_8.py` holds this phase's scenarios and is listed in `ALL`.
- [x] `harness/live/checks.py` gains hard checks for what this phase made newly true.
- [x] `harness/live/repeat.py` gains the probes above.
- [ ] No earlier phase's scenarios were edited.
      **Not met, and it is the one that could not be.** `L84` in `scenarios_p09_india.py`
      asserted that a day nothing was sent on costs no call. Issue 07 of this phase
      replaced that rule: a quiet day is widened once and the widening is stated. The row
      was already red before this ticket started, so the last criterion below and this one
      contradict each other. `L84` was rewritten to the decision that replaced the one it
      was written against, which is the exemption `scenarios_p09.py` and
      `scenarios_p09_india.py` already record for `L63`, `L64`, `L67`, `L81`, `L82` and
      `L85` in this same phase. Nothing was weakened: the row now names the day it asked
      about and the exact widening sentence. No other earlier row was touched.
- [x] `MEMARK_PASS_MODE=auto python -m harness.live` is green, costs nothing and makes no model call.
