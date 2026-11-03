# 05 — Many intents in one message

**What to build:** one message that closes a Task, corrects a date, asks something and leaves a thought
behind is acted on in full. That is the ordinary way you talk, and the system stops hearing one quarter
of it.

The unit of applying is the change. Each proposed change is checked on its own against something that
exists, and one refusal does not drop the others. The ones that resolved are written as Pending
Instructions and the ones that did not are named back.

The whole raw message is still saved first, unchanged, as one block. The message is never cut into
pieces and filed separately, which ADR 0032 considered and rejected: cutting invents failure modes that
did not exist, such as a fragment filed without the sentence that gave it meaning.

The reply names every change in plain words, in the order the message raised them, and ends with what
it could not use. Nothing happens silently. That is the second of ADR 0032's three guards, and it is
where a wrong read becomes visible.

**Blocked by:** 01 — The receipt order, and the first change end to end.

**Status:** completed

**Completed at:** 2026-09-09T22:12:16Z

- [ ] A message carrying several intents at once has the raw text on disk whole before any change is
      proposed.
- [ ] Every change that resolved is written, and the reply names each one.
- [ ] A message where one change is refused and the others resolve applies the rest and names the
      refusal.
- [ ] The refusal names the words it could not match rather than only saying that something failed.
- [ ] The message lands on the inbox as one block, never split.
