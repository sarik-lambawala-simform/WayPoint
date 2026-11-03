# 05 — The trail shows the run is alive while a tool works

**What to build:** while a tool is running, the last line of the terminal is a live line that
redraws itself. It carries a spinner, the tool name, the elapsed time, and a short cut of what the
tool was asked to do. When the tool returns, the line is erased and the normal result line prints in
its place. A person watching the terminal can tell a slow tool from a wedged one without opening a
log.

**Status:** completed

**Blocked by:** none.

**Why this was `ready-for-human`.** Done by a person, in session, with no runner in flight. The
reason it could not be picked by the runner: the file this ticket edits is
`run-ralph-tickets.sh`, which is the runner itself. `bash` reads a script from disk as it goes, by
byte offset, so rewriting a 2,498 line script while it is executing shifts every offset after the
edit and the running shell resumes mid-word. An unattended runner that picked this ticket would
corrupt the run it is in.

## What happens

`pretty()` renders the `stream-json` events into the trail. Its `render` filter has a branch for
`system`, `assistant`, `user` and `rate_limit_event`, and end-of-stream handling for `result`. It
has no branch for `tool_progress`.

`tool_progress` is the event the CLI emits every 30 seconds for a tool that has not returned. The
filter drops it. So the trail prints the `⏺ Bash (...)` line when the tool starts and then nothing
at all until the tool ends.

Seen on a real run of this phase. Ticket 01 called
`python -m harness.live.repeat L121 --runs 5`. Each run starts a `claude --print` child and takes
about three minutes, so five runs take about fifteen. The tool passed its 600 second limit, the
harness moved it to the background, and the agent called `TaskOutput` with `block: true` and waited
for it. Between the two, the trail printed one tool line and then stayed silent for over twenty
minutes. The run log's last write was an hour old. Nothing was wrong. The run was working the whole
time, and there was no way to see that from the terminal.

The script already has the idiom. `wait_for_reset()` redraws a countdown with
`printf '\r...'` and clears it with `printf '\r\033[K'`. The quota wait is legible for exactly this
reason. Tool progress is not.

## The line

One line, redrawn in place:

    ⠸ Bash · 9m 12s   (.venv/bin/python -m harness.live.repeat L121 --runs 5 …)

The spinner frame advances on each heartbeat. The elapsed seconds come from the event's
`elapsed_time_seconds`, not from a clock the script keeps, so a laptop that slept does not lie. The
tool name comes from `tool_name`. The description reuses the `summary` and `oneline` helpers that
already cut the `⏺` line, so the two agree on what a tool call is called.

## Why the log needs care

`pretty` writes to the terminal and, through `tee >(strip_ansi >>"$RUN_LOG")`, a second copy into
`run.log`.

`strip_ansi` removes colour codes only. Its pattern is `\x1b\[[0-9;]*m`. It does not remove `\r` or
the `\033[K` erase. So a live line sent down the same pipe would land in `run.log` as one glued mess
of every frame it ever drew.

The live line is for a watching human. It must not reach the log. A log reader who wants elapsed
time already has the heartbeats in the `.jsonl`.

## Not a decision

Nothing here changes what the runner does, which ticket it picks, or how it decides a ticket passed.
This is the trail telling the truth about a run that was already correct.

The 600 second tool limit and the backgrounding that follows are not in scope. They are the CLI's,
not this script's, and a run that overflows them still finishes. This ticket makes the overflow
visible instead of silent.

## Done when

- [x] `render` handles `tool_progress` and draws a live line with a spinner frame, the tool name,
      the elapsed time from `elapsed_time_seconds`, and a cut of the tool's description.
- [x] The spinner frame advances between heartbeats, so a still frame reads as a stopped stream.
- [x] The line is redrawn in place. Thirty heartbeats leave one line on screen, not thirty.
- [x] The line is erased before the tool's result line prints, so no half-drawn frame survives it.
- [x] `run.log` holds no spinner frames, no `\r`, and no erase codes after a run with a long tool
      in it. Grep the log for the spinner characters and find none.
- [x] A non-interactive run is unharmed. When stdout is not a terminal the live line is not drawn at
      all, so redirecting the trail to a file gives the same output it gives today.
- [x] The elapsed time is read from the event. The script does not start its own timer.
- [x] The `⏺` line and the live line describe the same tool call the same way, because both use
      `summary` and `oneline`.
- [x] Shown working on a real ticket whose tool runs past 600 seconds, which is any live repeat with
      `--runs 5`.

## What was built

`run-ralph-tickets.sh`. Three parts.

`render` gains a `tool_progress` branch. The heartbeat carries `tool_name` and
`elapsed_time_seconds` but never repeats the tool input, so the description is kept at `tool_use`
time in a `tools` map keyed by tool id, through the same `summary` and `oneline(80)` the `⏺` line
uses, and read back by `parent_tool_use_id` when a beat lands. A `spin` counter in the same state
picks the frame, so the frame advances once per heartbeat.

`live_lines()` splits the output into two channels. A live line is marked with `\001` and goes
straight to fd 4, a second handle on the script stdout opened before anything is piped. Nothing
marked is passed down the pipe, so no frame can reach `run.log`. A bare `\001` is an erase, emitted
when the tool reports back. Any ordinary line erases the live line before it prints.

`LIVE_TTY` is 0 when stdout is not a terminal, and then no live line is drawn at all.

A frame is cut to the terminal width, read per frame with `stty size` off fd 4 so a resize mid-run
is still right. This is not decoration. `\r\033[K` clears one physical row, so a frame that wraps
leaves its second row stranded and thirty heartbeats scroll thirty orphaned halves up the screen.
The byte stream is identical either way, so the test suite cannot see it; checked instead in a
60-column pty, where the widest frame came to 59 columns and nothing wrapped.

`tests/test_runner_trail.py` lifts `strip_ansi`, `live_lines` and `pretty` out of the script by name
and drives them over a synthetic stream. Eight tests, one per done-when line.

## How the last box was ticked

Replayed `logs/ralph-tickets-20260911-010657/01-memark-p10-intent-read/ticket-17.jsonl`, a real
transcript whose longest tool ran 18m 07s, well past the 600 second limit. The live line counted up
through it. The log copy held no `\r`, no erase code and no spinner character.
