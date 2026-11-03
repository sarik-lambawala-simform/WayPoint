# 01 — Which capitalised words are names

**Type:** grilling

**Status:** resolved

**Blocked by:** none.

**Moved from:** phase 9.5 ticket 01. Renumbered, not rewritten.

## Question

`lookup.py` reads a name out of the message by one rule: the person capitalised it. That rule now
produces a false statement, and the fix needs a decision rather than an implementation.

`_capitalised` already carries the reasoning that matters. It drops a single capitalised word that
opens a sentence, and says why:

> What the reply then says is not a true line about a name it has nothing on, it is a false one
> about a word that was never a name, and the whole case for reading capitals loosely was that a
> wrong guess costs one extra true line. Once the line can be false the safe direction reverses,
> so the opening word is dropped instead.

That is exactly right, and it is applied to one case out of two. A capitalised abbreviation in the
middle of a sentence is the other one:

    ?did the EMI go out this month      ->  I have nothing on EMI.
    ?what did bhavesh say ABT the rent  ->  I have nothing on ABT.

`EMI` is a loan instalment. `ABT` is how somebody types `about`. Neither was ever a subject, and
the reply says the Vault holds nothing on them as though they were.

The corpus filter in `ranking.py` catches some of these by accident and that is the trap. `NOC` and
`LIC` do not trigger it, because this Vault already carries both words somewhere. So the false line
appears only for an abbreviation the Vault has not seen yet, which is precisely the first time you
ask about one.

The question is which rule replaces the capital.

**Option A: a word in a run of one is a name only if it is not all capitals.** `EMI` and `ABT` go.
So does `NOC` in `?what did Mummy say about the NOC`, which is a real subject written the way
everybody writes it, though nothing is lost there because it is not a Registry row either way. What
is lost is a person whose name is genuinely written in capitals, which is rare.

**Option B: hold every name against a list of English and Indian-English abbreviations.** Precise
and a table nobody maintains. ADR 0012 put confirmation with the human and ADR 0011 refused a
table of festivals for the same reason. A table of abbreviations is the same shape of thing.

**Option C: say the line differently.** Keep reading the capital as a possible name and stop
asserting the Vault knows nothing about it. Something nearer "I could not match EMI to anything"
than "I have nothing on EMI". This makes the sentence true without deciding what a name is, and it
weakens story 75's line for the cases where the name really is a person.

**Option D: only assert a miss for a run of two or more capitalised words, or for a single word
that a Registry row is one edit from.** The strongest signal available without a table. It loses
the honest single-name miss, which is `L82`'s whole row: `what did Jignesh decide?` would go quiet
instead of saying it has nothing on Jignesh. That row is in the bundle and passing, so this option
trades a passing row away.

There is a fifth thing to settle whichever option wins. `?WAT DID BHAVESH SAY ABT THE RENT` is a
real way a message arrives, and under the current rule the all-capitals message offers no signal at
all: every word is capitalised, so the capital means nothing. Whatever rule replaces this has to say
what it does with a message that is entirely capitals, rather than leaving it to fall out.

## Notes

`L93` in `harness/live/scenarios_p09_india.py` is deliberately given the loosest assertions of any
row in that bundle for this reason. It asserts what the Card citation must do, and prints the miss
line rather than asserting it, because what the line should say is this ticket's to decide.

## Answer

**None of A to D. The capital stops being read at all, and a model names the subjects instead.**

A, B and D each try to decide what a name is with a rule over letters, and the grilling found the
case that breaks all three. A programmer writes `API`, `JSON` and `SQL` in capitals every day, and
the same person writes `NOC` and `EMI`, which are real subjects a Card could hold. No rule over
letter case separates those two sets, because what separates them is meaning. Option A buys a true
line by going deaf to every all-capitals subject, and that is a permanent cost paid for a rule that
was only ever a stand-in.

C was rejected for a second reason. It makes the sentence true by making it vague, and it pays that
price on every message, including the ones that were already correct.

Four parts, and they only work together.

