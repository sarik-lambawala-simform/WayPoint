# Research: sources for moving festival dates

Map: [map.md](../map.md)
Type: research
Status: resolved

## Question

The Date File model (ADR 0011) has exactly two shapes: recurring on a fixed day of the year
(`dates/recurring/MM-DD.md`) and one-shot on a specific date (`dates/YYYY/YYYY-MM-DD.md`). A festival
that moves every year — Rakshabandhan, Diwali, Holi and the rest of the Hindu lunar calendar — is
neither. Today it would have to be entered by hand every year, and the year it is forgotten is the year
it is missed. That is precisely the failure this system exists to prevent.

Establish the facts:

- **Computation.** Which Python libraries compute Hindu lunisolar festival dates, and how well
  maintained and accurate are they? Look at least at `convertdate`, `hindu-calendar` /
  `drik-panchanga`-style implementations, and anything based on Swiss Ephemeris. Note licence,
  maintenance status, and whether they need network access (the spec requires everything work with only
  outbound connections, and ideally none).
- **Regional variance.** Whether a festival's date depends on region or tradition, and whether these
  libraries expose that or silently pick one. A date that is right for someone else's family and wrong
  for yours is worse than no date.
- **Published lists.** Whether an authoritative multi-year table exists that could simply be checked
  into the Vault, and how far ahead it reaches. A static list may beat a library outright here.
- **Scope of need.** Whether the same problem exists for anything else likely in this Vault — Islamic
  or Jewish calendar dates, Easter, and any date defined as "the third Monday of" rather than a fixed
  day.
- **Precedent.** How other reminder systems handle moving religious dates, and what they get wrong.

Write findings to `.scratch/memark-v1/research/moving-festival-dates.md` and link it here. State
plainly where accuracy could not be verified — an unverifiable date source is a finding, not a gap.

## Answer

Findings: [research/moving-festival-dates.md](../research/moving-festival-dates.md)

**The astronomy was never the problem.** Swiss Ephemeris via `pyswisseph` runs fully offline with no
data files, locating the Moon to ~3 arcseconds — about five seconds of clock time at a tithi boundary.
What no library solves is the **rule that turns a tithi into a civil day**: which part of the day the
tithi must occupy, what happens when it spans two sunrises or none, and which text arbitrates.
Traditions answer differently, the answers disagree by **exactly one day**, and one day is the entire
error this system cares about.

**Rolling our own rule fails about one year in seven, silently.** The research implemented the naive
sunrise rule for Rakshabandhan over 2001–2035 and disagreed with published dates in **7 of 35 years**.
Two of those were an intercalary-month bug (wrong by a *month*, picking the adhika Shravana over the
nija one). The other five are a genuine doctrinal disagreement, off by one day — and two were checked
against Drik Panchang, which sided against the naive rule both times. In 2032 the accepted day is one
on which Purnima does not exist at sunrise at all, so **any** sunrise-based rule must get it wrong.
Rakshabandhan is decided by the afternoon/Pradosha. By this ticket's own standard — a wrong date is
worse than no date — writing our own rule is disqualified.

**The obvious library is a trap past 2035.** `holidays` (MIT, active) is the only package that names
these festivals and installs cleanly, but its Hindu tables are hand-copied from timeanddate.com and
cover **2001–2035 only**. Past that it emits a `UserWarning` and returns a plausible-looking holiday
set with every Hindu festival silently absent. That is precisely the silent failure this system exists
to prevent, and it is one assertion away from being caught. Its one long-range table (a generic
`DIWALI_DATES` spanning 1901–2100) is uncited and **wrong by about a month in 5 of 35 sampled years**.
Long range is not the same as reliable.

`convertdate` does not solve this at all — solar Saka civil calendar only, no lunisolar support.
`jyotisha` + `adyatithi` is the only option that models the actual doctrine (it encodes the
kaala/priority rules, and quotes the Skanda Purana on avoiding Bhadra for Rakshabandhan), but it was
never executed — its dependency tree pulls in Flask, `astropy`, `scipy`, `pandas` and two chat-bot
libraries.

**A checked-in table has the properties this system already prizes:** plain markdown in the Vault,
correctable by hand like any other Date File line, no runtime dependency, no ephemeris, no silent
fallback, and each row able to carry its own provenance and a confirmed/estimated flag. Its cost is
that it expires, and the year it silently runs out is the year the system fails at the thing it was
built for — so any table needs a loud check, a year early, not a `UserWarning`.

**The other moving dates:** Jewish dates, Easter, and "the third Monday of" style rules are all exactly
solvable offline with no judgement calls. Islamic dates are genuinely unknowable in advance (they
depend on observation), and only Umm al-Qura estimates exist.

**Rakshabandhan's muhurat is safely ignorable for our purpose.** The rite has a tying window that can
fall late in the evening, but the driving use case is *posting a gift*, whose Notice Schedule fires days
or weeks out. The day is enough; the muhurat is noise. Worth recording as the one place the imprecision
is harmless.

### The central finding, and one caution about it

**No source was verified against the user's own tradition, and that cannot be closed by research.**
Every finding above compares sources to each other. Gujarat observed Diwali 2025 on 20 October and
Maharashtra on 21 October; which convention a given household follows is not a fact any library holds.
This is the finding rather than a gap — and it fits the Vault's existing shape exactly: only a human
creates a Review Date, and a date the agent believes it found is a Proposed Date until confirmed
(ADR 0012). Every library surveyed does the opposite and presents an estimate as a fact.

**Caution on the empirical test.** The research chose Ahmedabad coordinates and described the user's
tradition as Gujarati. Neither was given to it — both are the agent's own inference and neither is
established. Location genuinely changes the civil date, so the test demonstrates *that the rule is where
errors live*, and nothing about which date is right here. Establishing region and tradition is a
question for ticket 10, which is a conversation with the user.

Other unverified items, stated rather than glossed: `holidays`' tables were spot-checked in only three
years; timeanddate's own far range is unknown (403s past 2035); the IMD/PAC Rashtriya Panchang could not
be fetched at all; and no source was checked against a printed panchang, which is the artefact a family
would actually consult.
