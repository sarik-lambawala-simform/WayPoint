# 02 — An alias resolves, and an ambiguous name is asked about

**What to build:** the name I actually use finds the Card, and a name that fits two Cards gets a
question rather than a guess.

The exact resolve in ticket 01 matched Card names only. It also has to match the `aka::` aliases a
Registry row carries, because the name on the Card is the formal one and the name in my message is
whatever I say out loud. A Card filed as `Priya Sharma` with `aka:: Priya's mum` has to be found by
either.

Where a name fits more than one row, the bot asks. It never picks. That is ADR 0015, which decided
that an ambiguous subject is asked about and never guessed. The Registry already has the near-match
helper for this in `memark/vault/registry.py`, so this is wiring rather than invention.

Both promises die under a top-k over named subjects, which is the reason the Lookup resolves exactly
instead of ranking names. Ranking would return the best of two Priyas and never mention the second.

A misheard name belongs to the same family. Where a name matches nothing exactly but is close to a row,
the bot may say what it thinks I meant and ask, rather than answering about the near match.

**Blocked by:** 01 — A Question about a named subject is answered, and still saved.

**Status:** completed

**Completed at:** 2026-09-08T18:40:02Z

- [ ] A Question naming a subject reachable only through an `aka::` alias resolves to that Card and is
      answered from it.
- [ ] A name that matches two Registry rows exactly makes the reply ask which one, and makes no
      answering call.
- [ ] The Capture is still appended in the ambiguous case, so asking never costs the thought.
- [ ] A name close to one row but matching none exactly makes the reply name what it thinks was meant
      and ask, rather than answering about the near match.
