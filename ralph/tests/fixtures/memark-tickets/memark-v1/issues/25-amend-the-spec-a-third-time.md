# Amend the spec a third time, for recurrence and the alias verb

Map: [map.md](../map.md)
Type: task
Status: resolved
Blocked by: 24, 26

## Question

The third destination. Nothing to decide here — this ticket executes the write-up once
[ticket 24](24-sub-yearly-recurrence.md) is resolved.

[Ticket 13](13-amend-the-spec.md) did this for the first round and [ticket 23](23-amend-the-spec-again.md)
for the second. Neither is reopened: each was correct for the effort it closed, and its record of what
changed and why should stay readable.

**What makes this pass different from both.** Ticket 13 folded in additions. Ticket 23 folded in a
constraint that withdrew answers the spec already gave. This one folds in **a reversal of a decision that
currently reads as settled.** ADR 0011 says recurrence is which folder a file is in, and ticket 24 exists
because that sentence cannot express "every month". Whatever ticket 24 decides, the danger in this pass is
burying the change inside a document that will still read as though ADR 0011 were untouched. A reader six
months from now must be able to see that the rule changed, and why.

There is also a second, smaller body of work that arrived outside the ticket sequence, described below.
It is folded in here rather than given its own ticket because it is two paragraphs of consistency work,
not a decision.

## The work: recurrence

- **Fold ticket 24's resolution into `.scratch/memark-v1/spec.md`**, following its own conventions:
  existing stories keep their numbers, new stories append after the highest in use (currently 124), and a
  story whose promise changed is amended in place rather than renumbered. **Story 36 is the one to watch**
  — it currently promises yearly recurrence and nothing else, and it is the story this whole ticket
  exists because of.
- **Write the ADR rather than amending ADR 0011 in place.** ADR 0011's argument is sound for what it
  decided and its costs section is honest. If recurrence stops being purely a folder, that is a new
  decision with its own trade, and it should cite ADR 0011 and say what it takes back. Amending 0011 in
  place would hide a reversal inside prose that reads as settled. ADR 0016 and ADR 0020 likely need
  amendment notes rather than rewrites, depending on the shape chosen.
- **Sweep for "yearly" as an unstated assumption.** It is load-bearing in more places than the two
  folders. At minimum: the 366-day forward window and the "at most 366 small files" bound that pays for
  it, the leap-day rule, the seeding interview's questions, the worked example, and the Digest volume
  argument. Each occurrence is now either still true, or a limit to restate.
- **Re-read `skip` end to end.** If ticket 24 gives it the job of setting the next date, it stops being a
  verb that changes nothing, and its entry in the Commands list, its Handled definition in `CONTEXT.md`,
  and the act-or-ask test in the message-arrival section all describe a verb that no longer exists.
- **Check the First Loop.** The rule is that a part is only in the First Loop if its whole loop closes.
  For recurrence that means: created by talking, fires, you say you did the thing, it returns at the right
  time, and the interval can be changed later. If any link is missing, the spec says so and names who
  fixes it, rather than shipping the half that works.
- **Re-read the Digest volume argument.** Frequent reminders may force priority tiers out of Out of Scope
  and into v1. If ticket 24 concludes that, Out of Scope loses an entry and ADR 0038 gains an amendment.
- **Extend Testing Decisions** in the existing style, driven through the single seam and asserting on
  files, commits and outbound messages only. The cases this implies include: a sub-yearly line firing
  twice in one window, the same line after the restart verb is sent, the same line after it is never
  sent, a sub-yearly occurrence missed while the box was off, and the interaction with the Notice
  Schedule.
- **Update Out of Scope and the Health Canary** with whatever ticket 24 leaves out or adds a count for.

## The work: the alias verb, already written and needing its edges closed

The `alias` verb and the Proposed Alias it raises were added to the spec outside the ticket sequence,
while answering a question about two people called Priya. The spec text is written and consistent. Three
edges are not:

- **ADR 0026 holds the closed list of `pending::` values** and has no entry for an alias. Until it does,
  the Pending Instruction the verb writes has an action code nothing recognises, which by that ADR's own
  rule means a run leaves it alone and counts it on the Health Canary. Add the value.
