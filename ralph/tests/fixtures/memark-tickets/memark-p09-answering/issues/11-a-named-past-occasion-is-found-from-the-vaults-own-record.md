# 11 — A named past occasion is found from the Vault's own record

**What to build:** "what happened at Diwali" is answered from the date I confirmed for Diwali, and
where I never confirmed one the bot says it has no such occasion on record rather than picking a day.

A named occasion resolves from the Vault's own record and never from a table of festivals. A confirmed
festival is an ordinary one-shot Review Date in a file named after its day, and code matches the line.
This falls out of ADR 0011, which decided that dates live in date-indexed files, and ADR 0012, which
decided that a proposed date is confirmed by the human. There is no second store of occasions to keep
in step.

Where no such line exists the bot says it has no such occasion on record for that year. Guessing a
date would produce a confident answer about a day I never marked, which is the failure mode this whole
phase is built against.

Only a plainly named occasion matched against a confirmed line is in scope. An occasion phrased loosely
is the Intent Read's job in phase 10.

**Blocked by:** 10 — Recall: a Date File line is described for what it is.

**Status:** completed

**Completed at:** 2026-09-08T22:15:35Z

- [ ] A named occasion with a confirmed one-shot Review Date line in a past year's Date File resolves
      to that day, and the day is then recalled as in ticket 08.
- [ ] A named occasion with no confirmed line makes the reply say it has none on record for that year.
- [ ] No list or table of festivals or occasions exists anywhere in the code or the config.
- [ ] A line still carrying `?` is not treated as a confirmed occasion.
- [ ] The occasion is matched by code, with no model call in the path that chooses the files.
