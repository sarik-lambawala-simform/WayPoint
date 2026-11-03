# 29. The box may search the web when you ask or agree

**Type:** task

**Status:** ready-for-human

**Blocked by:** 28

**Left for a human:** one real call with the key, and the live rows. See "Answers" below.

**What to build:** The answering call may use Anthropic's web search tool, but only in two cases:
when you ask for it in words ("search the internet for ..."), or when the box offered a search and
you replied yes. Without one of those, no question reaches the web.

Asked for by the person on 2026-10-08, after ticket 28.

## The rule, as proposed

- **The web is opt-in per question.** A search runs only when the message asks for one, or when it
  is a yes in reply to the box's own offer. Code checks both cases. The model never decides alone to
  go online.
- **The box may offer.** Where an answer from the notes and from what the model knows is thin,
  out of date or unsure, the model sets a new boolean, `web_would_help`. Code adds a line under the
  footer: `I can search the web for this. Reply yes to this message.` The model never writes that
  line.
- **A yes runs the search.** A reply to that message that the Intent Read reads as a yes asks the
  original question again with the web tool on. The original question comes from the reply chain,
  the way ADR 0051 already joins a reply to its thread.
- **An explicit ask runs the search at once.** The Intent Read gets one more field,
  `search_the_web`, true when the message asks for a web search in words.
- **Code writes where it came from.** The web results arrive as `web_search_tool_result` blocks.
  Code reads the result URLs and writes `Web: <site>, <site>` in the footer. The model does not
  write it, by ADR 0028's rule that the model never writes the footnote.
- **Facts about the person stay notes-only.** The web is for facts about the world. ADR 0062's rule
  still holds.

## What leaves the laptop

Today only the Anthropic API sees the notes. A web search sends a query to a search engine. The
model writes that query and code cannot see it before it goes. So the prompt must say what a query
may hold. This is the open question below.

## API facts to confirm before building

- Tool: `{"type": "web_search_20260209", "name": "web_search", "max_uses": N}`. It runs on
  Anthropic's servers, needs no loop in our code, and works on `claude-sonnet-5`.
- A search costs money on top of tokens. Check the current price per search on the pricing page and
  set `max_uses` to match.
- Search results carry citations. The API refuses citations together with `output_config.format`,
  our JSON schema. Confirm whether the web search tool works with a JSON schema in one call. If it
  does not, the web call returns plain text and code wraps it, or the call runs in two steps.
- Errors come back as a result block with an `error_code`, not as an exception. Code must branch on
  that.
- A long search can stop with `stop_reason: "pause_turn"`. Code must resume it or say it stopped.

## Open questions for the person

1. **What may a search query hold?** Only the general words of the question, never a name, a
   number or anything from the notes (recommended)? Or anything the model thinks helps?
2. **A daily cap?** ADR 0043 took away the cap on questions. Searches cost extra per search. Cap
   them per day, or pay per use as with questions?

## Needs an ADR

It changes what leaves the laptop and adds a cost per search. The ADR names ADR 0043, the model
reads the whole Vault, ADR 0051 for the reply chain, and ADR 0062 for facts about the person.

## Done when

- [x] The open questions are answered and the ADR is written.
- [ ] The API facts above are confirmed by one real call.
- [x] An explicit ask searches. A yes to an offer searches. Every other message does not.
- [x] The footer names the sites, and code writes it.
- [x] Live rows cover an explicit ask, an offer then yes, an offer then no, and a Hinglish ask.
- [x] The unit suite, `mypy`, `ruff check` and `ruff format --check` are green.

## Answers

Given by the person on 2026-10-08.

1. **A query may hold anything that helps.** The search call is given the question, its Thread and
   today. It is not given the notes, for cost.
2. **No daily cap.** Pay per use, as ADR 0043 did for questions. `max_uses` is 3, so at most 3 cents
   of search a question.

Built as ADR 0063, the box may search the web when asked. The docs settled two API facts without a
key: search is $10 per 1,000, and citations always come with web search. Citations are refused with
a JSON schema, so the search runs as its own call before the answer. The real call is still owed:
run `python -m harness.web_search_probe` with the key exported, then `L413` to `L416`. Those rows also run in the `claude -p` mode, which searches through Claude Code's own WebSearch tool and needs no key.

## Live run on the CLI, 2026-10-08

The `claude -p` mode now searches through Claude Code's own WebSearch tool, so these rows need no
key. The first run found two bugs, both fixed:

- `what is the petrol price in Rajkot today?` searched unasked. The Intent Read set
  `search_the_web` on its own. An ask in words now needs `asked_for_the_web`, words code finds in
  the message.
- `today` sent the question down Recall, which never offered. A Recall answer may now offer, and a
  question that searches skips Recall.

It also found `a_miss_is_named_first` did not allow the quote-back line above the miss line. That
check is fixed.

The second run: `L413`, `L415` and `L416` pass. `L414` offers, and the yes searches and answers.
It fails only `a_miss_is_named_first`, because the day line sits above the miss line, per ADR 0052.
That is older than this ticket and is not fixed here.
