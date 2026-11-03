// What a ticket's terminal shows, as pure functions: the phase it is in, the text of each part (a
// waiting note or the exact `claude` line, the stream's events, the result), and a writer that turns
// successive states into the smallest terminal output. The terminal shows the run and never hosts
// it: everything here comes from the run folder.

import type { RunView, TicketRow } from "./loopRun";
import { formatDuration, formatUsd } from "./loopRun";

/** `workflows_ticket_read`'s answer. */
export type TicketRead = {
  has_stream: boolean;
  prompt: string | null;
  chunk: string;
  offset: number;
  reset: boolean;
  outcome: TicketOutcome | null;
};

export type TicketOutcome = {
  outcome: string;
  seconds: number | null;
  cost: number | null;
  reason: string;
};

export type TicketPhase =
  | { kind: "human" }
  | { kind: "no-run" }
  | { kind: "waiting" }
  | { kind: "blocked"; by: string[] }
  | { kind: "ran" }
  | { kind: "done-before" }
  | { kind: "left" }
  | { kind: "not-taken" };

const DONE_KEYS = new Set(["completed", "resolved", "done"]);

/**
 * Where a ticket is in the newest run. `hasStream` is whether the run folder holds the ticket's
 * stream. A finished (or died) run that never took a blocked agent ticket leaves it `left`.
 */
export function ticketPhase(
  ticket: TicketRow,
  run: RunView | null,
  hasStream: boolean,
): TicketPhase {
  if (ticket.human) return { kind: "human" };
  if (hasStream) return { kind: "ran" };
  if (DONE_KEYS.has(ticket.status)) return { kind: "done-before" };
  if (!run) return { kind: "no-run" };
  const blocked = ticket.blockers.length > 0 && !ticket.blockers_met;
  if (run.status === "live") {
    return blocked
      ? { kind: "blocked", by: ticket.blockers }
      : { kind: "waiting" };
  }
  return blocked ? { kind: "left" } : { kind: "not-taken" };
}

/** The note on a ticket the finished run never took. */
export const LEFT_NOTE = "run finished without taking this ticket";

const DIM = "\u001b[90m";
const CYAN = "\u001b[36m";
const RED = "\u001b[31m";
const GREEN = "\u001b[32m";
const RESET = "\u001b[0m";

/** Terminal newlines. */
const crlf = (s: string) => s.replace(/\r?\n/g, "\r\n");

/** The note shown before a ticket has a stream, or null when it has one. */
export function phaseNote(
  phase: TicketPhase,
  ticket: TicketRow,
): string | null {
  switch (phase.kind) {
    case "human":
      return `Ticket ${ticket.number} is for a human. The script never takes it.`;
    case "no-run":
      return "No run of this feature yet.";
    case "waiting":
      return "Waiting for its turn in the run.";
    case "blocked":
      return `Blocked by ${phase.by.join(", ")}.`;
    case "done-before":
      return `Ticket ${ticket.number} is ${ticket.status}; the newest run did not take it.`;
    case "left":
      return LEFT_NOTE;
    case "not-taken":
      return "The newest run did not take this ticket.";
    case "ran":
      return null;
  }
}