- **`CONTEXT.md` needs a Proposed Alias entry**, beside Proposed Date and Proposed Heading. Note that
  [ticket 12](12-seeding-interview.md) concluded "no new term, an alias is a property of a Card". That
  was right then and is wrong now: an alias that must be confirmed is a thing the Digest asks about, which
  is a term. Say so rather than quietly contradicting it.
- **`CONTEXT.md`'s Handled entry** says a skipped Review Date "comes back untouched at its next
  recurrence". That phrasing reads as though several kinds of recurrence exist. Today only yearly does,
  and after ticket 24 something else will. Either way the sentence is currently misleading and is the
  wording that hid the gap ticket 24 found. Make it say something true.

## The work: flow-docs

The atlas is generated from a master doc and published as an Artifact. It is not optional cleanup: it is
the only rendering of this system anyone actually reads end to end, and a spec change that does not reach
it leaves a confident, wrong picture in the place people look first. Ticket 24's gap was found *because*
a diagram stated the rule plainly enough to be tested against a real question.

- **Master doc**: `flow-docs/diagrams/memark-v1-flowchart.md`. Regenerate the page with `build-page.mjs`,
  validate with `validate-mermaid.mjs` until it reports 0 failed, then republish. Do not publish a second
  artifact: see the URL hazard below.
