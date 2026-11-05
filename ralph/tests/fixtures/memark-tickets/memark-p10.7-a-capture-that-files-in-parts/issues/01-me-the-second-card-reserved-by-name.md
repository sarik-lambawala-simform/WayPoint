# 01 — `Me`, the second Card reserved by name

**What to build:** a Card at `people/me.md` that holds what is true of the person sending the
Captures, reached by the Intent Read emitting the literal `Me`.

Decided in
[ticket 05, a Card for the person themselves](../../memark-p09.6-decisions-only-you-can-make/issues/05-a-card-for-the-person-themselves.md).
Do not re-argue it. Parts 1, 2, 3 and 5 of that answer are this issue.

It is an ordinary Card. `subject: Me`, `kind: person`, `status: live`, `schema: 1`, one Registry row
like any other row. No new kind and no new Card mechanism, because `Loose Ends` already set the
pattern: a reserved name on an ordinary kind, where the only special thing is that the name is taken
and code knows it.

The name is `Me` and never the person's legal name. ADR 0026, a Card line has a fixed grammar, made
the Registry carry the names a person says out loud, and `Me` is the word they say. The CLI mode's
guess off the machine login is dropped rather than fixed.

The `aka::` list is empty and stays empty, and that is the load-bearing part. `aka:: i, me, my` would
resolve this Card out of nearly every message, because `me` is one of the commonest words in English,
and `remind me about the plumber` is not about the person. Instead the Intent Read may emit the
literal `Me` as a subject and code resolves it against the reserved row on the exact path in
`memark/lookup.py`, the same path `my wife` takes to the `Wife` row. Per ADR 0032, intent is read by
a model and applied by code. So the reading decides, not the letters.

The same literal serves filing. A claim about the person writes `subject: "Me"`, so ticket 02's
refusal of `subject: null` is untouched: homeless still means homeless, and `Me` is a destination
like any other.

It is one Card and not several. It splits by heading, using the `person` heading list already in
`settings.md`, and it may gain a Proposed Heading later the way any Card may. `Me (work)` beside
`Me (health)` was refused because it needs a rule saying which one a claim lands on, and that rule is
an Ambiguous Subject built by hand, which ADR 0015 exists to stop.

It is in the Lookup corpus on both paths: reached exactly when the Intent Read emits `Me`, and ranked
over its body like any Card. Ticket 20's strip of closed Task lines applies to it exactly as it does
to every other person Card, so ADR 0034 needs no amendment for this.

`CONTEXT.md` gains the term **Me**. Ticket 05 holds the exact wording to use, next to `Loose Ends`
and following the same pattern. The `Loose Ends` entry gains one sentence pointing at it, so a reader
can tell "belongs to no subject" from "belongs to the person".

**Blocked by:** none.

**Status:** completed

**Completed at:** 2026-09-14T12:38:23Z

- [ ] `people/me.md` is created on first write with `subject: Me`, `kind: person`, `status: live`,
      `schema: 1`, and reused if it is already there.
- [ ] `Me` is a reserved name beside `Loose Ends` and code knows it.
- [ ] The Registry row for `Me` carries no aliases, and nothing writes one.
- [ ] The Intent Read may emit the literal `Me` as a subject, and code resolves it on the exact path.
- [ ] A claim about the person naming nobody else writes `subject: "Me"` and lands on the Card.
- [ ] `remind me about the plumber` does not resolve to `Me`.
- [ ] A message naming both the person and somebody else reaches both Cards exactly.
- [ ] The Card splits by the `person` heading list in `settings.md`.
- [ ] The CLI mode no longer guesses a name off the machine login.
- [ ] `CONTEXT.md` carries the **Me** entry with ticket 05's wording, and `Loose Ends` points at it.
