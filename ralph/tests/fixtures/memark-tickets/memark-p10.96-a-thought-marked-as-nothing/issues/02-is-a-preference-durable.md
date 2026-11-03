# Where does the durability test draw its line, and is a preference over it?

Type: grilling
Status: resolved
Resolved by: ADR 0047; measurement split to 06 and 07

## Question

`distillation.py:801` bounds what reaches the Card for the person with one sentence: would this
still be worth reading in a month? It gives two examples. `I work at Simform Solutions` passes.
`I am tired today` does not.

`I like threptin biscuits` is true in a month. So is `My favourite color is red`. Both should
pass. The filing model read both as small talk and wrote neither.

The live rows either side of this already exist and both hold: `L124` is two durable facts about
the person and `L126` is a passing mood. Nothing in the bundle sat between them until `L300` and
`L301` were added.

**This is the main ticket of the map.** It reproduces at **11 of 15** on `claude-haiku-4-5` and
**0 of 3** on `claude-opus-5`, which filed `extend -> Me` every time. Full table in
[../finding.md](../finding.md).

Per ADR 0003, two tiers of model, filing runs on the cheap tier, so only that tier failing means
the prompt is too thin to carry the rule rather than that the rule is wrong. The stronger model
reading the same prompt correctly is the evidence that the rule itself is sound and the wording
is what fails. Do not read the opus column as a fix.

Questions to settle:

- Is a preference durable? Argue it rather than assume it. A favourite biscuit is true next month
  and it is also the kind of line that, a hundred of them deep, makes a Card nobody reads. "True
  in a month" and "worth reading in a month" are not the same test, and the prompt says the
  second while the examples read like the first.
- If the answer is yes, what wording makes the cheap tier agree? Per ADR 0003, two tiers of
  model, filing runs on `claude-haiku-4-5`, so a rate that only improves on a stronger model is
  not a fix. The comparison column in the finding says which kind of defect this is.
- Is "durable" even the right axis? A preference and a phone number are both durable and they are
  not alike. Name the axis properly, and if it is a new word, it goes in `CONTEXT.md`.

Do not widen the test into "write everything". The map's Notes hold that as a standing
preference, and `L126` asserts it.

Resolve by giving the prompt wording and the measured rate it produces on the filing tier.

## Answer

Settled in a grilling session on 2026-09-21, with `/mattpocock-skills:domain-modeling`. Written up
as ADR 0047, the Card for the person holds what stands, however small.

**Yes, a preference is durable, and "durable" was the wrong axis.**

The old sentence carried two tests. One asks about time, is this still true next month. The other
asks about worth, would you gain anything by reading it. Both prompt examples are decided by the
first, so the cheap tier learns the first and is then asked the second. A favourite biscuit passes
time and loses worth.

Neither obvious axis survives a second example. Truth fails, because `the traffic was awful today`
is permanently true as a past event. Worth fails, because it is the test that just dropped 11 of
15. **The axis is standing**: does the claim say how things stand for the person, or only what
happened or how they felt at one moment. A job, a habit, a taste, a preference, a size and a
measurement all stand. A mood expires. A thing that happened is not a fact about the person at all.

The bundle already encoded this and the prompt did not. `L153` and `L154` in
`harness/live/scenarios_p10_7_india.py` are a mood and a standing habit in nearly the same words,
and the comment on the pair says the separators are `aaj` and `har`, today and every. That is
standing.

### What landed in this session

- **`memark/distillation.py`**, the bullet that was at line 801, rewritten. It names the axis, says
  a preference stands and gets an edit on `Me`, keeps the mood clause `L126` and `L153` assert, keeps
  the measurement clause, and ends with the sentence that attacks the actual failure: small is not
  the same as passing.
- **`CONTEXT.md`**, a new **Durability Test** entry. The term was used by this map and five harness
  files and defined nowhere. Its `_Avoid_` list names worth, importance and significance, because
  those are the reading that failed.
- **`docs/adr/0047-the-card-for-the-person-holds-what-stands-however-small.md`**.

### The decisions behind it

- **A preference lands under `Facts`.** `person` allows `Facts` and `Tasks`. A new `Preferences`
  heading was refused: it opens the ask path on every run until the person says yes, "preference" is
  already in the **Standing Rule** entry's `_Avoid_` list in `CONTEXT.md`, and redesigning Card
  sections is out of scope for this map.
- **Card bloat is accepted, not solved.** Naming the axis standing widens what passes on purpose. No
  cap and no second section: a control built now would be tuned against a Vault nobody has filled.
  The risk is written into ADR 0047 so the next reader finds a reason and not an oversight.
- **Only the bullet for the person changed.** The null-subject bullet runs the same test in its own
  words and nothing has failed there. The prompt now says the test two ways. Known wart, recorded,
  not fixed, because changing it puts every null-subject row at risk for a defect nobody measured.
- **The examples in the prompt are not the test's own words.** The draft used `I like threptin
  biscuits` and `My favourite color is red`, which are exactly what `L300` and `L301` send. A prompt
  carrying the test's words scores by recognition and the rate means nothing. The worked example in
  the prompt is `I do not eat onions`, which appears in no row.

### What this ticket does not carry

**The measured rate.** The wording is in the prompt and unmeasured, so the thing the ticket asked to
be resolved with is not here. It was split in two on purpose, because the measurement is open work
and an answer section is not where open work lives.

- **Ticket 06** runs it. Bar agreed in this session: **0 of 15** on `claude-haiku-4-5`, in
  `claude-cli` mode so the before number (11 of 15) compares directly, with `L126`, `L153` and
  `L154` held as no-regression rows.
- **Ticket 07** acts on whatever 06 says.

If the cheap tier still drops the thought, the wording changes again. No measured rate makes a
dropped preference the right answer, which is why ADR 0047 was written before the number exists.
