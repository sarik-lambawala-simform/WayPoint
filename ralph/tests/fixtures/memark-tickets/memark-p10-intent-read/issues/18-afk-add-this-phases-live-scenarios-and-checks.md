# 18 — AFK: add this phase's live scenarios and checks

**What to build:** the live bundle learns what phase 10 made true, so the next pass can catch it
breaking.

The unit suite writes the model's answer itself, so it proves the code around the model call and never
the call. That is why every phase ends with a live-model pass, and this ticket is the wiring for it. The
method is in `.claude/skills/live-pass/SKILL.md`.

Draft scenarios for what this phase added into `harness/live/scenarios_p10.py` and append the module to
`ALL` in `harness/live/__main__.py`. Add hard checks to `harness/live/checks.py` for anything this phase
made newly true. The obvious ones are that the raw message is on disk whole before any change is
proposed, that no change ever resolves against something the Vault does not have, that every applied
change is named in the reply, that a repeating rule wrote nothing before the tap, that no alias reached a
Registry row without a `yes`, and that a Question answered from mid-message quoted the words it read.

Add probes to `harness/live/repeat.py` for anything worth a reproduction rate. The candidates are a
message carrying four intents at once, a Task closed by prose where two open Tasks are close in wording,
and a loose window with no stated width.

Never edit an earlier phase's scenarios to make this phase pass. They are the regression coverage.

**Blocked by:** 01 — The receipt order, and the first change end to end; 02 — The Intent Read's own daily
limit; 03 — A name is matched by code, never by the model; 04 — Closing a Task by prose; 05 — Many
intents in one message; 06 — `undo`; 07 — A date you stated is not a date it inferred; 08 — Tier, warning
time, and the word that names no number; 09 — A repeating rule always takes the tap; 10 — A rule missing
a number is asked about in the chat; 11 — `pick N <name>`; 12 — `unpark`; 13 — `alias <row> <word>`;
14 — The wider question rule; 15 — Recall's looser half; 16 — A dated errand that belongs to nobody;
17 — The reply is edited three times and is still one message.

**Status:** completed

**Completed at:** 2026-09-11T03:48:25Z

- [ ] `harness/live/scenarios_p10.py` holds this phase's scenarios and is listed in `ALL`.
- [ ] `harness/live/checks.py` gains hard checks for what this phase made newly true.
- [ ] `harness/live/repeat.py` gains probes for the many-intent, close-wording and loose-window cases.
- [ ] No earlier phase's scenarios were edited.
- [ ] `MEMARK_PASS_MODE=auto python -m harness.live` is green, costs nothing and makes no model call.
