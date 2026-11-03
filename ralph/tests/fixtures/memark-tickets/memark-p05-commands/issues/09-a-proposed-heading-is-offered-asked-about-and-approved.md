# 09 — A Proposed Heading is offered, asked about, and approved from the chat

**What to build:** the vocabulary can grow. The agent meets something that has no heading to go under,
asks for one by name, and one word adds it.

The agent writes only under a heading on the allowed list and may offer a Proposed Heading, inert until
confirmed, per ADR 0026, which fixed the grammar of a Card line and the closed set of headings that go
with it. Nothing offers one today, so this ticket builds the whole path: filing offers the heading, the
Digest asks about it as a numbered item with a footer entry like any other, and `yes N` writes it to the
allowed-headings list in the Settings file so the next filing may write under it.

`no N` keeps the rejection as an `x` entry on the list, so the same heading is never offered twice. Both
answers go through the Pending Instruction shape, because the bot writes the inbox and never a Card or a
Settings file, per ADR 0035, which kept the Vault's single writer.

The reason to bother is drift. Without an approval path, forty Cards end up holding three spellings of
the same idea, and the alternative, letting the agent invent headings freely, is the same drift with no
one asked.

**Blocked by:** 07 — `yes N` and `no N` on a Proposed Date.

**Status:** completed

**Completed at:** 2026-09-04T13:46:31Z

- [ ] Filing offers a Proposed Heading for a Card kind rather than writing under a heading that is not
      on the list, and writes nothing under the proposed heading.
- [ ] The Digest asks about it as a numbered item, and its footer entry resolves.
- [ ] `yes N` adds the heading to the allowed list in the Settings file, and the next filing run writes
      the held-back claim under it.
- [ ] `no N` records the heading as a rejected entry, and it is never offered again.
- [ ] `## Done` is never offered as a Proposed Heading and never lands on the allowed list.