- **The diagrams recurrence lands on**, at minimum: D11 (the `skip N` node currently says "Stops firing
  this run-up, returns next year", which is the sentence that exposed the gap), D16 (what is due today),
  D21 (life of a Review Date), D23 (where everything lives, which draws the two date folders), and D24
  (anatomy of one line, if the line grammar gains a field).
- **Check the front matter facts line** — diagram count, layer count, and the spec's line count, which is
  stamped there and goes stale on every amendment.

### The rename is done, and the URL survived it

The effort was renamed from `second-mind` to `memark` mid-flight, and a later session completed it:
the master doc's `title:` and `source:` fields, the page filename, and the diagram store's slug are all
`memark` now, and the atlas was republished to the same URL rather than claiming a new one. Nothing here
is outstanding. It is recorded only so that this ticket is not read as still owing it.

**The standing hazard it leaves behind.** The page file is `flow-docs/memark-atlas.html` and the atlas
lives at `https://claude.ai/code/artifact/5f3beb1f-b134-4308-b311-8dcfd44fc6b5`. Publishing that file
from a session that did not itself publish it **claims a new artifact URL** unless the existing URL is
passed explicitly. Two atlases, with the shared link pointing at the stale one, and nothing errors to say
so. Pass the URL.

## The work: how a typed Command is recognised

From [ticket 26](26-a-standard-for-the-command-set.md), resolved. It found no standard to adopt and a
spec gap instead, and **ADR 0041** is already written. What the spec still owes:

1. **Write the pattern down.** The "What happens when a message arrives" section says the strict check
   runs "with its strict pattern unchanged" and never says what the pattern is. Replace that with the
   rule from ADR 0041: a typed Command is a Command only if the verb is one of the nine, the arity
   matches, the number is an item in the relevant Digest footer, that item is the right kind for the
   verb, and a `pick` name matches exactly one Registry row.
2. **State the fall-through.** A message that fails any part **was never a Command**. It is not refused
   and not reported as a bad Command. It goes to the Intent Read like any other sentence. The old
   behaviour lost the errand in `pick 2 apples from market tomorrow`; the new one does not.
3. **One Command per line, all or nothing.** Every line must be a fully resolving Command or the whole
   message takes the Intent Read path. Same-line batching is refused, because `pick` carries an open
   name tail and `pick 3 cousin done 5` cannot be split without guessing.
4. **`catchup` asks before it acts.** The three no-number verbs resolve nothing, so ADR 0041's rule does
   not reach them. `unpark` and `undo` still fire on sight. `catchup` writes Journal Entries and ADR 0027
   freezes an entry once written, so it takes the confirmation path ADR 0032's own test sends it to.
5. **`/start` is a Transport handshake.** Telegram sends it when a chat is first opened. Code answers
   with a fixed greeting, writes nothing to the inbox, and makes no model call. It is not a Command and
   not a Capture, and it is the only slash the system knows. No leading `/` is accepted on a Command,
   required or optional.
6. **Reference ADR 0041 beside ADR 0032** wherever the strict check is described, including the story 51
   and story 52 discussion.

`CONTEXT.md`'s **Command** entry is already amended by ticket 26 and needs no further edit.

## Done when

The spec, the ADRs, `CONTEXT.md` and the published atlas all say the same thing about recurrence and
about how a typed Command is recognised, and a reader who starts at any one of them reaches the same
answer about what happens when you say you got a haircut, and about what happens when you say `pick 2
apples from market tomorrow`. The map's Decisions-so-far carries a one-line pointer for tickets 24, 25
and 26.

## Answer

Written. The spec, the ADRs, `CONTEXT.md` and the published atlas now give the same answer about
recurrence and about how a typed Command is recognised.

### New and amended ADRs

**ADR 0042, a repeating Review Date carries its rule on the line.** Written as its own decision rather
than as an edit to ADR 0011, for the reason this ticket opened with: amending 0011 in place would bury a
reversal inside prose that reads as settled. It states plainly that ADR 0011's guarantee of at most 366
files is **lost**, and that the folded design is nonetheless cheaper, because the 366-day window already
forced every file in that folder to be read every night.

Five existing ADRs gained amendment notes rather than rewrites:

| ADR | What the note says |
| --- | --- |
| 0011 | The reversal itself, named as one, with the three properties scored: no scanning holds, no arithmetic is partly reversed, the bound is lost. |
| 0016 | The rule is untouched. The window now reads one file and expands rules; `5d..0d` stays the one-shot default and a repeating line defaults to `0d`. |
| 0020 | Why `reads::` is an allowed second representation, on four grounds together, and that elapsed-since-last is refused for exactly the reason this ADR exists. |
| 0026 | Three new Date File keys (`repeat::`, `reads::`, `since::`), `handled::` changing what its value means, and two new action codes. |
| 0001 | The `dates/recurring/MM-DD.md` exemption from the nesting rule now exempts a folder that no longer exists. |

ADR 0038 needed nothing. The Digest-volume worry came from the `5d..0d` default rather than from
repetition, and at `0d` ten repeating reminders are a longer Digest rather than a noisy one, so tiers
stay in v1.1 and Out of Scope loses no entry.

### The spec

**Story 36 amended in place**, from yearly-only to a rule stated in ordinary words. Nine new stories
append at **125 to 133**: six for repeating rules and three for Command recognition.

The Date Files section was rewritten rather than patched: two examples where there was one, the rule as a
field, `since::`, `COUNT` stored as `UNTIL`, the leap day as the one special case, a time of day as text
nothing schedules on, the `reads::` field and what it is for, the confirming tap, the three questions the
bot asks and the ones it does not, `UNTIL` as the way to stop, both guards against a rule that fires on
no day, and the ADR 0011 scorecard.

**The yearly sweep reached everything the ticket named and one thing it did not.** The Vault layout, the
selection cost paragraph, ADR 0016's window, the leap-day rule, the seeding interview's question order and
its date-writing paragraph, the Digest's "track it yearly?", the ADR 0022 collapsing paragraph (which now
carries a count for a repeating line), the worked example end to end, the First Loop, build order step 5,
the Health Canary, Out of Scope and Testing Decisions. `dates/recurring/MM-DD.md` appears nowhere in the
spec any more except where the reversal is being described.

**`skip` was re-read end to end and it survives unchanged**, because only the fixed-anchor shape ships.
What changed is storage, not the verb: `handled::` now names the occurrence it dealt with rather than the
day you spoke, and nothing is ever cleared. That deletes the sentence this ticket flagged.

**The First Loop closes.** Created by talking with a confirming tap, fired by expansion, muted for one
occurrence, returning by construction, changed later by talking with the same tap. Nothing in that chain
is a stub, so it is in rather than named as a gap.

### One edge the resolutions did not settle

Ticket 24 requires a confirming tap on any repeating rule. The spec separately applies a date you stated
literally at once. The worked example is exactly that collision: "priya's birthday is actually the 21st".

