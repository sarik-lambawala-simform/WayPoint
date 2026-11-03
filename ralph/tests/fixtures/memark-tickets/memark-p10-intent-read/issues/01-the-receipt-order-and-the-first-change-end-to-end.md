# 01 — The receipt order, and the first change end to end

**What to build:** the front door starts understanding you. A message that is not a typed Command no
longer only gets saved and echoed. It is read once by a model, turned into a set of changes, checked by
code, written as Pending Instructions, and named back in the reply.

The order is fixed and nothing may be reordered later for speed. The strict Command check first, per
ADR 0041, which decided a typed Command is a Command only if every part of it resolves, so the cheap
exact path is never overtaken by the expensive loose one. Then the raw message is appended to the inbox
whole and unchanged, always. Then the Intent Read. Then code checks every proposed change one at a
time. Then the checked changes are written as Pending Instructions. Then one reply.

Saving never depends on understanding. Reading for intent only ever adds actions, so a model call that
fails, times out or returns nonsense leaves a message that was saved and echoed exactly as before. That
is the half of the safety story that stays absolute.

The model returns the same structure filing already returns, per ADR 0014, which decided the model
proposes edits and code applies them. It never writes and it never chooses what it reads. The packet
holds the change grammar, the items of the Digest the message replied to, and the Thread so far. It
does not hold the Registry, per ADR 0002 as amended by this phase, which decided deterministic code
selects what the model sees. That is what keeps the call flat in the size of the Vault. The list of
things the model may ask for is closed and there is no general search entry.

This ticket carries one change kind end to end, the kind with an exact key: an action on a numbered
Digest item, resolved the way ADR 0021 already resolves one, which decided code assigns the Digest's
numbers. Speaking a number that is not in the footer is refused and named rather than rounded off to a
nearby one. The other change kinds arrive in the tickets after this.

The reply names every change in plain words. It spells out the full Card name and the exact date rather
than echoing your shorthand, because that is where a wrong read becomes visible. Anything the message
carried that could not be matched is named too.

The model id for each tier is a Box Setting, per ADR 0031, which decided settings have three homes.
Moving the Intent Read to the strong tier is then a settings change and a restart, not a code change.

The bot still writes the inbox and never a Card, per ADR 0035.

**Blocked by:** None. It can start immediately.

**Status:** completed

**Completed at:** 2026-09-09T21:02:33Z

- [ ] The strict Command check runs before the message is saved and before any model call, and a fully
      resolving Command still costs no Intent Read.
- [ ] The raw message is appended to the inbox whole and unchanged before the Intent Read runs, and a
      test asserts the file holds it even when the model call then raises.
- [ ] Exactly one Intent Read call is made per message that is not a Command.
- [ ] The packet holds the change grammar, the replied-to Digest's items and the Thread so far, and a
      test asserts no Registry content reaches it.
- [ ] A change naming a real Digest item number is written as a Pending Instruction and named in the
      reply, with the full Card name and the exact date spelled out.
- [ ] A change naming an item number the footer does not have changes nothing and is named as refused.
- [ ] A model call that fails leaves the message saved and echoed, with no change proposed.
- [ ] The tier the Intent Read runs on is read from a Box Setting.
