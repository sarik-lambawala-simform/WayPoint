# Measure what two answer prompts in a row share

Type: task
Status: open

## Question

A cache hit needs the same bytes at the start of two prompts. Nobody knows how many bytes two
answer prompts seconds apart share today.

`_prompt` in `memark/answering.py:937` writes Cards, then Captures, then dated lines, then open
Tasks, then the words the notes never write, then the question. What goes into `Found` depends on
the question. So two follow-ups may not share even the Cards block.

Do this with a vault fixture from `tests/` and a real pair of follow-ups, for example
`How was my mood yesterday?` then `How about day before yesterday?`:

- Build both prompts with the real code. Report the length of the shared start in characters and in
  tokens (use the `count_tokens` endpoint or a stated estimate).
- Name which block first differs, and why.
- Do the same for the Intent Read prompt (`_prompt` in `memark/intent.py:1789`) and its `SYSTEM`.
- Say where the Recent Exchange would sit in each prompt once p10.97 adds it, and whether that
  would break the shared start.

Record the numbers and the scripts in `../research/`. Change no code in `memark/`.
