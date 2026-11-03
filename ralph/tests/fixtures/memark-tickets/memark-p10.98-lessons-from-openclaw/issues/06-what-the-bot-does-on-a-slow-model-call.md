# What does the bot do when a model call is slow or throttled?

Type: grilling
Status: open
Blocked by: 01

## Question

Ticket 01 gives the SDK's real defaults and the worst-case wait for one call. `bot.py` handles
messages one at a time, so that wait is also how long every later message waits.

If ticket 01 shows the defaults already bound the wait to a few seconds, close this ticket as out of
scope and say why in the map.

Otherwise settle:

- The `timeout` and `max_retries` the bot's client gets. Does `run.py` get the same, or its own?
  `run.py` runs from cron under the Run Lock, so its wait holds up nothing else.
- Whether a long `retry-after` from the API makes the call fail at once, the way OpenClaw does over
  60 s. The stack doc forbids a second retry loop, so this may only lower `max_retries` or the
  timeout.
- What the person sees when the call gives up. `ModelFailed` already exists. Name the reply it
  leads to today.
- Where the numbers live, per ADR 0031 (settings have three homes).
