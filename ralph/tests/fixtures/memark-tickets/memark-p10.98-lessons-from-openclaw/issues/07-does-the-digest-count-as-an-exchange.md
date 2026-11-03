# Does the Digest count as an exchange?

Type: grilling
Status: open

## Question

ADR 0051 (a message carries its Recent Exchange) says one exchange is one message from the person
and the bot's reply to it. The Digest is sent with no message from the person, per ADR 0024
(filing is frequent, speaking is daily). The ADR does not say what it is in the Recent Exchange.

Two ways it goes wrong:

- **It counts.** A long Digest takes a slot and many tokens. Days of Digests with no chat between
  them could fill all 8 slots.
- **It does not count.** The person replies to the Digest without pressing reply: `what was the
  second one?`. The answer call never sees the Digest.

Settle:

- Whether the Digest is in the Recent Exchange, and as what: its own kind of turn, or an exchange
  with no message from the person.
- Whether it takes one of the 8 slots.
- Whether only the latest Digest goes in.
- Every other message the bot sends unasked, and whether the same rule covers it. Check `run.py`
  and the Telegram sends in `memark/` for the full list.
- How this sits with Agent Turns in `CONTEXT.md`, which ADR 0051 now reads back to the model.
