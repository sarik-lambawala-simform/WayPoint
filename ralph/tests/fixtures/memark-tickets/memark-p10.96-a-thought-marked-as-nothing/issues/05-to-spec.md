# Consolidate every answer into one spec

Type: task
Status: resolved
Blocked by: 01, 02, 03, 04, 06, 07, 08, 09, 10, 11, 12, 13, 14, 15

## Question

Nothing to decide. This is the last ticket of the folder, per the house rule that an issue folder
ends with a spec ticket.

Read the `## Answer` on every ticket above, and the map's Decisions-so-far, and write
`../spec.md` in the shape `.scratch/memark-p10.95-a-question-filed-and-never-answered/spec.md`
uses: where it came from, the finding, what ships, then the work broken into numbered issues.

Carry over from [../finding.md](../finding.md): the reproduction rates, the comparison-model
column, and the note that `claude-cli` mode adds Claude Code's own system prompt and tool
definitions to every call, roughly twenty thousand tokens the box never sends.

End the issue list with the two the house rule requires: the AFK one that adds this phase's rows
and hard checks to `harness/live/`, and the HITL one that runs the live pass, marked
`ready-for-human` so the ticket runner skips it.

The rows for this finding already exist. `L300`, `L301` and `L302` are in
`harness/live/scenarios_p10_96.py` and the probes are in `harness/live/repeat.py`. The AFK ticket
adds whatever the decisions above make newly assertable, and never edits those three to pass.

## Answer

Written on 2026-09-25 as [../spec.md](../spec.md), with five build tickets, 16 to 20.

Reading the tree turned up two things the map had not said:

- **A unit test asserts the rule ticket 09 replaced.** It expects the bare quote-back for an
  all-`skip` cut. Ticket 16 rewrites it.
- **`L211`'s hard check goes red on every run that files the payment.** It wants the payment crossed
  out, and ticket 13 made the right answer an edit. Ticket 18 brings that one assertion up to "the
  payment is not lost", on phase 10.9's ticket 14 precedent.

The map's last fog item, a signal from the Intent Read reading `Me` while filing proposes nothing,
was ruled out of scope with the user.

The build tickets:

- [16. The reply to an all-`skip` Capture says `Nothing to file.`](16-the-reply-to-an-all-skip-capture-says-nothing-to-file.md)
- [17. Unit tests pin the prompt wording this map wrote](17-unit-tests-pin-the-prompt-wording-this-map-wrote.md)
- [18. `L211` asserts the payment is not lost](18-l211-asserts-the-payment-is-not-lost.md)
- [19. AFK: this phase's rows and hard checks reach the bundle](19-afk-this-phases-rows-and-hard-checks-reach-the-bundle.md)
- [20. HITL: run the live pass and file what it finds](20-hitl-run-the-live-pass-and-file-what-it-finds.md)
