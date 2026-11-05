# 03 — A name is matched by code, never by the model

**What to build:** the shorthand you say becomes the right Card, or it becomes a question. It never
becomes a guess.

The model returns the name it read as a plain string. It never saw the Registry, per ADR 0002, which
decided deterministic code selects what the model sees. Code then matches that string against Card
names and the `aka::` aliases on Registry rows, per ADR 0026, which fixed the Card line grammar and put
aliases on the row.

Three outcomes and no fourth. One match applies. Several matches is an Ambiguous Subject, asked about
and never guessed, per ADR 0015. None is refused outright and named back in the reply, so you can see
the word it could not place.

Matching is exact, not near. A near miss is refused rather than rounded off. This is the first of the
three guards in ADR 0032, which decided intent is read by a model and applied by code: exact match or
nothing.

Keeping the Registry out of the packet is what makes the Intent Read flat in the size of the Vault. A
Vault with two thousand Cards costs the same call as a Vault with twenty.

**Blocked by:** 01 — The receipt order, and the first change end to end.

**Status:** completed

**Completed at:** 2026-09-09T21:40:43Z

- [ ] A name the model returned that matches exactly one Card name resolves to that Card and the
      change applies.
- [ ] A name that matches a row only through `aka::` resolves the same way.
- [ ] A name matching two rows raises an Ambiguous Subject, changes nothing, and names both rows.
- [ ] A name matching no row is refused, changes nothing, and appears in the reply under what could not
      be matched.
- [ ] A name that is close but not equal to a row is treated as no match.
- [ ] A test asserts the Registry never appears in the Intent Read packet.
