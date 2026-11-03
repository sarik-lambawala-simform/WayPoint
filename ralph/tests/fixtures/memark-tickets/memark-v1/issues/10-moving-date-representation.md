# How a moving date is represented and refreshed

Map: [map.md](../map.md)
Type: grilling
Status: resolved
Blocked by: 09

## Question

Decide how a date that falls on a different day each year lives in the Vault, given ADR 0011's rule
that recurrence *is* which folder a file sits in rather than a field to compute with — a rule adopted
specifically so there is no recurrence arithmetic and no year-boundary case.

- Is a moving date resolved **ahead of time** into ordinary one-shot Date Files for the next N years —
  preserving ADR 0011 completely, at the cost of something having to write those files — or is a third
  kind of Date File introduced, at the cost of arithmetic in the selection path the spec insists must
  stay model-free and constant-cost?
- If resolved ahead: what writes them, and when? A yearly job is a new scheduled thing in a system with
  exactly one. The seeding skill could write ten years at once and the problem largely disappears —
  check whether that is genuinely sufficient or merely defers the failure to year eleven, silently.
- How the human states one in the first place. "Rakshabandhan — send Sonia a gift" names a festival, not
  a date. Does the agent recognise festival names, or is this only ever entered through the seeder?
- Whether a resolved-ahead line is distinguishable in the file from a hand-entered one-shot, so a
  regenerating job can replace its own lines without touching yours (this leans on ticket 02).
- What happens if a source revises a date after it was written — and whether a written date is ever
  refreshed or is authoritative once committed.
- Notice Schedules: a gift that must be posted needs different notice from a festival you attend. Does
  a moving date carry an ordinary schedule, or does anything change?
- Whether a missing or failed date source is visible. A festival that silently did not get written is
  exactly the silence the Health Canary exists to prevent.

Likely amends ADR 0011.

## Added by ticket 09's findings — do not skip these

- **First, establish region and tradition.** This is a question only the user can answer and everything
  else depends on it. Gujarat observed Diwali 2025 on 20 October and Maharashtra on 21 October; no
  library holds the fact of which convention a household follows. Ticket 09's research assumed Gujarat
  and Ahmedabad coordinates — neither was given to it, and neither is established. Ask, do not inherit
  that assumption.
- **Writing our own tithi-to-day rule is disqualified, not merely risky.** Ticket 09 measured a naive
  sunrise rule against published dates over 35 years and it was wrong in 7 of them — five by one day
  (doctrinal disagreement) and two by a whole month (intercalary-month handling). The ephemeris is
  accurate to about five seconds of clock time; the rule is where every error lives.
- **`holidays` fails silently past 2035.** It emits a `UserWarning` and returns a plausible holiday set
  with every Hindu festival quietly missing. Whatever this ticket chooses, the range boundary needs a
  loud, fail-closed check that fires **a year early** — because ADR 0016's notice windows require a date
  to exist in the Vault well over a festival-year before it fires. Detecting exhaustion on the day is
  detecting it too late.
- **Weigh a checked-in table seriously against a computed source.** A table is plain markdown in the
  Vault, hand-correctable like any other Date File line, has no runtime dependency, no ephemeris and no
  silent fallback, and each row can carry its own provenance and a confirmed/estimated flag. Its cost is
  that it expires and must be re-verified. Ticket 14 establishes whether a maintainable computed
  alternative exists at all.
- **The existing precedent in this system already fits.** A wrong date being worse than no date is the
  same asymmetry behind Proposed Dates and the Health Canary: mark it provisional and ask. Every library
  surveyed does the opposite and presents an estimate as a fact. Decide whether a generated festival
  date arrives as a confirmed Review Date or as a Proposed Date — noting that ticket 12 is separately
  deciding the same question for seeded dates, and the two answers should agree or differ on purpose.
- **Rakshabandhan's muhurat is safely ignorable here.** The tying window can fall late in the evening,
  but the use case is posting a gift and the Notice Schedule fires days or weeks out. Record it as
  known-and-ignored rather than leaving it to be rediscovered.
- **Scope check on other moving dates.** Jewish dates, Easter and "third Monday of" rules are exactly
  solvable offline with no judgement calls. Islamic dates are genuinely unknowable in advance. Decide
  whether any of these are in scope at all, or whether this ticket is Hindu-lunisolar only.

