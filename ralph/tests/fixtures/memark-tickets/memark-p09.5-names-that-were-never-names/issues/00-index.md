# Phase 9.5 issues

Two defects, from a second live-model bundle over phase 9. Both are about the miss line, the one
sentence story 75 put above every answer to say what the box does not know.

The pass ran in `claude-cli` mode, so filing and judgement both went through the local Claude Code
CLI and every call carried its system prompt too. See [../spec.md](../spec.md) for what that is
worth and what it is not. Ticket 02 did not care when it was filed, because the miss line was
computed in code. Its fix moved the line onto a model, so it cares now and it was measured.

| # | Ticket | Status | Blocked by | Reproduces on the judgement tier |
| - | ------ | ------ | ---------- | -------------------------------- |
| 01 | [Which capitalised words are names](../../memark-p09.6-decisions-only-you-can-make/issues/01-which-capitalised-words-are-names.md) | moved to phase 9.6, ticket 01, and resolved there | none | n/a, it is a decision |
| 02 | [The miss line names a word that was never a name](02-the-miss-line-names-a-word-that-was-never-a-name.md) | completed | none, 01 was resolved | was 5 of 5 on `claude-sonnet-5`, 1 of 1 on `claude-opus-5`, and flat at the function level; 0 of 5 on `claude-haiku-4-5` after the fix, and it is a real rate now |
| 03 | [The answer says the miss again in its own words](03-the-answer-says-the-miss-again-in-its-own-words.md) | completed | none | was 5 of 5 on `claude-sonnet-5` for one unknown name and 2 and 3 of 5 for three; 0 of 5 on all four rows after the fix |

### Ticket 02, measured after

The capital rule is gone and the subjects come from the Intent Read, so this dimension moved off
code and onto the cheap tier, which is where ADR 0032's amendment put the reading. That is a model
the prompt now has to carry, so it was measured on it. Five runs each in `claude-cli` mode:

| scenario | what it measures | reproduced |
| -------- | ---------------- | ---------- |
| `L93` | the false miss: `ABT` named as a subject | 0 of 5 on `claude-haiku-4-5` |
| `L97` | the silent stranger: `jignesh` left off the subjects | 0 of 5 on `claude-haiku-4-5` |

`L97` is new and it is the hole the same decision closed: a stranger typed in small letters used to
be answered around in silence. The two rows pull against each other on purpose, because no rule
over letters can pass both.

Measured with `python -m harness.live.repeat L93 L97 --runs 5`. `L80`, `L82`, `L91`, `L92`, `L93`,
`L94` and `L97` then passed their hard checks on the same model, 7 of 7.

`L93`'s miss line was printed rather than asserted because the old rule made it unpredictable.
Here is what it prints now, which is nothing:

> Recorded: ?WAT DID BHAVESH SAY ABT THE RENT
>
> He wants three thousand more rent starting in October. His reason is that society maintenance
> has gone up. That's from what he told you back on 24 August.
>
> From: Bhavesh (landlord), your note from 24 Aug 2026

The reading named `bhavesh` and the rent, both of which reach something, so there is no line above
the answer. `L97` on the same model prints the line the other way round:

> Recorded: ?what did jignesh decide about the rent
>
> I have nothing on jignesh.
>
> The notes have Bhavesh telling you on 24 August that he wants three thousand more rent starting
> in October, and saying society maintenance has gone up. That's all your notes hold on the rent.
>
> From: Bhavesh (landlord), your note from 24 Aug 2026

So `L93`'s assertions are no longer the loosest in the bundle. It asserts `NO_MISS_LINE` like any
other row that must claim nothing missing.

### Ticket 03, measured before and after

Both households, both shapes, five runs each on `claude-sonnet-5`, the tier ADR 0003 puts on the
answering call. Anyone editing the answering prompt again should re-run these four rows: this table
is what turns a return of the defect into a caught regression rather than a rediscovery.

| scenario | household | shape | before | after |
| -------- | --------- | ----- | ------ | ----- |
| `L91` | Indian | one stranger | 5 of 5 | 0 of 5 |
| `L73` | baseline | one stranger | 5 of 5 | 0 of 5 |
| `L80` | Indian | three strangers | 2 of 5 | 0 of 5 |
| `L62` | baseline | three strangers | 3 of 5 | 0 of 5 |

Measured with `python -m harness.live.repeat L91 L73 --runs 5` and
`python -m harness.live.repeat L80 L62 --runs 5`.

Ticket 03 blocks nothing and went first. Ticket 02 waited on the decision that was ticket 01 here
and is now ticket 01 of phase 9.6, because the rule that replaces the capital is a decision about
which words are names and an agent must not answer its own side of a grilling.

**That decision landed and it did not pick from the options on the table.** The capital rule was
removed rather than narrowed, and the subjects come from the Intent Read instead. So ticket 02 was
a larger job than it was written as: it reached `intent.py`, `handler.py` and `answering.py` and
not only `lookup.py`. It also left the bundle one row wider, because the same decision closed a
hole nothing had a row for.

## Where this bundle came from