**1. The Intent Read names the subjects, and code resolves them.** Per ADR 0032, which decided that
intent is read by a model and applied by code, the model returns the words the person meant as
subjects, in their own words and nothing else. Code matches each one against the Registry, exact
plus aliases, the same way it already resolves the target of a change. The model is not shown the
Registry and never adjusts a name to one it thinks exists.

This is not a new shape for this system. ADR 0002, which decided that deterministic code selects
what the model sees, carries an amendment stating that the model may ask, from a closed list, and
code decides whether to serve it. The first entry on that list is a Registry lookup by name, exact
plus aliases. Reading a name out of a message and handing it to code is the pattern every other
path already uses. The capital was the exception, not the rule.

**2. It costs no extra call.** `_read_for_intent` at `handler.py:316` already runs on a Question,
and the answer runs after it at `handler.py:350`. The subjects are one more field on a packet that
is already requested for that same message. Nothing new is called, and nothing new is waited for.

**3. `_capitalised` goes.** No list of abbreviations, and no separate rule for a message written
entirely in capitals. Nothing is left that reads letter case, so the fifth question this ticket
raised is answered by removal rather than by a special case. `?WAT DID BHAVESH SAY ABT THE RENT` is
read for subjects like any other message, and `L93` stops being a shape the rule has nothing left
to read.

Finding the Card was never the problem and does not change. `_reached` in `lookup.py` walks the
Registry and searches the message for each name and alias with letter case ignored, so `bhavesh`
in small letters already reaches the Card and always did. Measured on `an-indian-household`:

    ?when did i last meet bhavesh   ->  Bhavesh (landlord)   nothing_on = ()
    ?when did i last meet jignesh   ->  no Card              nothing_on = ()
    ?when did i last meet Jignesh   ->  no Card              nothing_on = ('Jignesh',)

The third row is the miss line working. The second row is the hole this fix also closes: a stranger
whose name you typed in small letters is passed over in silence today, so story 60 is already only
half kept, and the capital rule is why.

**4. Where there was no reading, there is no miss line, and the reply says so.** This is the part
that keeps story 60 honest and it was the user's own amendment to the proposal. The reading is
allowed to fail silently by design, per `_read_for_intent`, and it stops at the daily cap of 150 set
by ADR 0032. Falling back to the capital rule was considered and rejected in the grilling for the
obvious reason: the fallback would be the bug, so a bad day would print `I have nothing on ABT.`
again. Printing nothing was rejected too, because then the box answers with full confidence while
blind and nothing on screen says so.

So the box says one plain sentence instead, near the answer rather than near the echo, on every
answer written without a reading. Something like `I could not check this for names I have never
heard of.` The answer under it is still correct, because the Cards were found by code.

The line has to sit on the answer and not on the acknowledgement. `READING_LIMIT_REACHED` at
`intent.py:599` already tells the person when the cap is reached, but ADR 0032 has it said once a
day to the first message the budget refuses. A Question asked later that day would otherwise get no
miss line and no warning at all.

### What this costs

**The miss line stops being deterministic.** Today `nothing_on` is computed inside `look_up`, a pure
function over the Vault, which is why phase 9.5 ticket 02 could ask for a unit test reading it
directly. It becomes an input to `look_up` instead. The test still holds, and reads better: the
subjects are passed in, so the miss line is tested without a model at all.

**The cheap tier now has to name subjects.** The Intent Read tier is a Box Setting defaulting to the
cheap tier, per ADR 0032. If it names subjects badly, the standing preference of this map applies
unchanged: ADR 0003 chose hosted models and put mechanical work on the cheap
tier, so the prompt is what changes and never the tier. This wants a measured rate before the implementation is called done.

**A word wrongly read as a subject still costs one extra true line**, which is the trade ADR 0018 made for
recognising a Question at all when it decided a Question is answered and also kept as a Capture.
The loose direction is safe again for the same reason it was safe before. What is no longer possible is a false line about a word that was never a subject, because
nothing now guesses from letters.
