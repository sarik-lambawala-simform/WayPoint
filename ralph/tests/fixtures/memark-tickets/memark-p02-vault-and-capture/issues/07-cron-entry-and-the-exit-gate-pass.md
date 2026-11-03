# 07 — The cron entry and the exit-gate pass

**What to build:** the system runs unattended on the real box. cron invokes the run every five minutes
and the bot process stays up long-polling, so a thought typed into Telegram is quoted back within a
second and is in a git commit within five minutes, with nobody watching.

Then the manual pass from the spec is done by hand, because these are the joins no automated test can
prove: Telegram, git and cron all running at once on real hardware.

**Blocked by:** 03 — The real Telegram transport and the long-polling bot; 04 — Send Time dating and
the day named in the acknowledgement; 06 — The run ends in one git commit.

**Status:** ready-for-human

- [ ] A cron entry invokes the run every five minutes on the real box, and the bot process runs
      alongside it.
- [ ] Send a real message from the phone. The reply arrives in under a second and quotes it exactly,
      emoji and punctuation included.
- [ ] Send a message with the box's network off, bring it back, and confirm the Capture lands.
- [ ] Send a message just before midnight in the configured timezone and confirm it lands on the right
      day.
- [ ] Run `git log` after a day of use and read it as a diary. The paths in each message match the
      diff.
- [ ] Clone the Vault onto a second machine and open it in Obsidian.
- [ ] Start two runs at once by hand and confirm the second exits without touching anything.
- [ ] Kill a run with SIGKILL mid-write, run again, and confirm nothing is corrupted.
- [ ] The box has run unattended for at least a day with real Captures arriving and a clean `git log`
      to show for it. That is the exit gate, and phase 3 starts after it.
