# 05 — A Card for the person themselves

**Type:** grilling

**Status:** resolved

**Blocked by:** none. Ticket 02 decided the principle; this decides the shape.

**Raised by:** ticket 02's answer, 2026-09-10.

## Where it came from

Ticket 02 asked whether the reserved Card may hold a claim and answered no. Its second route found a
different question hiding underneath: `I work at Simform Solutions and I am the manager there` went to
three destinations in three runs, because the person sending the Captures is the subject every Capture
is implicitly about and the one subject the Vault has no Card for.

Ticket 02 settled the principle. **The person gets a Card**, and the routing rule is: put the claim on
the subject it names; the person is the subject only when the claim is about them and names nobody
else. So `Mehul is my office manager` goes to Mehul, `I work at Simform Solutions` goes to Simform, and
`I like ice cream` goes to the person.

What ticket 02 did not settle is the shape.

## Why it was not obvious

The first instinct in the session was to refuse a self Card, on the ground that every Capture is
implicitly about the person, so the Card would swallow everything and never shrink. That is the same
cost ADR 0034, a closed Task is hidden from the model and never reopened, already worries about on
`areas/loose-ends.md`.

The routing rule above is what defuses it. A claim that names another subject goes to that subject, so
the self Card only ever receives what names nobody else, and that is a small set. The worry was real
and the rule answers it, but the rule has to be written somewhere a model reads.

## What already covers part of this

The **seeding interview** already collects a lifetime in one sitting, and those facts land on Cards for
the people, projects and areas the person named. So the system already learns about its user sideways.
This ticket is only about the leftover: a fact whose only subject is the person.

## Question

**What is the Card, exactly?**

1. **Its kind and name.** Is it a `person` Card sitting in `people/`, or a reserved Card like
   `Loose Ends`, or a third kind? The name matters because ADR 0026, a Card line has a fixed grammar,
   made the Registry carry the names a person actually says out loud, and the person does not say their
   own name to themselves. They say `I`.

2. **How the model addresses it.** `subject: null` means homeless and is refused. What does a claim
   about the person write in `subject`? A reserved literal, a flag on the edit, or the person's real
   name, which the box does not currently know? Ticket 02 noted the CLI mode guessed a name from the
   machine login and that the box's own prompt carries none.

3. **Whether it is one Card or several.** A lifetime of facts about one person is the exact shape that
   grows without bound. Does it split by heading, by area of life, or not at all?

4. **What `CONTEXT.md` calls it,** and whether the Loose Ends entry needs a sentence pointing at it, so
   a reader can tell "belongs to no subject" from "belongs to the person".

5. **Whether it is in the Lookup corpus.** ADR 0028, conversation finds Cards by matching words, ranks
   over Card bodies. A Card of personal facts is either the most useful thing in that corpus or a second
   noise floor, and ticket 20's strip does not apply because none of these lines close.

6. **Whether the seeding interview fills it,** and if so what it asks.

Invoke `/mattpocock-skills:domain-modeling` alongside the grilling. This ends in a word `CONTEXT.md`
does not have yet.

## Answer

**Resolved 2026-09-10.** The Card is an ordinary `person` Card with a reserved name, `Me`, and the
Intent Read is what points at it. Six parts, in the order the question asked them.

### 1. Its kind and name

`people/me.md`. `subject: Me`, `kind: person`, `status: live`, `schema: 1`. One Registry row like any
other row. No new kind, and no new Card mechanism.

`Me` joins `Loose Ends` as the second reserved name in the Vault, and the pattern is identical: a
reserved name on an ordinary Card kind. `Loose Ends` is `kind: area` and nothing about it is special
except that the name is taken and code knows it. So a second reserved kind was refused for the reason
the first one never existed. A person is a person.

The name is `Me` and not the person's real name, and this is where ADR 0026, a Card line has a fixed
grammar, gets its way rather than being worked around. It made the Registry carry the names a person
says out loud. `Me` is the word they say. The box therefore never needs to learn a legal name, and the
CLI mode's guess off the machine login, which ticket 02 recorded, is dropped rather than fixed.

### 2. How the model addresses it

**The `aka::` list is empty and stays empty.** This is not an omission and it is the load-bearing part
of the answer. `aka:: i, me, my` would resolve the self Card out of nearly every message a person
sends, because `me` is one of the commonest words in English. `remind me about the plumber` is not
about the person.

**The Intent Read may emit the literal `Me` as a subject.** Code resolves it against the reserved row
on the exact path in `lookup.py`, the same path `my wife` takes to the `Wife` row. So the reading, not
the letters, is what decides that a message was about the person.

The case that settled it was asked in session: *where should my wife and I go for dinner, going by what
we each like*. Under aliases-or-nothing, the wife's Card is reached by the exact path and is certain,
and the person's own Card arrives only if BM25 happens to rank it in on a shared word like `food`. That
is luck, and one line competes against every Card in the Vault. With the literal, the subjects are
`["my wife", "Me"]` and both Cards are read exactly and both are certain.

