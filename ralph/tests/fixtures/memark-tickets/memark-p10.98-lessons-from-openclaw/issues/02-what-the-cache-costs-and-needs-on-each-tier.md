# What does prompt caching cost and need on each tier?

Type: research
Status: resolved

## Question

Ticket 04 designs a cache breakpoint for the answer call and maybe the Intent Read. It needs facts
from Anthropic's docs, for `claude-sonnet-5` and `claude-haiku-4-5`:

- The smallest prefix each model will cache.
- The price of a cache write and a cache read against a normal input token, for the 5 minute and the
  1 hour lifetime.
- Whether a cache read resets the lifetime.
- How many breakpoints one call may have, and how the automatic lookback finds an earlier prefix.
- Whether `system` as a list of blocks and a breakpoint inside `messages` both work with
  `output_config` JSON schema output. Does a change of schema break the cache?
- Which `usage` fields report a hit and a write.

Cite the doc page for each fact. Say plainly when a doc does not cover one of the two models.

## Answer

`claude-sonnet-5` caches at 1,024 tokens minimum, `claude-haiku-4-5` at 4,096. Both use the
standard price multipliers: 1.25x base input for a 5 minute cache write, 2x for a 1 hour write,
0.1x for a cache read (no cheaper rate for either model). A cache read refreshes the TTL for free
on both. A call can carry up to 4 cache_control breakpoints, and the automatic lookback walks back
at most 20 positions from a breakpoint to find an earlier cache write (a run of consecutive
tool_use or tool_result blocks counts as one position each).

`system` as a list of blocks and a breakpoint inside `messages` both work with caching, and
`output_config` JSON schema output is documented as compatible with caching in general. Changing
the schema invalidates the cache for the whole conversation thread, per the docs, on both models.
One gap: the structured-outputs model list names `claude-sonnet-5` directly but lists Haiku as the
dated snapshot `claude-haiku-4-5-20251001`, not the bare `claude-haiku-4-5` alias, so confirm that
before relying on it. `usage.cache_creation_input_tokens` reports a write, `usage.cache_read_input_tokens`
reports a hit. Full detail and quotes: [../research/02-cache-facts.md](../research/02-cache-facts.md)
