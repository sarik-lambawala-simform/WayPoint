# 03 — A Task about the person lives on `Me`, and a mood stays a Capture

**What to build:** the routing rule and the test that bounds the Card, so the self Card does not
swallow everything.

Decided in
[ticket 05, a Card for the person themselves](../../memark-p09.6-decisions-only-you-can-make/issues/05-a-card-for-the-person-themselves.md),
part 4, and in
[ticket 02](../../memark-p09.6-decisions-only-you-can-make/issues/02-may-the-reserved-card-hold-a-claim.md),
which set the routing rule. Do not re-argue either.

**The routing rule:** put the claim on the subject it names, and the person is the subject only when
the claim is about them and names nobody else. So `Mehul is my office manager` goes to Mehul. `I work
at Simform Solutions` goes to Simform. `I like ice cream` goes to `Me`. `The wifi is still causing
issues` is about nobody, so it is refused and the Digest asks.

**What bounds the Card is a durability test, not the routing rule.** One sentence the model applies:
*would this still be worth reading in a month?* `I work at Simform Solutions` passes. `I am tired
today` does not.

The routing rule alone does not save the Card, and this is the worry the ticket opened with. `I am
tired`, `I hate Mondays` and `I should sleep more` all name nobody else, and that stream is a large
share of what a person captures. The durability test is what holds the size down.

Nothing is lost by leaving a mood off the Card. The Capture is kept whatever happens to it, Recall
finds it by date per ADR 0033, a day is recalled from its Captures, and the weekly Reflection is the
step whose whole job is reading the mood stream for what recurs. Filing a mood onto a Card was taking
the Reflection's work and doing it worse, one line at a time, with no week to see it against.

**A Task about the person goes here and not to `Loose Ends`.** `I should sleep more` names a subject
now. `Loose Ends` keeps what names nobody at all and it shrinks by exactly this much. Issue 02 moved
the refusal onto the destination, so the rule is already "put it on the subject it names", and
carving out one Card would break that rule in one place and put the person's own errands in two
files.

The Card of durable facts about a person is small. A Card of every passing feeling would have been a
second noise floor, and it is not being written. That is why no Lookup rule is needed here.

**Blocked by:** 01 — `Me`, the second Card reserved by name; 02 — A claim aimed at `Loose Ends` is
refused however it got there.

**Status:** completed

**Completed at:** 2026-09-14T13:13:04Z

- [x] A claim about the person naming nobody else lands on `people/me.md`.
- [x] A claim naming somebody else still lands on that person's Card.
- [x] A Task about the person lands on `people/me.md` and not on `areas/loose-ends.md`.
- [x] A passing mood writes no Card line and the Capture stands.
- [x] The durability test is written into the prompt in one sentence.
- [x] A claim about nobody is still refused and still reaches the Digest.
