# Can code see a Capture that came back all `skip`?

Type: task
Status: closed
Closed by: ticket 01, which invalidated the signal this ticket measures

## Question

Both lost messages came back as one piece, marked `skip`, covering the whole Capture. Not a
skipped fragment inside a message that otherwise filed. The entire thing.

That is a much narrower signal than the one ADR 0044, a Capture is drained by coverage and not by
writes alone, refused. That ADR turned down a backstop reading how long a Capture looks for one
edit, because `mixer ka ring aana hai` is five words and was the claim being lost, so any length
rule skips exactly the failure it was built for. "Every piece is `skip`" reads nothing about
length and nothing about the words. It reads only the model's own partition, which is the same
thing the coverage rule already reads.

It may still be useless. A person who types `thanks` or `ok` produces an all-`skip` Capture and
nothing is wrong. That is what this ticket measures.

This is work, not a decision. Do it, then ticket 01 and ticket 04 can argue with numbers:

1. Run the existing bundle and count, per Capture, how many came back with every piece marked
   `skip`. `harness/live/` is 297 rows on real calls, so the sample is already paid for. A free
   `MEMARK_PASS_MODE=auto` run will not do: `auto` writes the answer itself.
2. For each one, record the Capture's raw words, so a person can sort them into "genuinely
   nothing" and "a thought the box threw away".
3. Report the split. If all-`skip` Captures are almost always genuine filler, the signal is worth
   something. If they are common and mixed, it is noise and ticket 01 gets one fewer option.

Record the counts in the answer. Later tickets depend on them.

## Closed without measuring

Closed on 2026-09-21 by ticket 01's session, with the map owner's agreement. Not answered, and not
worth answering.

This ticket rests on one assumption: an all-`skip` Capture is rare and suspicious, so counting them
would say whether code can read that shape as a signal that a thought was thrown away.

ADR 0048, `skip` means the words hold nothing that stands, removes the assumption. A passing mood is
now an all-`skip` Capture **by design**, and a mood is a large share of what anybody types. The
shape this ticket wanted to treat as a warning is the ordinary answer for a whole class of message.

Running the bundle would produce a real number and the number would mean nothing. Code reading
"every piece is `skip`" would flag every mood, which is the one thing ADR 0048 set out to stop it
doing.

The underlying worry is not closed with it. It is that a `skip` piece over words that did stand is
invisible, which ADR 0044's reassembly check cannot catch and ADR 0048 names as the cost it accepts.
The guard on that is measurement, not a code backstop: `L300:mark` and `L301:mark` in
`harness/live/` are regression rows from here on, and ticket 08 adds `L302` to the same watch.
