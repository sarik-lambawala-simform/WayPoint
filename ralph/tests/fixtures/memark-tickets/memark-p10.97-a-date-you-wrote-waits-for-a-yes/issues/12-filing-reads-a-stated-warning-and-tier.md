# 12. Filing reads a stated warning and tier

**Type:** task

**Status:** completed

**Completed at:** 2026-10-01T02:59:25Z

**Blocked by:** 11

**What to build:** `Remind me to renew passport on 15th november, remind me 2 days before` sets the
warning on the filing path, and the reply names it.

Spec: [../spec.md](../spec.md), "A stated warning and tier". Decided in
[What does the reply say about a typed date's warning and tier?](07-what-the-reply-says-about-warning-and-tier.md).
No new ADR.

## What happens today

The filing edit schema in `memark/distillation.py` has `date` and nothing for a warning or tier. The
Intent Read reads both with `_a_stated_notice` and `_a_stated_tier` in `memark/intent.py`.

## What to change

- The dated filing edit gains `notice` and `tier`. Each holds the person's own words, or null. The
  filing instructions say so.
- `_a_stated_notice` and `_a_stated_tier` become shared, so filing and the Intent Read call one copy.
- On a confirmed date, a stated warning or tier is written onto the line. The reply's
  `First reminder N days before.` reads the schedule the line ended up with. ` Tier N.` follows only
  when the message set a tier, in the `AT_TIER` wording.
- A phrase code cannot use adds the Intent Read's line:
  `I have set no notice from that, so the usual one applies: ...` or `I have set no tier from that: ...`.
  The date still lands.
- On a Proposed Date, a stated warning and tier go on the `?` line as `notice::` and `tier::`. A
  later `yes N` keeps them when the confirming message names none. `a_confirmation_on` does this for
  `notice::` today. Check it does the same for `tier::`, and make it so if not.

## Done when

- [ ] A stated warning sets `notice::` and the reply's first reminder matches it.
- [ ] A stated tier sets `tier::` and the reply names it. A default tier is not named.
- [ ] An unusable phrase gets the Intent Read's line, and the date lands.
- [ ] A Proposed Date keeps both on its `?` line, and `yes N` applies them.
- [ ] The unit suite is green.
