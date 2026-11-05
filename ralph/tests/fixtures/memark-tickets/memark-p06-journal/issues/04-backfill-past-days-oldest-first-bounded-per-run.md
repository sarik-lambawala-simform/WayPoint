# 04 — Backfill: past days without an entry, oldest first

**What to build:** a gap in the journal closes itself. Every run writes the entries the past is missing,
oldest first, a bounded number of them, and never touches an entry that already exists.

Backfill needs no permission and no marking. An entry that exists is never regenerated, per ADR 0027,
but an absent entry may be written late, and writing a missing day is generation rather than
regeneration. Oldest first, so the outstanding count falls monotonically and a reader of the Canary sees
progress rather than a number that wanders. Bounded at seven days a run and configurable, so no single
run holds the Vault lock for long. The bound is a number one box tunes, so it is a config setting rather
than a Vault Setting, per ADR 0031, which put a number nothing else shares in the file the box owns.

A backfilled entry carries no mark saying it was late. The inbox file it reads is permanent and
append-only, so a day journaled three weeks on is generated from byte-identical input to one journaled
at midnight, and a mark would record something about the box rather than about the day.

An entry that exists costs nothing. No later run reads it, regenerates it, or calls the model about its
day.

**Blocked by:** 03 — The pairing rule: no inbox file, no entry, no call.

**Status:** completed

**Completed at:** 2026-09-07T22:28:09Z

- [ ] Three past days with inbox files and no entries: all three are written, oldest first, and the
      outstanding count falls with each one.
- [ ] A backlog longer than the per-run bound: exactly the bound is written this run, oldest first, and
      the rest are left for later runs.
- [ ] The bound is a config setting with a default of seven, and a box that sets it to another number
      writes that many.
- [ ] A backfilled entry is indistinguishable from one written at midnight. It carries no mark and no
      field.
- [ ] A day that already has an entry: no later run regenerates it and no model call is made for that
      day.