## Answer

**The system does not compute festival dates. It asks.**

No ephemeris, no library as an authority, no checked-in table to re-verify, and no computed
tithi-to-day rule. ADR 0011's two Date File shapes are preserved exactly — nothing is added to the
selection path, which stays model-free and constant-cost in the size of the Vault.

This follows the grain of a decision the system already made. Only a human creates a Review Date, and a
date the agent believes it found is a Proposed Date until confirmed, precisely because noticing a date
is the one step no code can guarantee. Ticket 09 established that a *moving* date has a second such
step — the rule turning a tithi into a civil day, which is doctrinal rather than computable, varies by
region and tradition, and is wrong by exactly one day when it is wrong. Every library surveyed presents
its answer as a fact. Asking is the honest version of the same mechanism.

### 1. Ask with a guess, degrading to a bare ask, with a bulk fill at seeding

- Where a source has a date in range, the agent **proposes** it and one tap confirms. In most years this
  is cheaper than looking it up.
- Where it does not — outside `holidays`' 2001–2035 range, or for anything unlisted — the same line
  arrives **with no date attached** and the human supplies it. The library's range cliff becomes
  harmless the moment its output is only a proposal: ticket 09's finding was that `holidays` fails
  *silently* past 2035, and a line that arrives asking cannot fail silently.
- The seeding interview ([12](12-seeding-interview.md)) takes an initial multi-year fill in one sitting,
  since it is already an evening of typing and pasting a festival table is cheap.

No branch of this has a year in which it silently produces nothing.

### 2. An undated recurring obligation lives as an approximate-day line in `dates/recurring/`

Rakshabandhan sits on a line in `dates/recurring/08-01.md` — an approximate day, which is a thing the
human knows for every festival that matters. It fires on the days its own Notice Schedule names, the
Digest asks, and the answer writes an ordinary one-shot Review Date into `dates/YYYY/`.

This needs **no new file, no new scheduled job, and no new selection logic** — it reuses the Notice
Schedule mechanism exactly as built. A once-a-year January "date review" was rejected: it asks for ten
dates on one evening, which is the kind of chore that gets postponed and then forgotten.

It does introduce a genuinely new *kind* of line — one whose job is to ask for a date rather than to
remind of one. Recorded in `CONTEXT.md` as a **Date Request**.

### 3. An unanswered Date Request keeps asking

It re-fires on every day its Notice Schedule names, which is already the default behaviour for anything
inert and unconfirmed. Named explicitly in the spec because this decision **moves** the risk rather than
removing it: a computed date can be silently wrong, and an asked-for date can be silently *absent* — you
skim the Digest, do not look it up, and the festival passes. The **Health Canary should count
outstanding Date Requests**, so an accumulating pile of unanswered ones is visible as a number rather
than as a Digest line you have learned to skip.

### Derived constraint: a Date Request needs two notice windows, not one

This falls out of the above and is easy to get wrong. A festival carries two schedules, and the first
must clear the second:

- The **Date Request's** own schedule, which decides when you are asked.
- The **resulting Review Date's** schedule, which decides when you are reminded — a posted gift wants
  something like `30d, 7d..0d`.

So the Request must fire early enough that the date it produces still has room for its own full notice
window, plus slack for the days you do not reply. ADR 0016 caps the forward window at 366 days, which is
the ceiling. Concretely: asking on 1 August for a festival in late August leaves no room for a
thirty-day gift notice — the Request has to sit months ahead of the approximate day, not just before it.
Getting this wrong produces a Request answered too late to act on, which looks like the system working.

### Left open deliberately

- **Who creates a Date Request line.** The seeder plainly does, for festivals named during the
  interview. Whether a Capture mentioning a festival can also propose one is undecided and is a smaller
  question than it looks, since it is the ordinary Proposed Date path.
- **Which non-Hindu moving-date families are in scope.** Ticket 09 established that Jewish dates, Easter
  and nth-weekday rules are exactly solvable offline, and Islamic dates are genuinely unknowable in
  advance. Whether any belong in v1 is recorded on the map as fog rather than decided here — the Date
  Request mechanism handles all of them without caring which.
