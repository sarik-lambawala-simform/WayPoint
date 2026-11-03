# 01 — Box Settings and the day module

**What to build:** the box reads its Settings from the environment and refuses to start when one is
missing or unreadable, naming the variable in the message. The Settings are the Telegram token, the
timezone, the date display format, the time display format, the run interval defaulting to five
minutes, and the Vault path. Nothing falls back to a default and nothing secret is ever written into
the Vault.

Alongside it, one small time module owns every question of the form "what day is it". Timestamps are
stored in UTC and every day question converts to the configured timezone first and compares calendar
dates only, per ADR 0022. Nothing in the system subtracts one timestamp from another. Storage is ISO
8601 and display is a Setting, and no function mixes the two.

**Blocked by:** None — can start immediately.

**Status:** completed

**Completed at:** 2026-08-30T21:45:34Z

- [ ] Every Setting is read once at start through one module and passed down. No other module reads
      the environment.
- [ ] A missing or unparseable Setting stops the box from starting, and the error names the variable.
- [ ] The run interval defaults to five minutes and every other Setting is required.
- [ ] The day module answers "which calendar day is this instant" in the configured timezone, and a
      test with a UTC instant either side of local midnight lands on the day a person would name.
- [ ] The day module formats a date and a time for display using the configured formats, separately
      from the ISO form it stores.
- [ ] No test and no module compares two timestamps by subtraction to decide a day.
