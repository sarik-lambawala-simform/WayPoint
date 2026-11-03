# What does the reply say when the whole Capture came back `skip`?

Type: grilling
Status: resolved
Blocked by: 08

## Question

Graduated from the map's fog by ticket 01. It could not be phrased sharply until the mark was
settled, and now it can.

ADR 0048, `skip` means the words hold nothing that stands, makes a passing mood an all-`skip`
Capture on purpose. `memark/acknowledge.py` never renders a `skip` piece, so the reply is the plain
`Recorded:` line and nothing else. That is the same reply a thought the box wrote down gets.

Before this decision that shape was rare: the mood was marked `claim` on 8 of 10 runs and held. It
is now meant to be the ordinary answer for every mood a person types, which is a large share of what
anybody captures. A shape that was an edge case is about to become common, and the reply for it was
never designed.

The question is whether `Recorded:` is honest here.

- **Say it is fine.** The words are in the inbox, ADR 0033, a day is recalled from its Captures,
  reaches them, and the person sent a mood rather than a fact, so there is nothing to check. Adding
  a line means telling somebody every tired evening that the box read their feeling and filed it
  under nothing, which is a worse message than saying nothing.
- **Say it is not.** ADR 0024, filing is frequent and speaking is daily, says the reply exists so a
  person can catch a mis-filing while the thought is still in their head. A reply that reads the
  same whether the box wrote the thought down or turned it down is the one reply that cannot be
  checked, and the whole map exists because a turned-down thought looked like a filed one.

Read ADR 0046, what a reply may carry after it admits a gap, before answering. It already bounds
what a reply is allowed to say once it admits it fell short, and an answer here that ignores it is
proposing a second set of rules for the same message.

Resolve by saying what the reply carries for an all-`skip` Capture, and what ADR changes if any.
Resolve it **after** ticket 08, so the argument is made against the measured rate at which a mood
actually comes back all-`skip` rather than against the intent.

Do not reopen the mark. ADR 0048 decided that. This is about the message the person reads.

## Answer

Grilled with the user on 2026-09-24.

**The premise was half right.** A thought the box writes down does not get a plain `Recorded:`. The
filing run edits the reply to add a `✅` line. An all-`skip` Capture gets no edit, because
`filled_in` in `memark/acknowledge.py` returns `None` for it. So its reply reads the same as a
Capture **no run has reached yet**. The gap is "done" against "not yet", and ticket 08 measured the
shape at 9 moods in 10.

**The reply gains one line.** When the cut is usable and every piece is `skip`, the filing run edits
the reply to add `Nothing to file.` under the quote-back. Code writes it. It has no mark and it does
not quote the mood. The edit raises no notification, per ADR 0024, filing is frequent and speaking
is daily.

- It is one line for the whole Capture, so none of `✅ ❌ ❓` fits it, and a new mark such as
  `➖ I am tired today` was refused because it quotes the mood back, which ADR 0048 already refused.
- A Capture with no usable cut, or one no batch reached, keeps the reply it has. The box does not
  know those words held nothing.
- ADR 0046, what a reply may carry after it admits a gap, bounds it: nothing is added after the line.

**Why not leave it quiet.** The rare real loss, a standing claim marked `skip`, is 0 of 10 today and
could only ever be caught from the reply. With the line, a person sees `Nothing to file.` under a
fact and sends it again.

**ADR change.** ADR 0048, `skip` means the words hold nothing that stands, is edited in place. It is
not committed yet, and a reply string is easy to reverse, so a new ADR was not earned. Its section
"ADR 0024's reply is untouched" became a new section, "What the reply says when every piece is
`skip`", and "The cost, named" now says the person can catch the mistake from the reply.
`CONTEXT.md` gains no word.

For the spec: a unit test on `filled_in` for an all-`skip` usable cut, and one for `covered=None`
with no landings still returning `None`. A live hard check that `L126:mark` or `L153:mark`, when all
`skip`, ends in `Nothing to file.`.
