# Is there a battle-tested format for the Command set, the way iCalendar is for recurrence

Map: [map.md](../map.md)
Type: grilling
Status: resolved

## Question

[Ticket 24](24-sub-yearly-recurrence.md) chose iCalendar's recurrence rule over a bespoke vocabulary,
on the grounds that the calendar is where the hard cases live and a battle-tested library already has
them right. The question this raises: does the same reasoning apply to the Command set?

Commands today are a verb and a number, invented here: `done 2`, `skip 3`, `pick 1`, `unpark`, `undo`,
`catchup`, and now the `alias` verb. Every one of them is a shape this project made up.

## The argument for looking

If a widely-used convention exists, adopting it means fewer decisions to get wrong, a vocabulary users
may already know from elsewhere, and prior art on the failure cases. That is exactly what ticket 24 got
from iCalendar, and the cost there was one restriction list and a readability field.

## The argument against, which needs testing rather than assuming

The two problems may not be alike. The risk in recurrence is in the calendar: leap years, ordinal
weekdays, month lengths, interval anchoring. There is genuine hidden complexity and a library removes it.

The risk in a Command is not in the verb. `done` has no edge cases. The risk is entirely in the number:
whether `2` still refers to what the sender thinks it does. ADR 0021 says code assigns the Digest's
numbers and ADR 0009 says writes are applied against recorded expected state, which is this project's
answer to that risk. No external standard would have supplied it, because no external standard is about
resolving a reference against a specific prior message.

If that reading is right, the answer is "no standard applies and the verb set stays as it is", and this
ticket closes cheaply. It should still be checked rather than asserted, which is why it is a ticket.

## Prior art worth checking before deciding

- **SMS keyword conventions.** `STOP`, `HELP`, `START` are genuinely mandated by carriers, which makes
  them the closest thing to a standard for a verb sent by message. Worth knowing whether `STOP` colliding
  with a Memark verb matters, given ADR 0006 puts everything on Telegram.
- **Chat slash commands.** Slack, Discord, IRC. A convention rather than a spec, but a strong one about
  shape: a leading `/`, a verb, then arguments.
- **Email-based command interfaces.** Mailing list `subscribe`/`unsubscribe`, and the plus-addressing
  and `List-Unsubscribe` header conventions.
- **Bot command grammars.** Telegram's own `/command` convention and its BotFather command registration,
  which is the platform this system runs on and therefore the one with a real cost to ignoring.

## Decide

1. Whether any of the above is a standard worth adopting, or only a convention worth borrowing a shape
   from per ADR 0008 (prior art is borrowed from, not adopted).
2. If a shape is borrowed, what it does to the existing verb set and to the rule that a Command carries
   no date and no tier.
3. Whether Telegram's own `/command` convention should be honoured, given ADR 0006 makes Telegram the
   only conversational surface, and whether that conflicts with the Intent Read turning ordinary talking
   into a Command per ADR 0032.
4. Whether the answer is "no change", which is a legitimate outcome and should be written down as one.

## Notes

Raised in the [ticket 24](24-sub-yearly-recurrence.md) grilling session, as a direct generalisation of
the choice made there. Consult `/grilling` and `/domain-modeling` per the map's standing note.

The likely answer is no change. Record it as a decision if so, because the next person to read
ticket 24's ADR will ask this same question and should find it already answered.

## Next

[Ticket 25](25-amend-the-spec-a-third-time.md) is blocked by this ticket as well as by ticket 24, so the
third spec amendment carries both answers.

## Answer

Resolved by grilling, four rounds. The ticket expected "no standard applies, no change". The first half
held. The second half did not: the search for a standard found a gap in the spec instead, and closing it
needs **ADR 0041**.

### 1. Is there a standard, or a dictionary of commands

**No dictionary of commands exists.** Nobody publishes a list of the verbs a message-driven assistant
might need. Slack and Discord let every bot invent its own set. SMS carrier keywords are real and
mandated, but they are `STOP`, `HELP` and `START`, they are about consent rather than work, and they
bind carriers rather than Telegram. Mailing list conventions and `List-Unsubscribe` solve leaving a
list, which this system has none of.

None of the four describes a verb that points at a numbered item in a previous message. That is the
whole of Memark's Command problem, so there was nothing to adopt.

**Standard vocabularies of task state do exist**, and they are the honest version of the coverage check
the ticket asked for. The nine verbs were read against them:

