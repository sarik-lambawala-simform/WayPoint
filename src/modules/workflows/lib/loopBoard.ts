// What the Loop's ticket board shows: status colours, board columns, the header count, the side
// panel's facts and lock. Pure; the Rust side (`ralph::tickets::edit_ticket`, `runs::edit_lock`)
// checks every edit again before it writes.

import { isDoneStatus } from "./humanTicket";
import type { RunView, TicketRow } from "./loopRun";

/** The statuses the panel sets. Never `in-progress`: only the loop sets that, when it picks. */
export const EDIT_STATUSES = [
  "ready-for-agent",
  "ready-for-human",
  "completed",
  "blocked",
] as const;

export type Tone = "green" | "violet" | "yellow" | "red" | "grey";

const TONES: Record<string, Tone> = {
  completed: "green",
  resolved: "green",
  done: "green",
  "in-progress": "violet",
  "ready-for-human": "yellow",
  blocked: "red",
};

/** A status key's colour; a key the board does not know is grey. */
export const toneOf = (key: string): Tone => TONES[key] ?? "grey";

/** The key a ticket shows under: the one the live run is on is in progress, whatever its file says. */
export const boardKey = (t: TicketRow): string =>
  t.running ? "in-progress" : t.status;

/** Columns that always show, in the order work moves. */
const COLUMNS = [
  "ready-for-agent",
  "in-progress",
  "ready-for-human",
  "blocked",
  "completed",
];

/** The fixed columns, then any other key a ticket carries, in ticket order. */
export function boardColumns(tickets: TicketRow[]): string[] {
  const extra = tickets.map(boardKey).filter((k) => !COLUMNS.includes(k));
  return [...COLUMNS, ...new Set(extra)];
}

/** A human ticket that is not done yet waits for a person. */
export const needsYou = (t: TicketRow): boolean =>
  t.human && !isDoneStatus(t.status);

/** `31 of 33 build tickets done, 3 need you`. */
export function headCount(tickets: TicketRow[]): string {
  if (tickets.length === 0) return "No build tickets";
  const done = tickets.filter((t) => isDoneStatus(t.status)).length;
  const need = tickets.filter(needsYou).length;
  const base = `${done} of ${tickets.length} build tickets done`;
  return need ? `${base}, ${need} ${need === 1 ? "needs" : "need"} you` : base;
}

/** The tab a ticket opens on: the one the loop is running opens on its terminal. */
export const panelTabFor = (t: TicketRow): "details" | "terminal" =>
  t.running ? "terminal" : "details";

/** A status value as the loop reads it: the key, then a note for a person. */
export function splitStatus(raw: string): { key: string; note: string } {
  const punct = raw.search(/[,.]/);
  const dash = raw.indexOf(" — ");
  let cut = raw.length;
  let after = raw.length;
  if (punct >= 0) [cut, after] = [punct, punct + 1];
  if (dash >= 0 && dash < cut) [cut, after] = [dash, dash + 3];
  return { key: raw.slice(0, cut).trimEnd(), note: raw.slice(after).trim() };
}

export type TicketFacts = {
  /** Whether the file has the bold `**Status:**` line, the only one the loop reads and the panel writes. */
  hasStatusLine: boolean;
  /** What follows the status key, for a person. */
  note: string;
  completedAt: string | null;
  type: string | null;
};

/** What the panel shows from the ticket's file that the Loop's rows do not carry. */
export function ticketFacts(text: string): TicketFacts {
  const lines = text.split("\n").map((l) => l.replace(/\r$/, ""));
  const value = (re: RegExp) => {
    const line = lines.find((l) => re.test(l));
    return line === undefined ? null : line.replace(re, "").trim();
  };
  const status = value(/^\*\*Status:\*\*/);
  return {
    hasStatusLine: status !== null,
    note: status ? splitStatus(status).note : "",
    completedAt: value(/^\*\*Completed at:\*\*/),
    type: value(/^(\*\*Type:\*\*|Type:)/),
  };
}

/** Why the panel offers no edit now; mirrors `runs::edit_lock`, which the write checks again. */
export function editLock(t: TicketRow, run: RunView | null): string | null {
  if (run?.status !== "live") return null;
  if (run.phase === "picking")
    return "The loop is picking the next ticket. Edits wait until it starts one.";
  if (t.running || run.ticket === t.number)
    return "The loop is running this ticket. Stop the run to change it.";
  return null;
}

/** The tickets a Blocked by list may add: every other ticket not already on it. */
export function blockerChoices(
  tickets: TicketRow[],
  number: string,
  chosen: string[],
): TicketRow[] {
  return tickets.filter(
    (t) => t.number !== number && !chosen.includes(t.number),
  );
}

/** Whether two Blocked by lists name the same tickets. */
export const sameBlockers = (a: string[], b: string[]): boolean =>
  [...new Set(a)].sort().join() === [...new Set(b)].sort().join();

/** `YYYY-MM-DDTHH:MM:SSZ`, the stamp the loop writes into `**Completed at:**`. */
export const utcStamp = (d: Date): string =>
  d.toISOString().replace(/\.[0-9]+Z$/, "Z");

/** Setting a completed ticket back to ready-for-agent runs `/implement` on it again: ask first. */
export const isRequeue = (from: string, to: string): boolean =>
  from === "completed" && to === "ready-for-agent";

/** The feature folder's notes: markdown outside `issues/`, top level first. */
export function docsOf(files: string[]): string[] {
  const depth = (f: string) => f.split("/").length;
  return files
    .filter((f) => f.endsWith(".md") && !f.startsWith("issues/"))
    .sort((a, b) => depth(a) - depth(b) || a.localeCompare(b));
}

/** A title as written: the odd parts between backticks are inline code; an unclosed one stays text. */
export function titleParts(text: string): { text: string; code: boolean }[] {
  const parts = text.split("`");
  const closed =
    parts.length % 2 === 1
      ? parts
      : [
          ...parts.slice(0, -2),
          `${parts[parts.length - 2]}\`${parts[parts.length - 1]}`,
        ];
  return closed
    .map((p, i) => ({ text: p, code: i % 2 === 1 }))
    .filter((p) => p.text !== "");
}

/** Only a web link leaves the app; a link to a file beside the ticket shows as text. */
export const isWebLink = (href: string | undefined): boolean =>
  href !== undefined && /^https?:\/\//.test(href);
