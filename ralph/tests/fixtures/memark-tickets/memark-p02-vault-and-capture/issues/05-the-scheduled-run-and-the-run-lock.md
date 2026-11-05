# 05 — The scheduled run entry point and the Run Lock

**What to build:** one callable that is the whole scheduled pass, per ADR 0024. It takes a Vault path,
a model client, a clock and a transport, and those four are injected, which is what makes the single
test seam possible. In this phase the model client is accepted and never called. I can invoke the run
by hand and see it do the right thing.

The run takes an exclusive lock on the Vault for its whole duration and exits immediately if it cannot
get it, so a run I trigger by hand can never overlap a slow one still working and file the same
Capture twice. The lock file holds the pid of the run that owns it and carries a staleness check, so a
run killed ungracefully does not block the Vault forever. The lock lives outside the Vault, so it is
never committed. A refused start is counted and written to the log; the Health Canary that reports it
arrives in phase 4.

**Blocked by:** 01 — Box Settings and the day module.

**Status:** completed

**Completed at:** 2026-08-30T22:27:11Z

- [ ] The run is one callable taking a Vault path, a model client, a clock and a transport, and every
      test in this phase and later drives it through that seam.
- [ ] The model client is accepted and never called in this phase, and a test asserts no model call.
- [ ] A run takes an exclusive lock for its whole duration and releases it on both the success and the
      failure path.
- [ ] A second run started while the lock is held exits at once, writing and committing nothing.
- [ ] The lock file holds the owning pid and lives outside the Vault, so `git status` never sees it.
- [ ] A run finding a stale lock file whose pid is not running takes the lock and proceeds.
- [ ] A refused start is counted and logged, with enough detail to tell it apart from a crash.
- [ ] Runs are idempotent: running twice over the same state does not double-file a Capture.
