# 09 — AFK: add this phase's live scenarios and checks

**What to build:** the live bundle learns what phase 10.7 made true, so the next pass can catch it
breaking.

The unit suite writes the model's answer itself, so it proves the code around the model call and
never the call. That is why every phase ends with a live-model pass, and this ticket is the wiring
for it. The method is in `.claude/skills/live-pass/SKILL.md`.

Draft scenarios for what this phase added into `harness/live/scenarios_p10_7.py` and append the
module to `ALL` in `harness/live/__main__.py`.

Add hard checks to `harness/live/checks.py` for what this phase made newly true. The obvious ones:

- A Capture with one edit refused carries no `filed::` mark.
- A block cited by a `from::` link anywhere in the Vault is not in the material sent to the filing
  model, unless it carries a `subject::` with no `filed::`.
- No claim ever lands on `areas/loose-ends.md`.
- Nothing writes an `aka::` value onto the `Me` row.
- `again-of::` never holds a block id that is not in the Vault.
- Every `again-of::` value carries a filename.

Add probes to `harness/live/repeat.py` for what is worth a reproduction rate. The candidates:

- A brain dump carrying four facts and one homeless claim, measuring whether the claim is refused and
  the four still file.
- A claim about the person mixed with a claim about somebody else, measuring whether both land on the
  right Cards.
- A passing mood, measuring how often the durability test keeps it off the Card.
- A reworded errand against a closed Task on another Card, measuring how often the second call fills
  the link.
- The cheap tier emitting the literal `Me`, measuring both halves: it emits `Me` for a message about
  the person, and holds it back for `remind me`.

Never edit an earlier phase's scenarios to make this phase pass. They are the regression coverage.

**Blocked by:** 01 — `Me`, the second Card reserved by name; 02 — A claim aimed at `Loose Ends` is
refused however it got there; 03 — A Task about the person lives on `Me`; 04 — The seeding interview
fills `Me`; 05 — A Capture drains only when nothing derived from it is owed an answer; 06 — A Part
Drained Capture is left out of the filing scan; 07 — The returning-errand link goes Vault-wide;
08 — The closed-Task index and the second call.

**Status:** completed

**Completed at:** 2026-09-14T15:31:15Z

- [x] `harness/live/scenarios_p10_7.py` holds this phase's scenarios and is listed in `ALL`.
- [x] `harness/live/checks.py` gains hard checks for what this phase made newly true.
- [x] `harness/live/repeat.py` gains the probes above.
- [x] No earlier phase's scenarios were edited.
- [x] `MEMARK_PASS_MODE=auto python -m harness.live` is green, costs nothing and makes no model call.
