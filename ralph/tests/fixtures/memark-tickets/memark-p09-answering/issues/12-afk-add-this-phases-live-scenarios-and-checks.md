# 12 — AFK: add this phase's live scenarios and checks

**What to build:** the live bundle learns what phase 9 made true, so the next pass can catch it
breaking.

The unit suite writes the model's answer itself, so it proves the code around the model call and never
the call. That is why every phase ends with a live-model pass, and this ticket is the wiring for it.
The method is in `.claude/skills/live-pass/SKILL.md`.

Draft scenarios for what this phase added into `harness/live/scenarios_p09.py` and append the module
to `ALL` in `harness/live/__main__.py`. Add hard checks to `harness/live/checks.py` for anything this
phase made newly true. The obvious ones are that a Question is still appended to the inbox, that no
closed Task line ever reaches an answering call, that a miss is named before the answer, that Recall's
file choice costs no model call, and that a truncated range states its cut.

Add probes to `harness/live/repeat.py` for anything worth a reproduction rate. The candidates are a
question about somebody the Vault has never heard of, and a question naming several people where only
some are known.

Never edit an earlier phase's scenarios to make this phase pass. They are the regression coverage.

**Blocked by:** 01 — A Question about a named subject is answered, and still saved; 02 — An alias
resolves, and an ambiguous name is asked about; 03 — Word matching finds the Card when nothing is
named; 04 — A named match always survives, and a miss is stated first; 05 — Finding nothing is said as
a fact; 06 — The answer arrives whole and in plain text; 07 — The day's answering budget; 08 — Recall:
one literal day, read whole; 09 — Recall: a literal range, and where it was cut; 10 — Recall: a Date
File line is described for what it is; 11 — A named past occasion is found from the Vault's own record.

**Status:** completed

**Completed at:** 2026-09-08T22:40:08Z

- [ ] `harness/live/scenarios_p09.py` holds this phase's scenarios and is listed in `ALL`.
- [ ] `harness/live/checks.py` gains hard checks for what this phase made newly true.
- [ ] `harness/live/repeat.py` gains probes for the unknown-subject and partial-knowledge cases.
- [ ] No earlier phase's scenarios were edited.
- [ ] `MEMARK_PASS_MODE=auto python -m harness.live` is green, costs nothing and makes no model call.
