// What a finished ticket's terminal shows under the run: the commits the script's `claude` made for
// the ticket. The script names the commit it started the ticket at in the prompt; the ticket's
// commits are the ones after it that are not newer than the stream's last write. Pure.

import type { RunView } from "./loopRun";

/** `workflows_ticket_window`'s answer. */
export type TicketWindow = {
  base_sha: string | null;
  ended_ms: number | null;
  completed: boolean;
};

/** The part of a `git log` entry the window needs. */
export type LogEntry = {
  sha: string;
  shortSha: string;
  subject: string;
  timestampSecs: number;
};

/** A commit's committer time is whole seconds and the stream's last write comes after it. */
const SLACK_MS = 5000;

/** The most commits one ticket lists. */
export const MAX_COMMITS = 8;

/**
 * The ticket's commits, oldest first, from `log` (newest first, from HEAD). Empty when the base is
 * not in the log (an old run, or history that moved) or the ticket did not complete.
 */
export function ticketCommits<T extends LogEntry>(
  log: T[],
  window: TicketWindow | null,
): T[] {
  if (!window?.completed || !window.base_sha || window.ended_ms === null)
    return [];
  const base = window.base_sha;
  const at = log.findIndex((e) => e.sha.startsWith(base));
  if (at < 0) return [];
  const limit = window.ended_ms + SLACK_MS;
  return log
    .slice(0, at)
    .filter((e) => e.timestampSecs * 1000 <= limit)
    .reverse()
    .slice(0, MAX_COMMITS);
}

/** One option of the "Run:" picker. */
export function runOptionLabel(run: RunView, newestId: string | null): string {
  const when =
    run.started_at_ms === null
      ? run.id
      : new Date(run.started_at_ms).toLocaleString();
  const tag = run.id === newestId ? " (newest)" : "";
  return `${when} · ${run.status}${tag}`;
}

/** The run a ticket's terminal replays: the picked one, or the newest. */
export function replayedRun(
  newest: RunView | null,
  picked: RunView | null,
): RunView | null {
  if (!picked) return newest;
  return newest && newest.id === picked.id ? newest : picked;
}
