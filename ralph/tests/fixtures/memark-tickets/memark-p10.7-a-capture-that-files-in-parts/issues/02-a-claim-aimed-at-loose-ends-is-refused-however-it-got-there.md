# 02 — A claim aimed at `Loose Ends` is refused however it got there

**What to build:** the refusal moves off `subject is None` and onto the destination, so
`areas/loose-ends.md` takes a Task or a date and nothing else.

Decided in
[ticket 02, may the reserved Card hold a claim](../../memark-p09.6-decisions-only-you-can-make/issues/02-may-the-reserved-card-hold-a-claim.md).
Do not re-argue it.

Two routes reach that Card and today they disagree. A claim with a null subject is refused. A claim
that names `Loose Ends` outright is not. The fix is one check in one place: refuse on where the claim
is going, not on how it got there.

The argument for keeping claims off that Card is that it is the one Card guaranteed to be a grab bag
of unrelated vocabulary, and ADR 0034, a closed Task is hidden from the model and never reopened,
records that it never shrinks. Ticket 20's amendment to ADR 0028 already had to strip closed Task
lines out of the search corpus for exactly that reason. **That strip works only because a Task
closes. A Note never closes.** Claims there would rebuild the same noise floor out of lines no strip
can ever remove.

A refused claim is not a lost claim. It stays unfiled, so the Digest asks about it up to fourteen
times per ADR 0037, an unanswered question is parked never abandoned, and then it Parks. The words
are never deleted or moved. Note that this argument only holds once issue 05 of this phase lands: in
a mixed Capture the refused claim drains today with its siblings and nothing ever asks.

The code is `memark/vault/apply.py:2083`. `CONTEXT.md`'s `Loose Ends` definition is unchanged, a
Task and a date and not a claim, and gains a sentence saying a claim aimed at it by name is refused
rather than matched.

The fourteen-Digest count is not touched here. This issue decides what the Vault keeps, not how often
the box asks.

**Blocked by:** none.

**Status:** completed

**Completed at:** 2026-09-14T13:01:09Z

- [ ] A claim naming `Loose Ends` by name is refused, with the same words a null-subject claim is
      refused with.
- [ ] The check is on the destination, so both routes agree.
- [ ] A Task aimed at `Loose Ends` is still written.
- [ ] A dated line aimed at `Loose Ends` is still written.
- [ ] `CONTEXT.md`'s `Loose Ends` entry gains the sentence about a claim aimed at it by name.
- [ ] The fourteen-Digest bound is unchanged.
