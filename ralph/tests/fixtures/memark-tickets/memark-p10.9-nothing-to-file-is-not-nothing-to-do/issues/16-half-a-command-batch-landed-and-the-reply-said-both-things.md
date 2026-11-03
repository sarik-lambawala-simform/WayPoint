# 16 — Half a Command batch landed and the reply said both things

**Type:** defect

**Status:** completed

**Completed at:** 2026-09-18T13:34:13Z

**What to build:** one reply gives one account of what changed. The batch is left per change, and
`L21`'s own hard check changes with it. See `## The rule, decided`.

**Reproduces:** 5 of 5 on `claude-haiku-4-5`. The same reply word for word in all five runs, so
this is code rather than a model, and no comparison run on `claude-opus-5` was made. A stronger
model cannot change a path that never asks one.

## What happens

`L21` sends two lines in one message:

```
done 2
done 3
```

Item 3 does not resolve. The all-or-nothing rule of phase 5 says neither line lands, the whole
message takes the ordinary path, and nothing is promised. The row's own check is
`nothing_was_promised`, and it went red:

> nothing was promised: 1 Pending Instructions in the inbox

`done 2` landed. The Loose Ends Card gained:

```
- [x] chase the plumber for the quote · shown:: 3 · from:: [[...^c118]] · done:: 2026-08-27 ^b91d
```

And the reply said both things, two lines apart:

> Will close: chase the plumber for the quote. That is in Loose Ends.
> I cannot do that to 3 in the list I sent you, so I have changed nothing.

The second sentence is false, and it is false about the sentence directly above it. A person reading
only the last line believes their Vault is untouched.

This is the exact shape phase 10.85's HITL ticket asked the pass to watch for: a reply opening with
a sentence that contradicts the paragraph under it. It turned up here rather than in an answer.

## Why

**Established, and it is not where this ticket first looked.** `memark/commands.py:580`,
`read_command`, is right. It reads the lines one at a time and returns `None` the moment one does
not resolve, so the whole message goes down the ordinary path and no Command lands. Phase 5's
all-or-nothing rule holds exactly where ADR 0041 put it, which decided that nothing is cut into a
Command half and a prose half.

The batch lands on the other path. Once `read_command` refuses the message, the Intent Read reads
it, and it comes back with two `digest-item` changes, `done 2` and `done 3`. `memark/intent.py:1021`,
`_an_item_acted_on`, then handles **one change at a time**:

```python
command = RESOLVES[one.verb](one.number, vault=vault, footer=concerned.footer)
if command is None:
    return NOT_THAT_KIND.format(number=one.number), ()
return _named(command, entry, vault=vault, clock=clock), command.instructions
```

A refused change returns its sentence and no instruction. A resolved one returns its sentence and
its instruction. The caller keeps both. So item 2 wrote a Pending Instruction, item 3 wrote none,
and the two sentences were joined into one reply. **There is no all-or-nothing rule on this path at
all.** ADR 0041 wrote one for the Command path and ADR 0032, which put the Intent Read in charge of
reading a message the Command path refused, never wrote one for this one.

Item 3 is in the Digest. It is not the kind of line `done` acts on, so `NOT_THAT_KIND` fired rather
than `NO_SUCH_NUMBER`.

### A second, smaller defect in the same reply

The two refusal wordings at `memark/intent.py:734` and `memark/intent.py:776` do not agree about
what they are talking about:

```python
NO_SUCH_NUMBER = "There is no {number} in the list I sent you, so I have changed nothing for it."
NOT_THAT_KIND = "I cannot do that to {number} in the list I sent you, so I have changed nothing."
```

`NO_SUCH_NUMBER` says `for it`, which is a claim about that one item and is true beside a sentence
that changed something else. `NOT_THAT_KIND` drops those two words, so it claims the whole message
changed nothing. That is the false sentence the person reads. It is a much smaller fix than the
atomicity one and it is worth naming apart, because it is false on its own whatever is decided
about the batch.

## The rule, decided

**ADR 0041's all-or-nothing rule does not reach the Intent Read's change list. Each change stands or
falls on its own, and the reply is what gets fixed.**

