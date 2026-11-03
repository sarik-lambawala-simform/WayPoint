# What does the Anthropic SDK wait on a slow or throttled call?

Type: research
Status: resolved

## Question

`memark/box.py:42` builds `anthropic.Anthropic(api_key=...)` with no `timeout` and no
`max_retries`. `memark/model.py` says the SDK retries 429 and 5xx twice. `bot.py` runs every
message in one process, so the longest wait on one call is how long every later message waits.

Find, from the SDK source for the version this repo pins:

- The default `timeout`, and what it covers: connect, read, or the whole call.
- The default `max_retries`, and which status codes it retries.
- How it reads `retry-after` and `retry-after-ms`. Is there a ceiling above which it ignores the
  header? What backoff does it use without one?
- The worst-case total wait for one `messages.create` call with the defaults.
- Whether the answer call's size (near 150,000 tokens, per ADR 0043) changes the default timeout or
  makes the SDK ask for streaming.
- How to set each one per client and per call.

Cite the SDK file and line for each fact.

## Answer

Full findings, with SDK file and line for every fact: [../research/01-sdk-waits.md](../research/01-sdk-waits.md).

The pinned version (`anthropic==1.2.0`) matches the installed one in `.venv`, so there is no
version drift.

No, the defaults do not bound one call to a few seconds. The timeout splits into phases: connect
is 5 seconds, but read, write, and pool are each 600 seconds. One attempt can hang for up to
600 seconds before the SDK gives up.

Worst-case total wait for one `messages.create` call, with all defaults and memark's
`MAX_TOKENS = 16000`: about 1816 seconds, roughly 30 minutes. That is 3 attempts (1 plus
`DEFAULT_MAX_RETRIES = 2`), each exhausting the 600-second read timeout, plus two short backoff
waits (capped near 8 seconds, since a timeout carries no response and so no `retry-after` header
to read). Fast 429/5xx responses with a `retry-after` header near its 60-second ceiling cost
less, about 120 seconds, so the timeout case is the real worst case.

The SDK retries more than memark/model.py's comment says: not just 429 and 5xx, but also 408 and
409, plus connection failures and timeouts with no HTTP response at all.

The ~150,000-token answer size from ADR 0043 changes nothing here. The SDK's timeout and its
streaming-required check both key off `max_tokens`, the requested output length, never input
size. With `MAX_TOKENS = 16000`, streaming is never forced and the timeout stays at 600 seconds
no matter how big the Vault prompt gets.
