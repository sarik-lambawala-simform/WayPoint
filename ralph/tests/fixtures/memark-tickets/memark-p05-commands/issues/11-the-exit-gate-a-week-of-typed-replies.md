# 11 — The exit gate: a week of typed replies

**What to build:** nothing. This is the week of real use that decides whether the loop the Digest
opened is actually closed, which no automated case can answer.

The phase's claim is that every question the Digest asks now has a reply you can type, one-handed, for
free. The only way to test that claim is to answer real Digests for a week with typed Commands alone and
see whether anything the list asks leaves you with nothing to say.

Three asks still have no typed reply after this phase, an Ambiguous Subject, a Contradiction and a
Proposed Alias, and all three are phase 10's. Meeting one during the week is expected and is not a
defect. Meeting an ask that this phase claimed to cover and finding no reply for it is.

**Blocked by:** 03 — Several Commands travel one per line, all or nothing; 04 — A Command replying to an
older Digest resolves against that Digest; 05 — The silent failures this design creates are counted;
06 — `skip N` stamps the occurrence it dealt with; 08 — `no N` against an inbox block writes
`filed:: declined`; 09 — A Proposed Heading is offered, asked about, and approved from the chat;
10 — A returning errand carries `again-of::`.

**Status:** ready-for-human

- [ ] Every automated case in the phase 5 spec passes, and each one drives either the message handler
      with the transport stubbed or the scheduled run's single entry point.
- [ ] Manual: reply `done 2` to a real Digest on the phone, and confirm the Task is under `## Done`
      within five minutes with the right date on it.
- [ ] Manual: reply to Tuesday's Digest on Thursday and confirm the right box ticks.
- [ ] Manual: turn the model API off, send `done 2`, and confirm it still works end to end.
- [ ] Manual: `skip` a real gift reminder, confirm it goes quiet for the rest of the run-up, and confirm
      it comes back at the next occurrence.
- [ ] Manual: send `pick 2 apples from market tomorrow` and confirm it is not claimed and refused. In
      this phase it is saved and echoed.
- [ ] Manual: send a two-line message with one good and one bad Command, and confirm nothing at all was
      applied.
- [ ] A week has been spent answering real Digests with typed Commands alone. Then phase 6 starts.
