# 06 — The run ends in one git commit

**What to build:** after a day of use I can read `git log` as a diary. Each run pulls before writing,
stages everything it changed, commits exactly once, and pushes, per ADR 0004. That is the whole sync
design and there is no conflict resolution beyond pull-before-write, so the Vault reaches my laptop and
my phone as an ordinary clone.

The commit message summarises the run: how many Captures were drained, and the exact list of changed
paths. The path list lives in the commit message alone and never in the Health Canary, because a path
list has no bounded length. A bad run is then one `git revert` away.

A run with nothing outstanding makes no commit and no model call. An idle day leaves no trace.

Git is also the recovery mechanism. A run interrupted mid-write leaves an uncommitted worktree, and the
next run discards it before doing anything else. There is no write journal on top of that. A failed
push leaves the commit standing locally and is reported rather than swallowed.

**Blocked by:** 05 — The scheduled run entry point and the Run Lock; 02 — A text Capture lands in
today's inbox and is quoted back.

**Status:** completed

**Completed at:** 2026-08-30T22:39:13Z

- [ ] A run over a Vault with appended Captures makes exactly one commit, and its message names the
      Capture count and the exact changed paths.
- [ ] A run with nothing outstanding makes no commit and no model call.
- [ ] A run pulls before writing and pushes after committing.
- [ ] A run over a dirty worktree left by an interrupted run discards the uncommitted changes and the
      Captures that were committed earlier are still there.
- [ ] A failed push leaves the commit standing locally, and the failure is reported and logged rather
      than swallowed.
- [ ] A run over an empty Vault completes and creates nothing.
- [ ] Git is driven with explicit arguments through `subprocess`, and no token, audio file or `.env`
      content is ever staged.
- [ ] Fixtures exist for the three starting states this phase needs: the seeded baseline Vault, an
      empty Vault, and a Vault whose worktree is dirty. Each test copies its fixture to a temp
      directory, initialises git, runs, asserts and deletes it.
