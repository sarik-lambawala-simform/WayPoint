# 01 — Yesterday is written up as prose, and nothing is sent

**What to build:** a day you lived through is a day you can read back. The first run after midnight
composes yesterday from that day's inbox file and writes it into `journal/YYYY/MM/`, and your phone
stays quiet about it.

Generation is the last step of the run, per ADR 0027, which made the journal written and never read.
It cannot share the Digest's call, because the Digest is composed during today for today and the day
it would journal has not closed. Running last is also the failure story: a composition that falls over
leaves a run that filed and committed correctly and simply has no file for yesterday. The day stays
open, nothing is sent, and the run's own exit code is unchanged.

It reads the day's inbox file and nothing else, not even the Cards that day fed. A journal that reads
Cards is a worse Card rather than a better journal, and reading them would cost both the flat price and
the independence from filing that lets an entry be written whether or not the day drained. Composition
runs on the strong tier, one call per day written, per ADR 0003, which put judgement on
`claude-sonnet-5` and filing on `claude-haiku-4-5`.

The shape is prose and nothing else: no frontmatter, no `schema: 1`, no Line Marks, no Line Fields, no
block ids. ADR 0026's grammar governs Cards and Date Files, and `journal/` is outside it. Nothing in
the system ever reads an entry back, so there is no parser here to satisfy and none to write. The
folder and the path already exist in the layout, so nothing new is invented about where a file goes.

Nothing is sent. The one message a day is the Digest, and a feature that produces something every day
must not become a second notifier.

**Blocked by:** None. It can start immediately.

**Status:** completed

- [ ] A fixture Vault with an inbox file for yesterday and no entry: the first run after midnight
      writes exactly one Journal Entry, at the dated journal path for yesterday.
- [ ] The entry is prose. It carries no frontmatter, no fields, no marks and no block ids.
- [ ] Exactly one model call is made for the day written, on the strong tier.
- [ ] The call is given the day's inbox file and nothing else. No Card and no Registry row is read for
      it.
- [ ] The recording transport received nothing because of the journal.
- [ ] A composition that raises leaves the run's filing and Digest work committed, writes no entry, and
      leaves the day open.
- [ ] The journal step runs after the Digest, so a Digest hour in the evening and a journal after
      midnight never compete for the one run and the one lock.
