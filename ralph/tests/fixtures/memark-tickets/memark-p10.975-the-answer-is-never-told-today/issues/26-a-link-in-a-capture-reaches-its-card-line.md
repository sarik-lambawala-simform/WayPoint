# 26. A link in a Capture reaches its Card line

**Type:** task

**Status:** completed

**Blocked by:**

**What to build:** `Remind me to watch this video tomorrow:https://www.youtube.com/watch?v=qLfSDQ5NGh0`
files a Task on `Loose Ends` that holds the link. The Digest shows the link, so the person can open
it from the Digest.

## What happens today

Seen by hand on 2026-10-08 in the harness, Capture `^34ca`. The inbox kept the whole message. The
filing model wrote the Task as `watch this video` and dropped the URL. The Task cites `^34ca` in
`from::`, so the link can still be found by hand. The Digest line `1. watch this video` cannot be
acted on.

This is the second time. Phase p10.95 saw `L260` drop an IRCTC link and filed it as watched, because
it happened once. See `../../memark-p10.95-a-question-filed-and-never-answered/spec.md`, "A URL is
dropped".

The cause is the prompt rule in `memark/distillation.py` `INSTRUCTIONS`: "Keep the person's own words
where you can, and write one short line." Nothing tells the model to keep a link. Nothing in code
checks that it did. A short line is the easy way to obey the rule, and the URL is the longest word.

## What to change

Code keeps the link. A prompt line alone is not enough, because the model can still drop it.

- **Find the links.** A URL is a run that starts `http://` or `https://` and ends at whitespace.
  Find them in each source Capture's raw words. Do not split the URL off the word before it:
  `tomorrow:https://...` holds the URL `https://...`.
- **Find the edits each link belongs to.** When the answer has a partition, a link belongs to the
  edits its piece names. With no usable partition, it belongs to every edit whose `sources` cite the
  Capture.
- **Add a missing link.** When none of those edits has the URL in its `text`, code adds it to the end
  of one of them: the first Task, else the first edit. Add it as ` <url>`, after one space. Log one
  line that names the block id and the URL.
- **Change nothing else.** A link that one edit already holds is left alone. A Capture with no
  edits is not touched. A `skip` piece's link is not added. A dated edit is a line too, so the same
  rule covers it.
- **The prompt.** Add one rule beside "Keep the person's own words": copy every link exactly, whole,
  into the line it belongs to. Code is still the check.
- Write an ADR for the rule "code puts back a link the model dropped". Name it in the code comment.
- Add live rows to `harness/live/` for this case, with hard checks that the Card line holds the URL.
  Use the YouTube message above, and one Hinglish twin. Do not edit `L260`. Add a twin of it instead.

## Done when

- [ ] With the model stubbed to return `watch this video`, the `Loose Ends` Task line ends in
      `https://www.youtube.com/watch?v=qLfSDQ5NGh0`, and one log line names `^34ca`.
- [ ] With the model stubbed to return the line with the URL in it, the line is written as given and
      no log line is written.
- [ ] A Capture with two links and one edit gets both links on that line, in the order typed.
- [ ] A link on a `skip` piece is not added to any line.
- [ ] `tomorrow:https://...` finds the URL with no `tomorrow:` on its front.
- [ ] The new rows and their hard checks are in `harness/live/`. Earlier rows are not edited.
- [ ] The unit suite, `mypy`, `ruff check` and `ruff format --check` are green.
