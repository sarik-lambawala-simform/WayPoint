# 13 — `alias <row> <word>`

**What to build:** you say once that the bare name "Priya" is your cousin's, and the same question stops
being asked every time you mention her. The system asks before it records it and names both sides back
to you.

`alias <row> <word>` takes the Registry row first and the word you actually say second. It raises a
Proposed Alias and writes nothing on its own. `propose-alias` is one of the two codes ADR 0026's
amendment added to the closed `pending::` list. The alias itself lives in `aka::` on the Registry row.

It asks, and that is not a judgement call. A written alias changes nothing you can see. It changes where
the next thought lands weeks later, which is the exact shape of a change you would never notice had
happened, so ADR 0032's one test sends it to a confirmation. The reply and the Digest item spell out
both sides in full.

An alias that would then match a second row is refused outright, because it would build an Ambiguous
Subject on purpose. Code checks the whole Registry for a collision before proposing, and names the
clashing row.

Only your own words become aliases. The Filing Run never proposes one, and the Intent Read only raises
one when the message is about naming. A Capture that merely uses a shorthand is a Capture. The Registry
ships whole on every filing call, so a row's aliases cost tokens forever. The confirmation therefore
does two jobs: it stops an invisible write, and it is the moment that cost is visible.

`no N` on a Proposed Alias records the rejection so the same one is not offered twice. Recording a
permanent rejection asks first, by the same test.

`unalias` was designed and cut. Deleting the word from `aka::` is one hand edit in Obsidian.

**Blocked by:** 03 — A name is matched by code, never by the model.

**Status:** completed

**Completed at:** 2026-09-10T01:56:49Z

- [ ] `alias sharma priya` raises a Proposed Alias, names both sides in full, and writes nothing to a
      Registry row.
- [ ] `yes N` writes the alias into `aka::` on the named row.
- [ ] A word that would then match a second row is refused outright and the clashing row is named.
- [ ] A row name matching nothing, or two rows, changes nothing and the reply says so.
- [ ] A Capture that merely uses a shorthand proposes no alias.
- [ ] The Filing Run proposes no alias.
- [ ] `no N` records the rejection and the same alias is not offered again.