Decided here **mechanically rather than by judgement**, because a judgement call in code is the thing this
spec keeps refusing: **any write or change of a `repeat::` value takes the tap**, and `notice::` or
`tier::` on the same line does not. The tap is about the translation into a rule rather than about the
day, which is why a stated date does not exempt it. **The tap lives in the chat, on the bot's own reply,
not as a Digest item**, so the ask-path table gains a note naming its two chat-time asks rather than a
row. The worked example now shows the tap, and ADR 0042 records both the location and the test.

### The alias verb's three edges

- **ADR 0026 now holds `propose-alias`**, taking the closed list to fifteen. This was a live bug rather
  than an untidiness: without a code on that list, the run would have met an action it does not
  recognise, left it alone and counted it, by that ADR's own closing rule. The verb would have done
  nothing at all, quietly, forever.
- **`CONTEXT.md` gains a Proposed Alias entry**, which says outright that [ticket 12](12-seeding-interview.md)'s
  "no new term, an alias is a property of a Card" was right while an alias was only ever typed in by hand
  and is wrong now, rather than quietly contradicting it.
- **`CONTEXT.md`'s Handled entry** no longer says a skipped date "comes back untouched at its next
  recurrence". It names the occurrence, says nothing is ever cleared, and says why the old phrasing was
  the wording that hid the gap ticket 24 found.

`CONTEXT.md`'s Review Date and Date File entries were also rewritten: two homes rather than "the only
place a date lives", and a date folder that holds one file named after no day.

### How a typed Command is recognised

All six items the ticket listed, in the "What happens when a message arrives" section. The five-part
resolution rule replaces "its strict pattern unchanged", with the worked-example table from ADR 0041, the
fall-through stated as "it was never a Command" rather than a refusal, the one-per-line all-or-nothing
rule, why anchoring to the whole message does not work, classification depending on Vault state, no
sigil, and `/start` as a Transport handshake. `catchup` asks; `unpark` and `undo` do not. ADR 0041 is
cited beside ADR 0032 in the guards paragraph, the Commands list, the Solution section, the v1.1
conversation paragraph, and the story 51 and 52 discussion.

### Testing Decisions

Two new blocks in the existing style, driven through the single seam and asserting on files, commits and
outbound messages only. Recurrence has fourteen cases plus two through the message handler, and they
cover every case this ticket asked for: a sub-yearly line firing twice in one window, the same line after
`skip` and after `skip` is never sent, an occurrence missed while the box was off, and the interaction
with the Notice Schedule at both `0d` and `3d..0d`. Command recognition has thirteen, including
`pick 2 apples from market tomorrow` asserting it is **not** refused and the errand lands.

### flow-docs

The master doc is `flow-docs/diagrams/memark-v1-flowchart.md`. Fourteen diagrams changed rather than the
five the ticket named at minimum: **D2, D4, D5, D7, D10, D11, D16, D17, D19, D21, D22, D23, D24** and
D27's build step, plus the front matter and the notes section.

D11's `skip N` node no longer says "returns next year", and the diagram gained two resolution gates with
a fall-through edge to the Intent Read. D16 reads one file and expands rules, and its "What it means"
states the lost bound rather than repeating the old guarantee. D21's state diagram gained an
awaiting-the-tap state and a spent state. D23 draws one file where it drew a folder. D24's field table
gained three keys and `handled::` changed meaning. The day's story now carries the tap as a beat at
21:14:20, threaded through every diagram that walks it.

Front matter: **3,393 lines and 42 ADRs**, up from 3,062 and 40. Validated at **0 failed** across 33
blocks, rebuilt with `build-page.mjs`, and **republished to
`https://claude.ai/code/artifact/5f3beb1f-b134-4308-b311-8dcfd44fc6b5` by passing the URL explicitly**,
so no second atlas was claimed. The standing hazard this ticket records is unchanged and still applies to
the next session.

### Done

The map's Decisions-so-far carries a pointer for tickets 24, 25 and 26. ADR 0042's two smaller
exclusions, scheduling on a time of day and telling "stop reminding me" from "delete that reminder", are
recorded in the map's Out of scope beside elapsed-since-last. Nothing was built, so all of this is a
document change and not a migration.