| Source | What it names | Maps to |
| --- | --- | --- |
| iCalendar `VTODO` status | `NEEDS-ACTION`, `COMPLETED`, `IN-PROCESS`, `CANCELLED` | `done` is `COMPLETED`. No `IN-PROCESS` |
| iCalendar `PARTSTAT` | `ACCEPTED`, `DECLINED`, `TENTATIVE`, `DELEGATED` | `yes` and `no` |
| IMAP message flags | `\Seen`, `\Answered`, `\Flagged`, `\Deleted` | `skip` is closest to `\Seen` |
| org-mode keywords | `TODO`, `DONE`, `WAITING`, `SOMEDAY`, `CANCELLED` | No `WAITING` |
| Taskwarrior | `done`, `delete`, `start`, `stop`, `modify`, `annotate`, `wait`, `undo` | No `start`, no `wait` |

`VTODO` has the strongest claim on us, because ticket 24 already put iCalendar's recurrence rule on a
Date File line, so it is the same specification.

**One gap: a Task that has been started, or is waiting on someone else.** No verb covers it. It is not
added in v1, and it is not really a Command question: a Task is a checkbox line in a Card, and there is
no heading for a started Task under ADR 0026. Recorded on the map as fog rather than decided here.

**The one piece of prior art that does solve the real problem was adopted before this ticket existed.**
A Command's risk is the number, not the verb, and resolving the number means knowing which message it
answers. That is the reply chain: invented by email, implemented by Telegram, used by ADR 0021 to pick
the Digest a Command concerns, and made a hard requirement of any Transport by ADR 0040.

### 2. The gap the search found

The spec says the strict Command check runs first "with its strict pattern unchanged". **It never writes
the pattern down**, and `CONTEXT.md` says only "a verb and a number". Nothing says whether a match must
be the whole message.

So `pick 2 apples from market tomorrow` has no defined behaviour. It matches `pick N <name>` with the
name `apples from market tomorrow`. The name resolves against no Registry row, so the Command changes
nothing. The message is still saved as a Capture. But step 1 has claimed the message, so **the Intent
Read never runs**, and the errand and the date are lost as actions.

The damage is a suppressed Intent Read, not a corrupt Vault. That makes it quiet, and quiet is the
expensive kind. It also cannot be fixed by anchoring the pattern to the whole message, because the
failing example is one line, and anchoring would kill sending more than one Command at a time.

### 3. The decision

**ADR 0041: a typed Command is recognised by what it resolves against.** ADR 0032's *exact match or
nothing* rule moves one step earlier, so it decides classification rather than only application.

- **A typed Command is a Command only if every part of it resolves.** The verb is one of the nine, the
  arity matches, the number is an item in the relevant Digest's footer, that item is the right kind for
  the verb, and a `pick` name matches exactly one Registry row. If any part fails, **it was never a
  Command**, and the message goes to the Intent Read like any other sentence. It is not refused.
- **More than one Command travels one per line, all or nothing.** Every line must be a fully resolving
  Command, or the whole message goes to the Intent Read. Same-line batching is rejected, because
  `pick` has an open name tail and `pick 3 cousin done 5` cannot be split without guessing.
- **No sigil.** A leading `/`, required or optional, was considered and dropped. Under the resolution
  rule it protects nothing. Telegram's `/start` is answered by code as a Transport handshake under
  ADR 0040, writes nothing to the inbox, and is the only slash the system knows.
- **`catchup` asks before it acts.** The three verbs taking no number resolve nothing, so the rule does
  not reach them. `undo` and `unpark` still fire on sight, being reversible and writing no permanent
  text. `catchup` writes Journal Entries, ADR 0027 freezes an entry once written, and ADR 0032's own
  test sends anything invisible after the fact to a confirmation.
- **Classification now depends on Vault state.** The same words are a Command while their Digest is live
  and an ordinary message afterwards. Stated in the ADR rather than left to be discovered.

Worked examples:

| Message | Before | After |
| --- | --- | --- |
| `done 2` | Command | Command, if item 2 is a Task |
| `pick 2 apples from market tomorrow` | Command, refused, Intent Read suppressed | Not a Command. Goes to the Intent Read |
| `undo 4` | Undefined | Not a Command. `undo` takes no number |
| `done 2 chapters today` | Undefined | Not a Command. `2 chapters today` is not a bare number |
| `skip 3` with two Digest items | Undefined | Not a Command. Item 3 is not in the footer |

### 4. What ticket 25 carries

- The pattern, written down at last, in the "What happens when a message arrives" section.
- The one-per-line all-or-nothing rule for more than one Command.
- `catchup` asks; `unpark` and `undo` do not.
- `/start` as a Transport handshake, not a Command and not a Capture.
- One sentence on the **Command** entry in `CONTEXT.md`, added by this ticket already.
- ADR 0041 referenced beside ADR 0032 wherever the strict check is described.