/** The model the launch line names (`--model X`), or null when it passes none. */
export function modelOfLaunch(launchLine: string | null): string | null {
  const m = launchLine?.match(/--model[ =]([^\s"']+)/);
  return m ? m[1] : null;
}

/** Single quotes around `s`, as a shell shows a value that holds anything odd. */
const sq = (s: string) => `'${s.replace(/'/g, `'\\''`)}'`;

/** The `claude` line the script ran for a ticket, with the prompt from its prompt file. */
export function claudeLine(
  prompt: string | null,
  model: string | null,
): string {
  const args = [
    "--permission-mode bypassPermissions",
    "--output-format stream-json",
    "--verbose",
    ...(model ? [`--model ${model}`] : []),
  ].join(" ");
  return `claude ${args} -p ${prompt === null ? "…" : sq(prompt)}`;
}

/** The part of a ticket's terminal before its stream: a note, or the line that was run. */
export function headText(
  phase: TicketPhase,
  ticket: TicketRow,
  read: TicketRead | null,
  launchLine: string | null,
): string {
  const note = phaseNote(phase, ticket);
  if (note !== null) return crlf(`${DIM}${note}${RESET}\n`);
  return crlf(
    `${DIM}$${RESET} ${claudeLine(read?.prompt ?? null, modelOfLaunch(launchLine))}\n\n`,
  );
}

const oneline = (s: string, n: number) =>
  s.replace(/\s+/g, " ").trim().slice(0, n);

type Json = Record<string, unknown>;
const obj = (v: unknown): Json | null =>
  v && typeof v === "object" && !Array.isArray(v) ? (v as Json) : null;

const SUMMARY_KEYS = [
  "command",
  "file_path",
  "path",
  "pattern",
  "url",
  "query",
  "description",
];

/** What a tool call is about: its command, path, pattern, url or description. */
function toolSummary(input: Json | null): string {
  if (!input) return "";
  for (const k of SUMMARY_KEYS) {
    const v = input[k];
    if (typeof v === "string" && v) return v;
  }
  return JSON.stringify(input);
}

/** One stream event as terminal lines (with a trailing newline), or "" for one that shows nothing. */
export function renderEvent(line: string): string {
  let ev: Json | null;
  try {
    ev = obj(JSON.parse(line));
  } catch {
    return "";
  }
  if (!ev) return "";
  if (ev.type === "system" && ev.subtype === "init") {
    return `${DIM}● session ${String(ev.session_id ?? "?")} · ${String(ev.model ?? "?")}${RESET}\n`;
  }
  const content = obj(ev.message)?.content;
  if (!Array.isArray(content)) return "";
  const out: string[] = [];
  for (const raw of content) {
    const c = obj(raw);
    if (!c) continue;
    if (ev.type === "assistant") {
      if (c.type === "text" && typeof c.text === "string" && c.text.trim()) {
        out.push(`  ${c.text.replace(/\n/g, "\n  ")}`);
      } else if (c.type === "tool_use") {
        out.push(
          `${CYAN}⏺ ${String(c.name ?? "tool")}${RESET}${DIM} (${oneline(toolSummary(obj(c.input)), 80)})${RESET}`,
        );
      }
    } else if (ev.type === "user" && c.type === "tool_result") {
      const body = Array.isArray(c.content)
        ? c.content.map((p) => String(obj(p)?.text ?? "")).join(" ")
        : String(c.content ?? "");
      const text = oneline(body, 100);
      if (text && !/Async agent launched/.test(text)) {
        out.push(`${DIM}  ⎿ ${text}${RESET}`);
      }
    }
  }
  return out.length ? `${out.join("\n")}\n` : "";
}

/** A chunk of complete stream lines as terminal text. */
export function renderChunk(chunk: string): string {
  let out = "";
  for (const line of chunk.split("\n")) {
    if (line.trim()) out += renderEvent(line);
  }
  return crlf(out);
}

/** The result part: what the script recorded, or why the stream just stops. */
export function tailText(
  read: TicketRead | null,
  run: RunView | null,
  ticket: TicketRow,
): string {
  if (!read?.has_stream) return "";
  const o = read.outcome;
  if (!o) {
    if (run && run.status !== "live") {
      return crlf(
        `\n${RED}No result recorded: the run ended before ticket ${ticket.number} did.${RESET}\n`,
      );
    }
    return "";
  }
  const parts = [
    o.outcome,
    o.seconds === null ? null : formatDuration(o.seconds),
    o.cost === null ? null : formatUsd(o.cost),
  ].filter((p): p is string => p !== null);
  const reason = o.reason ? `\n${DIM}${o.reason}${RESET}` : "";
  const tone = o.outcome === "completed" ? GREEN : RED;
  return crlf(`\n${tone}● ${parts.join(" · ")}${RESET}${reason}\n`);
}

const CLEAR = "\u001b[2J\u001b[3J\u001b[H";

export type ReplayState = { head: string; body: string; tail: string };

/**
 * Turns successive replay states into terminal output: only the new part of the body when the head
 * is unchanged, no result was shown and the body only grew; otherwise a clear and a full redraw.
 */
export class ReplayWriter {
  private shown: ReplayState | null = null;
  constructor(private readonly write: (text: string) => void) {}

  set(next: ReplayState): void {
    const prev = this.shown;
    if (
      prev &&
      prev.head === next.head &&
      prev.body === next.body &&
      prev.tail === next.tail
    )
      return;
    this.shown = next;
    if (
      prev &&
      prev.head === next.head &&
      prev.tail === "" &&
      next.body.startsWith(prev.body)
    ) {
      this.write(next.body.slice(prev.body.length) + next.tail);
      return;
    }
    this.write(CLEAR + next.head + next.body + next.tail);
  }

  /** Forget what is shown, for a terminal that was recreated: the next `set` redraws. */
  forget(): void {
    this.shown = null;
  }
}
