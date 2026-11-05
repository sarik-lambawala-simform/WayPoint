# The payment still comes back skip

Type: grilling
Status: resolved
Blocked by: 12

## Question

Ticket 11 put the scope in the `skip` bullet: the durability test is asked of claims about the
person and of nothing else. It measured the payment lost as `skip:` on `L211` at 0 of 5. Ticket 12
ran it again, ten runs a side on the same clock, and it does not hold: 5 of 10 on ticket 11's
prompt, 6 of 10 on ticket 10's. The runs are in [../finding.md](../finding.md), under "Ticket 12:
the same clock, ten runs a side".

What the runs show. On ticket 11's prompt the mark alone decides the outcome: every run that marked
`paid ramaben 8k by gpay for this month` as `skip` lost it, and every run that marked it `claim`
held it. No run in 20 proposed the payment as an edit. Every edit was the wage from next month.

Why does the model still read a payment to somebody else as holding nothing that stands, and what
changes so it stops? The answer names what changes, the prompt or something else, and the bar it
must meet on `L211:where`, measured on at least ten runs so one lucky draw cannot pass it.

The constraints hold. No test row's own words go into the prompt (ticket 06). The durability test
keeps its place and `L126` still asserts it (the map's standing preference). ADR 0014, the model
proposes edits and code applies them: a fix where code decides the words carried a claim argues with
it.

## Answer

**The prompt changes, and the payment gets an edit on Ramaben's Card.** Decided with the user on
2026-09-25, from the 20 runs under "Ticket 12: the same clock, ten runs a side" in
[../finding.md](../finding.md).

**Why the model reads the payment as holding nothing.** Two gaps, one in each half of the answer.

1. **Whose claim it is.** In `paid ramaben 8k by gpay` the person is the one who paid. So the model
   can read it as a claim about the person, ask ADR 0047's question, and find a thing that happened
   at one moment. Ticket 11 said the test is for the person only, but it never said whose claim a
   thing done to somebody else is. Its example, `returned the drill I borrowed from Dev`, has the
   same shape and only asserts that it is about Dev.
2. **Where it goes.** No run in 20 wrote the payment. The prompt says what stands goes on the Card,
   and it says nothing about a thing done to somebody else. So a run that marked it `claim` still
   wrote nothing, and the evening Digest would have asked.

**Decided with the user:**

- **A thing the person did to or for somebody else is a claim about that somebody.** A payment, a
  loan, a thing lent, a thing handed back. It gets an edit on their Card under `Facts`, and the line
  keeps the words the person typed: how much, how it was paid, which month. Fixing the mark alone
  was turned down, because the Digest would then ask about every payment every evening.
- **The cost is accepted.** Other people's Cards gain lines for things done to them. This follows
  from ticket 10: the durability test is not asked of anybody else, so nothing turns these down.
  `I went to the gym today` still gets no line, because nobody else is in it.
- **The bar on `L211:where`, ten runs:** 0 of 10 lost as `skip:`, and at most 1 of 10 bad in all.
  The one allowed failure is for `covered:`, phase 10.9's defect, which this map does not fix.
- **The guards keep their bars.** `L126:mark` and `L153:mark` at most 1 of 10 together, and `L302`,
  `L300:mark` and `L301:mark` 0 of 5 each. `L126` still asserts the durability test.

ADR 0048, `skip` means the words hold nothing that stands, gains a paragraph in "The test is asked
of the person only". `CONTEXT.md`'s **Durability Test** entry gains one sentence. The wording and
the measurement are [14-a-thing-done-to-somebody-goes-on-their-card.md](14-a-thing-done-to-somebody-goes-on-their-card.md).
