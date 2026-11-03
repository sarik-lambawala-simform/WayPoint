# 02 — What the model sees of the day

**What to build:** the entry reads like the day rather than like the file. A question you asked comes
back as a question you asked, the machine operation is not in it, and none of the plumbing shows.

Every `key:: value` field is stripped before the model sees the text. That covers `filed::`, `ack::`,
`received::` and the Pending Instructions of phase 5, and it is exactly why a Pending Instruction is a
field rather than a bullet of its own: a field is strippable by one rule and a bullet would have to be
recognised.

Within the file, a Question counts and a Command does not. A Question is a Capture too, per ADR 0018,
which made asking the box something a Capture records rather than a mode you enter, so flattening it
into an event would be a lie about the day. A Command is machine operation: `done 2` is not a thought
and belongs in no write-up.

**Blocked by:** 01 — Yesterday is written up as prose, and nothing is sent.

**Status:** completed

**Completed at:** 2026-09-07T21:55:06Z

- [ ] An inbox block carrying `filed::`, `ack::` and `pending::`: none of the three keys, and none of
      their values, reaches the model or the entry.
- [ ] A day whose inbox holds a Question and a Command: the entry renders the Question as a question
      that was asked, and does not mention the Command.
- [ ] The stripping is done on the text handed to the model, so the inbox file on disk is unchanged
      byte for byte.
