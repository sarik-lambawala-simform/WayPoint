# Does a claim the box declines need a home on a Card?

Type: grilling
Status: resolved
Blocked by: 01, 02

## Question

The idea that started this map: Cards get a new section for small, temporary, small-talk facts,
held at a lower priority than the rest of the Card.

It is blocked on purpose. Ticket 01 says what mark a declined claim carries and ticket 02 says
where the line sits. Until both are answered, this ticket cannot tell what it is finding a home
for, and it may find there is nothing left to house.

Three things to pull apart before answering:

- **"Temporary" and "small" are different axes and the idea uses one word for both.** A favourite
  biscuit is small and permanent. `I am knackered` is small and temporary. A phone number is
  large and permanent. Which of these is the section for?
- **The Capture is already a home.** Every word the person typed is in the inbox forever, and
  ADR 0033, a day is recalled from its Captures, means a day can be read back out of them. The
  mood probe in `harness/live/repeat.py` says reading that stream for what recurs is the weekly
  Reflection's job. So the question is not "where do these words live". It is "what does a Card
  give them that the Capture does not".
- **"Lower priority" is not a word this domain has.** Priority for what? Which the Digest shows?
  What ADR 0043, the model reads the whole Vault, puts in a prompt? How the Lookup ranks? Name
  the mechanism or the word does not survive into `CONTEXT.md`.

If the answer is yes, the section is a heading, and headings are already a Box Setting: the
allowed list per Card kind lives in `settings.md`, the model may propose one that is not on the
list, and the person is asked that evening and may turn it down. The `x Wishlist` line in the
baseline fixture is exactly that having happened. So say what this needs that proposing a heading
does not already give.

If the answer is no, say what was really being asked for, and put it where it belongs.

Resolve by a yes or a no with the reason, and `CONTEXT.md` updated if a word was settled.

## Answer

**No.** A claim the box declines does not get a section on a Card. Nothing is built and nothing is
added to the allowed heading list.

### Why the question changed under this ticket

It was blocked on 01 and 02 on purpose, and both answers moved what it was asking about.

Ticket 02 settled the axis as standing, and a preference stands. `I like threptin biscuits` and
`My favourite color is red`, the two messages this whole map came from, now land under `Facts` on
`Me` like any other fact. ADR 0047, the Card for the person holds what stands however small, says
the axis is never size. So the homeless thought the section was invented to catch is not homeless
any more.

Ticket 01 settled the mark as `skip`, and ADR 0048, `skip` means the words hold nothing that stands,
gives that mark one meaning. What is left after both answers is a passing mood and a thing that
happened. Those are not dropped claims. They are claims the durability test was built to turn down,
and the standing preference for this effort says that test earns its place.

So the section would be a home for the cases the box is right to refuse. A mood on a Card makes the
Card wrong within a month, which is the failure the **Durability Test** entry in `CONTEXT.md`
already names.

### What the section would have to give that the Capture does not

Nothing that this map can point at.

The words are in the inbox forever. ADR 0033, a day is recalled from its Captures, means the day
reads back out of them. The reply carries one mark per piece per ADR 0024, filing is frequent and
speaking is daily, so a `skip` is on screen while the thought is still in the person's head. That is
the map's destination met: no thought is dropped without the person being told.

A Card section adds one thing the Capture lacks, which is a place the Digest and the Lookup would
read. Both of those are for what stands. Feeding them a mood is the defect, not the feature.

### The three things the ticket asked to be pulled apart

- **"Temporary" and "small" are one word for two axes.** Settled by ticket 02 and ADR 0047. The
  axis is standing. Small and permanent is written down. Small and passing is not. The section was
  built on the conflated word and does not survive the split.
- **The Capture is already a home.** Confirmed. The question was what a Card gives that the Capture
  does not, and the answer is Digest and Lookup reach, which a turned-down claim must not have.
- **"Lower priority" is not a word this domain has.** It stays that way. No mechanism was named, so
  nothing enters `CONTEXT.md`.

### Who reads the mood stream

`CONTEXT.md` names the Reflection: the weekly open-ended pass over the last seven days of Captures,
looking for what recurs, what is avoided, what contradicts a stated intention. The mood probe in
`harness/live/repeat.py` says the same.

It is not built. No module under `memark/` mentions it.

That is named and left there. Pinning down what the Reflection reads is past this map's destination,
which is a decision about what the box does with a claim it declines. The Reflection is its own
phase and its own map. The fog bullet about it moves from **Not yet specified** to **Out of scope**.

### If this "no" is wrong later

It is cheap to undo and needs no code. A section heading is already a Box Setting: the allowed list
per Card kind lives in `settings.md`, the model may propose a heading that is not on the list, the
person is asked that evening, and a yes grows the list by one line. The `x Wishlist` line in
`tests/fixtures/baseline/settings.md` is exactly that having happened. So the escape hatch is the
Proposed Heading path, and it is named here so the next reader finds it.

### What landed in this session

Nothing outside this folder and the map.

- No ADR. This ticket settles no word and changes no behaviour. The reasoning it rests on is already
  written: ADR 0047 for the axis, ADR 0048 for the mark, ADR 0033 for the Capture as the home.
- No `CONTEXT.md` change. The **Durability Test** entry already carries the line that decides this,
  that a mood expires and the Capture keeps the words for Recall and the Reflection to read. Adding
  a term for a section that will not exist would put a dead word in the glossary.
- No change to `settings.md` or any fixture.
