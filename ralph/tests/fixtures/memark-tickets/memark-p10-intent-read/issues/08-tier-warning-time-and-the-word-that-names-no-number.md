# 08 — Tier, warning time, and the word that names no number

**What to build:** your dentist stops being treated like your wife. You set how much a date matters and
how much warning it needs in the same sentence that confirms it.

A tier lives on the Card and a date line inherits it, per ADR 0038. A Notice Schedule says how many days
of warning the date gets. Both are set on the message that confirms the date, so fixing the system's
nearly-right guess is one message rather than a trip to Obsidian.

Editing a tier and editing a Notice Schedule both happen without asking, per ADR 0032's one test: the
reply names them and `undo` reverses them.

A word that names no number is refused. "Remind me early" sets no Notice Schedule and "make it
important" sets no tier. The default applies, the reply states the resulting days as a number, and the
phrase appears in the list of what could not be matched. A closed vocabulary of vague words was designed
and rejected: it is a second grammar to remember inside a system whose reason for existing is that you
should not have to remember one.

The tier must be a valid tier and the Notice Schedule must parse. A near miss is refused rather than
rounded off.

The reply must not imply the Digest now orders itself by tier. Ordering by tier is out of scope for v1.

**Blocked by:** 07 — A date you stated is not a date it inferred.

**Status:** completed

**Completed at:** 2026-09-09T23:23:05Z

- [ ] A confirming message that names a tier and a warning time sets both on the date line, with no
      confirmation tap.
- [ ] A phrase naming no number sets no tier, the default is stated in the reply as a number of days,
      and the phrase appears under what could not be matched.
- [ ] An invalid tier or an unparsable Notice Schedule is refused and named, and nothing else in the
      message is dropped because of it.
- [ ] `undo` reverses a tier or Notice Schedule change.
- [ ] The reply says nothing that implies the Digest is now ordered by tier.
