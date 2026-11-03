# How long does the bot wait when Telegram says 429?

Type: grilling
Status: open

## Question

Telegram's 429 body carries `parameters.retry_after`, in seconds. `failure_for` in
`memark/transport/telegram.py:118` turns a 429 into a `TelegramError` with the number only in the
message text. `run_forever` in `memark/bot.py:151` sleeps a flat `BACKOFF_SECONDS = 5.0` after any
failed pass. So a throttled bot asks again too soon and gets throttled again.

Settle:

- Where the number lives. A field on `TelegramError`, or a new error class for a throttle?
- Who waits. `run_forever` after the pass fails, or the transport inside the call?
- What happens to a pass that was part done. A 429 on `sendMessage` after the Capture is in the
  inbox fails the pass, so the offset is not moved. Does the message then get written twice? Read
  `poll_once` and the offset rule in `docs/stack/telegram.md` before answering.
- A ceiling. What if Telegram asks for 3,600 s? Per ADR 0031 (settings have three homes), a ceiling
  is a setting in one home or a fixed number with a reason.
- What the log line says, so a long wait is not read as a dead bot.