This is ticket 01's argument reused rather than a new one. Ticket 01 removed `_capitalised` because no
rule over letters separates a name from a word, only meaning does. No alias list separates `my wife and
I` from `remind me`, and only meaning does. ADR 0032, intent is read by a model and applied by code, is
the mechanism in both.

The same literal serves filing. A claim about the person writes `subject: "Me"`, so ticket 02's refusal
of `subject: null` is untouched: homeless still means homeless, and `Me` is a destination like any
other. Ticket 02's routing rule is unchanged and is now expressible: put the claim on the subject it
names, and the person is the subject only when the claim is about them and names nobody else.

### 3. Whether it is one Card or several

**One.** It splits by heading, using the `person` heading list already in `settings.md`, and it may
gain a Proposed Heading later the way any Card may, confirmed by reply per ADR 0026.

Several Cards by area of life, `Me (work)` beside `Me (health)`, was refused because it needs a rule
saying which one a claim lands on, and that rule is an Ambiguous Subject built by hand. ADR 0015,
an ambiguous or near name is asked about and never guessed, exists to stop the Vault growing those.
Building one deliberately is worse than the growth it was meant to control.

### 4. What is allowed on it, which is what bounds it

**Durable claims only.** The test a model applies is one sentence: *would this still be worth reading
in a month?* `I work at Simform Solutions` passes. `I am tired today` does not.

This is the answer to the worry the ticket opened with, that the self Card swallows everything and
never shrinks. The routing rule alone does not save it, because `I am tired`, `I hate Mondays` and
`I should sleep more` all name nobody else, and that stream is a large share of what a person captures.
The durability test is what holds the size down.

Nothing is lost by excluding a mood. The Capture is kept whatever happens to it, Recall finds it by
date per ADR 0033, a day is recalled from its Captures, and the weekly Reflection is the step whose
whole job is reading the mood stream for what recurs. Filing a mood onto a Card was taking the
Reflection's work and doing it worse, one line at a time, with no week to see it against.

A Task about the person goes here and not to `Loose Ends`. `I should sleep more` names a subject now.
`Loose Ends` keeps what names nobody at all, and it shrinks by exactly this much. Ticket 02 moved the
refusal onto the destination rather than onto `subject is None`, so the rule is already "put it on the
subject it names", and carving out one Card would break that rule in one place and put the person's own
errands in two files.

### 5. Whether it is in the Lookup corpus

**Yes, and on both paths.** It is ranked over its body by ADR 0028's word matching like any Card, and
it is reached exactly when the Intent Read emits `Me`. The exact path is what makes it reliable; the
ranked path is the addition `lookup.py` already says can never be a replacement.

The ticket's own note, that ticket 20's strip of closed Task lines does not apply because none of these
lines close, was half right and needs no rule either way. Under one Card with the `person` heading list,
the `Facts` lines never close and the `Tasks` lines do. So the strip applies exactly as it does on every
other person Card, and ADR 0034, a closed Task is hidden from the model and never reopened, needs no
amendment.

The second noise floor worry is answered by part 4 rather than by a Lookup rule. A Card of durable facts
about the person is small. A Card of every passing feeling would have been the noise floor, and it is
not being written.

### 6. Whether the seeding interview fills it

**Yes, with a small fixed set of questions about the person: work, place, health, what they like and
what they avoid.**

This is the one Card the interview cannot fill sideways. The interview already lands a lifetime on Cards
for the people, projects and areas the person names, so the system learns about its user as a side
effect. That side effect never reaches this Card, because nobody else's Capture is about them. Left out,
it stays empty for months, which is the same months the box most needs to know who it is talking to,
and it is the period the Checkpoint measures.

### What CONTEXT.md gains

One term, **`Me`**, next to `Loose Ends`, following the same pattern: the term is the Card's name.

> **Me**: The second Card reserved by name, holding what is true of the person sending the Captures and
> of nobody else. It is an ordinary `person` Card and its name is the word they say about themselves,
> per ADR 0026, so the box never learns a legal name. It carries no aliases, because `me` is too common
> a word to resolve on, and the Intent Read names it instead by emitting the literal `Me` per ADR 0032.
> It holds only a claim that is still worth reading in a month, so a passing mood stays a Capture for
> Recall and the Reflection to read. A Task about the person lives here, which is what `Loose Ends` no
> longer holds.
> _Avoid_: profile, self, user, owner, about me

The `Loose Ends` entry gains one sentence pointing at it, so a reader can tell "belongs to no subject"
from "belongs to the person", which is what part 4 of the question asked for.

### What this opened

An aggregate question over the whole Vault, raised in session: *how many people have ever gifted me
something, and who?* Neither the Intent Read nor any rung on ADR 0028's ladder answers it. Filed as
ticket 07 rather than answered here.