`harness/live/scenarios_p09_india.py`, rows `L74` to `L96`, and the fixtures
`an-indian-household`, `two-nikhils`, `dated-lines-in-an-indian-window`,
`an-indian-festival-on-record` and `an-indian-window-past-the-block-cap`.

Phase 9 is a phase about matching, and matching is where a Vault's own language shows. The `L56` to
`L73` rows answer it on a Vault of Wife, Priya and a kitchen refit. These rows answer the same
phase on a Vault of Mummy in Rajkot, Nikhil at work, Bhavesh the landlord, a flat being shifted and
a society NOC. Every assertion is imported from the older module, so both households are held to
one rule set and a change that loosens one loosens both visibly.

**The 23 messages were written by an agent, not by the Vault's owner**, at the owner's own request.
Phase 9's ticket 13 says why that is second best. Ticket 02's own rate could move on a set of real
messages, and so could ticket 03's. Ticket 03's rate on the baseline household is what makes it
solid anyway: `L73` is 5 of 5 on messages written for the other Vault. Ticket 02's two rows are
`ABT` and a name in small letters, and neither of those is a shape an agent invented.

## What the pass proved works

A fix to either prompt could break any of this, and nobody catches that regression unless somebody
wrote down that it worked. All 23 rows pass their hard checks. What is below is what the replies
were actually read for.

**A Hinglish question in Gujarati word order reaches the right Card.**
`?mumma ki tablet ka kya bola dr mehta ne` resolved through the `mumma` alias, with no capital
anywhere in the message and the verb at the end:

> Dr Mehta changed her tablet at the checkup on 12 August, when her bp was 150 over 90. Your notes
> don't say which tablet it was or what else he told her.

**An alias that contains the Card's own name reaches the row by the alias.** `nikhilbhai` carries
`nikhil` inside it. A matcher without word boundaries would have reached the row by a term the
message never wrote and looked right doing it. It reached it by `nikhilbhai`.

**One first name on two rows is asked about rather than guessed at.** `nikhil ne kya bola?` came
back with "I have more than one nikhil: Nikhil (Simform) or Nikhil (cousin). Which one did you
mean?", and it cost no call. A cousin and a colleague share a first name far more often than they
share a full one, so this is the ordinary case and not the edge one.

**A phone typo is read back with what was meant.** `?what did Nikil say` came back with "I have
nothing under Nikil. Did you mean Nikhil (Simform)?" and cost nothing.

**A festival that moves every year is found from the Vault's own record.** Ganesh Chaturthi fell on
27 August 2025 in this fixture and no table in this box holds that. The answer named the day, said
it was a day the person had confirmed, and cited both the notes and the Date File.

**A festival with only a rejected line is not on record.** Raksha Bandhan is named in a rejected
proposal. The reply said "I have no Raksha Bandhan on record for 2026 or any year before it" and
cost no call. A turned-down proposal is not a record of a day.

**A proposal is not read as a plan.** A window holding a confirmed line, a handled one, a proposal
and a refusal came back as: NOC signed, token amount paid and done, "Two things came up but were
never set: booking a tempo for the shifting, which you never confirmed, and a griha pravesh puja at
the new flat, which you turned down."

**The cut in a wide window is stated.** 41 notes in the range, 40 read, and the sources line ended
`(read 40 of the 41 notes in that window)`. The one note the question actually reached, on the
15th, was among the 40.

**A named subject the ranking puts nowhere is read because it was named, and the absence is
honest.** `?what did Mummy say about the society noc` came back with "The notes don't have Mummy
saying anything about the society noc", then said what the notes do hold about the NOC. This is the
row where a weaker box invents.

**A correction is preferred and the correction is explained.** `?when is nikhil's last working day`
came back with "The fourth. He'd told the team on the eighteenth that it was the eleventh, but on
the twenty-fourth you noted it was actually the fourth, not the eleventh." Both the claim and its
correction were handed over, which was the point of the row, and the answer picked the newer and
said so.

**Two known subjects in one sentence are two Cards and no question back.**
`?what did bhavesh and nikhilbhai both say about october` came back with "Only Bhavesh said
anything about October", cited both Cards, and asked nothing.

**The budget is said once and then goes quiet.** Three Questions against a cap of one bought
exactly one call. The cap was announced once. The third Question kept its ordinary echo, no answer,
no miss line and no sources line.

**Every source named is a real file.** 15 sources lines, 45 cited sources, all 45 resolve: 9 Card
citations to files under `people/`, `projects/` and `areas/`, 34 `your note from` citations to
inbox files, and 2 `your dates for` citations to Date Files.

## What was checked and is not a defect

**A sources line naming a Card the answer did not quote.** `L79` cited `Bhavesh (landlord)`
alongside `Mummy` and `Society Paperwork`, and said nothing from Bhavesh. The sources line names
what was read and not what was used, per ADR 0028's amendment, so this is correct. Worth writing
down because it looks wrong on first reading.

**An open Task appearing in an answer.** `L92` and `L95` both mentioned the open reminder to ask
whether Mummy's new tablet is suiting her. ADR 0034 hides closed Tasks from an answering call and
says nothing about open ones. An open errand is live and belongs in the answer.