The reason is that the list is not a list of commands. It is what the Intent Read made of a whole
message, and it carries five kinds: `digest-item`, a day said, a finished Task, a repeating line and
a subject picked. A message can hold a numbered action and an ordinary fact at once. Somebody typing

```
done 2
priya's birthday is actually the 21st not the 19th
```

must not lose the birthday because item 2 did not resolve. An atomic list would drop it. That is a
worse failure than the one this ticket was filed for, and it would be a quiet one.

So `_an_item_acted_on` and its four siblings keep refusing per change. The Command path keeps its own
rule, which is ADR 0041's and is correct where it sits: `read_command` is strict because a Command is
a verb and a number, and a mistyped one must never leave half a message applied.

### What this changes about `L21`, and it is not a small thing

`L21`'s own hard check is `nothing_was_promised`. It asserts that a two line `done 2 / done 3`
message writes no Pending Instruction, and it was written for phase 5's rule.

**Under this decision that assertion is wrong.** The message fails the Command check, goes down the
ordinary path, and on that path `done 2` landing a Pending Instruction is correct behaviour. The
check is asserting a rule the box does not claim for the path the message actually took.

This is the same shape as ticket 14, where eight earlier rows asserted rules phase 10.85 replaced.
The rule there was that a row asserts the rule the box has. **It is only allowed here because a
decision was written down first.** `harness/live/` accumulates and a row is never edited to make a
phase pass, so the record of why this one changed lives in this section and the change is not made
without citing it.

What `L21` should hold instead is the thing this ticket is actually about: the reply gives one
account. A refusal of item 3 and a `Will close:` for item 2 cannot both claim the whole message.

## What to change

### The wording, which is the false sentence

`memark/intent.py:776` gains the two words its sibling at `memark/intent.py:734` already has:

```python
NO_SUCH_NUMBER = "There is no {number} in the list I sent you, so I have changed nothing for it."
NOT_THAT_KIND = "I cannot do that to {number} in the list I sent you, so I have changed nothing."
```

`for it` is the difference between a claim about one item and a claim about the message. Every
refusal wording on this path says which it is talking about, so the other three are read at the same
time rather than this one alone.

### The reply, which is the rule

One run, one account. A reply composed from several changes says what happened to each and never
makes a whole-message claim on behalf of one of them. The test asserts the pair that was seen: a
reply carrying a `Will close:` line cannot also carry a sentence claiming nothing changed.

### `L21`'s check

Replaced, per the section above, with one that reads the reply rather than the Pending Instruction
count.

## Done when

- [x] The rate is measured, with `python -m harness.live.repeat L21:half --runs 5`. It is 5 of 5.
- [ ] `NOT_THAT_KIND` says `for it`. The other refusal wordings on this path are read at the same
      time and say which thing they are talking about.
- [ ] A reply carrying a `Will close:` line carries no sentence claiming the message changed
      nothing. A test asserts that pair.
- [ ] `L21`'s hard check reads the reply's account rather than counting Pending Instructions, and
      the row's own module says why, citing the decision in this ticket.
- [ ] `done 2` alone still lands, and a batch where every line resolves still applies whole. The
      per-change behaviour is kept on purpose and is not quietly narrowed.
- [ ] A message holding a refused numbered action and an ordinary fact still files the fact.

## Why this is `ready-for-agent`

It was `ready-for-human` for two reasons and both are spent. The rate is 5 of 5 and the cause is
pinned to a line. The rule is decided, so the one thing an agent could not settle for itself, whether
to make the change list atomic, is settled against doing it.

The one thing to read twice before starting is the `L21` section above. A hard check is being
replaced, and that is only allowed because the decision above says the check asserts the wrong rule.

## How the rate was measured

`python -m harness.live.repeat L21:half --runs 5`, on a clean tree, with the filing tier forced onto
`claude-haiku-4-5` per ADR 0003, which chose hosted models over local inference and put filing on the
cheap tier. Every one of the five returned the same reply:

> Recorded: done 2 | done 3 | Will close: chase the plumber for the quote. That is in Loose Ends. |
> I cannot do that to 3 in the list I sent you, so I have changed nothing.

The probe counts `pending:: ` in the inbox, which is what `L21`'s own hard check reads, so the rate
and the row say one thing rather than two. One Pending Instruction was written in every run.
