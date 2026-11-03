# 07 — The returning-errand link goes Vault-wide and carries a filename

**What to build:** the shape change under `again-of::`, so the link can point at a closed Task on any
Card.

Decided in
[ticket 04, is the returning-errand link worth what it claims](../../memark-p09.6-decisions-only-you-can-make/issues/04-is-the-returning-errand-link-worth-what-it-claims.md).
Do not re-argue it.

ADR 0034, a closed Task is hidden from the model and never reopened, matches against the closed lines
of the same Card and nowhere else, and `links_within` at `memark/vault/apply.py:563` writes
`[[#^a0f1]]` with no file part because of it.

Same-Card was kept only because reading one Card was cheap and reading all of them was not. Issue 08
removes that, because `memark/tasks.py:129` already opens every Card for the Digest. So the reason is
gone, and what is left is a rule that misses the ordinary case by construction: an errand about a
person lands in `areas/loose-ends.md` the first time, because no Card for that person exists yet, and
in `people/<name>.md` the second time once one does. Same errand, two files, and the old rule cannot
see it.

The cost is named rather than waved at. `links_within` goes and the link carries a filename like
every other link. `LINK_KEYS` at `memark/vault/lint.py:42` widens to check the wider shape.
`memark/vault/lint.py:181` already walks every file in the Vault, so the linter pays nothing new.

**ADR 0034 is amended twice.** The match is no longer the whole string, and it is no longer the same
Card. Its own sentence, that the match is the whole string or nothing so a reworded errand comes out
as an unlinked new Task rather than as a guess, is the thing being reversed, and the reversal is
that a guess from a model shown the candidates is not the guess that sentence refused. What it
refused was code guessing from letters.

**ADR 0043 is untouched.** This is a separate call with its own bounded index. It puts no closed line
into the answering prompt, and ADR 0034's amendment for ADR 0043 keeps the strip.

This issue is the shape only. The call that fills the field is issue 08.

**Blocked by:** none.

**Status:** completed

**Completed at:** 2026-09-14T14:28:58Z

- [ ] `links_within` at `memark/vault/apply.py:563` is removed.
- [ ] `again-of::` carries a filename and an anchor, like every other link.
- [ ] `LINK_KEYS` at `memark/vault/lint.py:42` accepts the wider shape.
- [ ] The linter still refuses a link to a file that is not there.
- [ ] ADR 0034 is amended twice, on the whole-string match and on the same-Card match, with the
      reasoning above.
- [ ] ADR 0026's grammar entry for `again-of::` follows the wider shape.
- [ ] Existing `again-of::` values in fixtures are migrated or the fixtures are regenerated.
