# Where does the answer prompt's cache breakpoint go?

Type: grilling
Status: open
Blocked by: 02, 03

## Question

The person chose to build the cache, not only to correct ADR 0051. The shape from the research is:
the Vault first, then the breakpoint, then the Recent Exchange and the question.

`docs/stack/anthropic-api.md` says no breakpoint goes on this call until the prompt is ordered
stable first, because Cards get edited in the middle. Ticket 03 measures what is shared today.
Ticket 02 gives the prices and the smallest cacheable prefix.

Settle:

- What goes above the breakpoint. The whole Vault in a fixed order, so every question shares it? Or
  only what the question found, as today? ADR 0043 (the model reads the whole Vault) bears on this.
- The order of Cards above the breakpoint, so one edited Card breaks as little as possible.
- Where the Recent Exchange and the question go.
- The 5 minute or the 1 hour lifetime, from the prices in ticket 02 and how far apart follow-ups
  come.
- Whether the Intent Read gets a breakpoint too. It runs on Haiku, which has a larger smallest
  prefix.
- How `ask` in `memark/model.py` takes the breakpoint. Today it takes one `system` string and one
  `prompt` string.
- How a hit is proved. `usage.cache_read_input_tokens` is logged already. Does it go on the Health
  Canary?
- The new text for the sentence in ADR 0051: "Turns seconds apart hit the prompt cache." Record the
  change as an amendment, per `docs/agents/domain.md`.
