# 17. Every message carries its Recent Exchange

**Type:** task

**Status:** completed

**Completed at:** 2026-10-01T03:47:48Z

**Blocked by:** 16

**What to build:** `How about day before yesterday?`, sent as a new message after a question about
mood, is answered about mood.

Spec: [../spec.md](../spec.md), "The Recent Exchange" through "Filing does not change". Decided in
[What does a follow-up without a reply get?](03-what-does-a-follow-up-without-a-reply-get.md). The
rule is ADR 0051, a message carries its Recent Exchange, as amended by ADR 0054.

## What happens today

`_prompt` in `memark/intent.py` takes the Thread only. `_prompt` in `memark/answering.py` takes no
turn at all. The `subjects` rule allows only words the message wrote.

## What to change

- A function reads the Recent Exchange from the Chat Log. It walks back from the new message until
  it has counted N of your messages, and keeps every bot row between them, in order. A row in the
  message's Thread is left out.
- N is a new Vault Setting, `recent-exchanges`, default 8.
- The Intent Read prompt and the answer prompt each gain a section for it: who said it, and the text.
  No clock. The answer prompt also gains the Thread. Both go before the question.
- `subjects` may be a word from the message, its Recent Exchange or its Thread. Code checks each one
  letter for letter against that text. `question` is still copied from the new message alone.
- A subject not in the new message was carried. Code passes the carried subjects to the answer call,
  and the answer's instructions say it names each one, as in `Things you and Wife both like: ...`.
- Filing does not read it. The Journal Entry does not read it.

## Done when

- [ ] The Recent Exchange holds 8 of your messages and the bot rows between them, in order.
- [ ] `recent-exchanges: 3` holds 3.
- [ ] A Thread row is not sent twice.
- [ ] Both prompts hold the Recent Exchange. A Filing Run's prompt does not.
- [ ] A subject from the Recent Exchange passes the letter check. One in no row fails it.
- [ ] A carried subject reaches the answer call.
- [ ] The unit suite is green.
- [ ] It commits, with ADR 0051 and its amendment if no earlier commit carried them.
