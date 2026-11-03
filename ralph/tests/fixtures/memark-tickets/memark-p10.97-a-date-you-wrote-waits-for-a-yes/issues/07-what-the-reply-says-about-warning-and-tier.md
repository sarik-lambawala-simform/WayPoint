# What does the reply say about a typed date's warning and tier?

Type: grilling
Status: resolved

## Question

Ticket 01 decided that a typed date is confirmed at once, and the reply names the day:
`✅ Loose Ends: order hand blender, on 08 Oct 2026`. See
[Where does the typed-date test run on a new Capture?](01-where-does-the-typed-date-test-run.md).

The confirmed line also gets a Notice Schedule and a tier. The `yes 5` path wrote `notice:: 5d..0d`.
The reply says nothing about either.

Settle:

- Whether the reply names the first reminder, for example `First reminder 5 days before.`
- Whether the reply names the tier.
- Whether a person can set either in the same message, like `remind me 2 days before`, on the
  filing path. The Intent Read already reads both out of a sentence (`_a_stated_notice` and
  `_a_stated_tier` in `memark/intent.py`). Filing does not.

## Answer

Settled in a grilling session on 2026-09-29. No new ADR: each answer follows a rule the box already
has on the `yes N` path, and the filing path now does the same.

**The reply names the first reminder.** It uses the words the `yes N` reply already uses,
`WILL_CONFIRM_ON` and `_when` in `memark/commands.py`:
`✅ Loose Ends: order hand blender, on 08 Oct 2026. First reminder 1 day before.` The number comes
from the schedule the line ends up with, so it is the Vault's `default-notice` when the person said
nothing.

**The reply names the tier only when the message set one**, as `Tier 1.`, the `AT_TIER` wording. A
default tier is not named, because v1 does nothing with a tier yet. See ADR 0038 (a tier lives on the
Card and a date line inherits it).

**Filing reads a stated warning and tier.** The filing model's dated edit gains two fields. Each holds
the person's own words, or null. Code turns them into a schedule and a tier with `_a_stated_notice`
and `_a_stated_tier`, the same two functions the Intent Read uses, so the two paths cannot read the
same words two ways. A phrase code cannot use gets the same line as the Intent Read:
`I have set no notice from that, so the usual one applies: ...` or `I have set no tier from that: ...`.
The date still lands. The other option, use the default and let the person send a second message,
was ruled out: it drops words the person typed and says nothing, which ADR 0032 (intent is read by a
model and applied by code) forbids.

**A Proposed Date says nothing about warning or tier in the reply.** Nothing was confirmed, so no
schedule is in force to name. This matches `memark/intent.py:1313`. The stated warning and tier are
kept on the `?` line, and a later `yes N` applies them. `a_confirmation_on` already keeps a line's own
`notice::` when the confirming message names none.

**`undo` takes back all of it.** The warning and tier land in the same run commit as the day.
