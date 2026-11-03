# 07 — A rule that fires on no day, and `reads::` as the thing you check

**What to build:** two guards against a rule that would never fire, and a plain-English reading of every
rule that exists to be checked rather than trusted.

Before a line is written, code expands its rule across the next 366 days and refuses it if the set is
empty, naming in the reply what it could not use. That catches the rule the system writes. The Health
Canary counts any rule in the Vault that will never fire, which catches the one hand-edited in. A rule
that never fires is not an error the run dies on: the run completes and the count is how you learn.

`COUNT` is accepted in speech and stored as `UNTIL`. Code works out the last occurrence once, at write
time, and writes that date, so a spent line never reads as alive and nothing has to count occurrences at
read time.

`reads::` is the rule in plain English. The rule is authoritative and firing never looks at `reads::`.
The system rewrites the reading whenever it writes the line, and the linter fails a reading that does
not match its rule. That check is the one deferred from phase 1, and it is what makes a misread interval
cost one glance instead of every reminder it would have produced.

**Blocked by:** 06 — Recurrence: a rule on the line, matched against a day.

**Status:** completed

**Completed at:** 2026-09-02T07:24:26Z

- [ ] A write whose rule expands to no day inside the next 366 is refused, and the reply says what it
      could not use.
- [ ] The same line hand-edited into the file: the run still completes, and the Canary reports it.
- [ ] A `repeat::` carrying `COUNT` is stored with an `UNTIL` date instead, worked out once at write
      time.
- [ ] `reads::` is rewritten whenever the system writes the line.
- [ ] A `reads::` text that does not match its `repeat::` rule fails the linter with the file and line.
- [ ] Firing reads the rule and never `reads::`, asserted by a line whose reading is wrong still firing
      on the days its rule names.
