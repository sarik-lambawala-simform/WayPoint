# 01 — A Question about a named subject is answered, and still saved

**What to build:** the system stops replying "Recorded:" to a question it can answer. A message that
starts or ends with a question mark and names a subject the Registry knows comes back with a real
answer, written from that subject's Card and Captures, and the thought is still saved.

Recognition in this phase is the question-mark rule and nothing more. A message starting or ending
with `?` is a Question. The wider rule, where a question buried in the middle of a longer message is
answered and the reply quotes back the words it read as the question, needs the Intent Read and
arrives in phase 10. This is a two-step and not a stub, because it matches the build order: answering
has to work before there is a model call on every message.

A Question is also a Capture, per ADR 0018, which decided that a question is answered and then
appended to the inbox as an ordinary Capture. That is what lets recognition be loose. A false positive
costs one answer that was not needed. Losing the thought costs the thought.

The Lookup is one function, per ADR 0028, which decided that conversation finds Cards by matching
words. Give it a message and it returns the Cards and Captures to answer from. In this ticket only the
exact path exists: a named subject resolves against Registry Card names. Ranking is ticket 03 and
aliases are ticket 02.

The corpus the answer is written from is the Card as a model may see it, so closed Tasks are already
gone. Use the one function that does that, in `memark/vault/view.py`, per ADR 0034, which decided that
a closed Task is hidden from every model call and never reopened. A second implementation would drift
and the drift would be invisible.

Answering runs on the strong tier, per ADR 0003, which put judgement on `claude-sonnet-5` and filing
on `claude-haiku-4-5`. This is the one model call outside the scheduled runs, so cost now rises with
use. That is a deliberate regression against the flat-cost story, and the spec says why: a system that
holds the answer and says "got it, saved" is worse than one that never held it.

The answer is one more state of the same reply. It edits the acknowledgement rather than sending a
second message, so one message per Capture survives, per ADR 0006, which made Telegram the only
conversational surface.

Every answer ends with one short line naming what it read. Cards by name, Captures by date. Two
Captures from one day collapse into one entry. No links, because Telegram cannot open a note in the
Vault.

A message that is not a question is not answered and costs nothing. This is the assertion that keeps
the bill honest.

**Blocked by:** None. It can start immediately.

**Status:** completed

**Completed at:** 2026-09-08T18:21:10Z

- [ ] A message ending in `?` that names a Registry subject is answered from that Card and its
      Captures, and the reply is the edited acknowledgement rather than a second message.
- [ ] The same message is appended to the inbox as an ordinary Capture, dated by when it was sent.
- [ ] Exactly one answering call is made, on the strong tier.
- [ ] The call is given the Card as `memark/vault/view.py` renders it, so no closed Task reaches it.
- [ ] The answer ends with one line naming the Cards by name and the Captures by date, with two
      Captures from one day collapsed into one entry, and no links.
- [ ] A message with no question mark at either end makes no answering call and gets its ordinary
      echo.
- [ ] A message starting with `?` is recognised as well as one ending with `?`.
