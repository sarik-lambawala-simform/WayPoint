# Does a follow-up sent as a reply keep its question?

Type: task
Status: resolved

## Question

Nothing to decide. Finding B in [../finding.md](../finding.md) shows a follow-up sent as a new
message loses the question it follows. That is the Thread rule working as written. Before ticket 03
argues about the rule, check that the path the rule offers works.

In the harness, on the baseline fixture with the clock at 2026-09-30 20:00 Asia/Kolkata:

1. Send `How was my mood yesterday?` and run.
2. Send `How about day before yesterday?` as a Telegram reply to the bot's answer, and run.
3. Read the Intent Read's prompt for the second message. Check that it holds a
   `## The conversation this is a reply inside` section, and that the section holds the mood
   question.
4. Check that the answer is about mood.

Repeat 5 times. Record the rate, and whether the Thread holds the bot's answer or only the person's
words.

If the reply path fails too, that is a bug of its own. File it as a new ticket here.

## Answer

**Yes, it does. The reply path works: 6 of 6 runs.** But the question reaches the answer model by
luck, not by the Thread.

Run on 2026-09-29, `claude-cli` mode, baseline fixture, clock at 2026-09-30 20:00 Asia/Kolkata.
Intent Read on `claude-haiku-4-5`, answer on `claude-sonnet-5`. 5 runs, then 1 more that saved the
answer prompt whole. `claude-cli` adds Claude Code's own prompt to every call, so a rate here is a
hint and not the box's rate.

### What held, 6 of 6

- The Intent Read prompt for `How about day before yesterday?` has a
  `## The conversation this is a reply inside` section.
- The section holds the mood question: `- 2026-09-30 How was my mood yesterday?`
- The answer is about mood each time. For example: "I don't have anything about your mood for the
  day before yesterday, so that one stays unanswered."

### The Thread holds only the person's words

It never holds the bot's answer. `thread_so_far` at `memark/intent.py:1822` walks Captures by their
`ack::` and `reply-to::` numbers, and a Capture is only what the person sent. This is as designed.
The Intent Read has what it needs: the earlier question names the subject.

### The answer model never gets the Thread

This is the finding that matters for ticket 03. The answer call, `judgement` tier, gets the
material and the question, and nothing else. `_prompt` at `memark/answering.py:937` has no Thread
input. This is the whole prompt from the sixth run:

    ## Captures

    - 30 Sep 2026 How was my mood yesterday?

    ## Still to do

    - chase the plumber for the quote
    - ask how her mum got on

    ## The question

    How about day before yesterday?

The word "mood" came in under `## Captures`. That is the earlier question, saved as a Capture on
30 Sep, and it was read because the window widened. The Intent Read asked for 28 Sep. The baseline
has nothing on 28 Sep, so the box widened to the 7 days from 25 Sep to 01 Oct, and that span holds
30 Sep. The answer model got the mood question as one more note, not as what was being asked.

So a Vault that holds a Capture on the day asked about gets no widening, and the mood question
never reaches the answer model. The answer would then be about the whole day, as in finding B.
This was not run. It follows from the code above.

This is not a new bug. The v1 spec puts conversation in v1.1
(`.scratch/memark-v1/spec.md:79` and `:732`). The amendment to ADR 0028 (conversation finds Cards by
matching words, since superseded by ADR 0043, the model reads the whole Vault) said the answer call
gets the Thread. That part was never built. No ticket is filed for it here. Ticket 03 has to say
whether its fix reaches the answer call too.

### Side data for ticket 04, not a rate

The Intent Read window for `day before yesterday`, sent as a reply, was 28 Sep in 5 of 6 runs,
which is right. It was 27 Sep in 1 of 6. For `yesterday`, the replies in runs 1 and 2 named 28 Sep,
which is one day short. The other runs did not log that window.

### How it was run

A throwaway script drove `harness.live.driver.LiveDriver`. It sent the first question, ran, found
the bot's edited acknowledgement by its `reply_to`, and sent the follow-up as a reply to it. The
bot's answer is the acknowledgement of the question, edited in place. So the reply target is an
`ack::` number, which is what `thread_so_far` pairs on. Nothing in `harness/live/` was changed.
