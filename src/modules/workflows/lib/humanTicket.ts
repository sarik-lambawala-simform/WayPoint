// What the Loop does about human tickets, as pure functions: why "Work on this" is off, and which
// agent tickets closing a human ticket unblocks.

import type { LiveRun } from "./loopLaunch";
import type { TicketRow } from "./loopRun";

const DONE = new Set(["completed", "resolved", "done"]);

/** `completed`, `resolved` and `done` all mean a ticket is done, as the script reads it. */
export const isDoneStatus = (status: string) => DONE.has(status);

/**
 * Why "Work on this" is off: the repo has a live run, and the script commits in the same working
 * tree, so an interactive claude editing it would be committed into the script's tickets.
 */
export function workBlockedBy(live: LiveRun[]): string | null {
  const first = live[0];
  return first
    ? `${first.feature} has a live run in this repo. The script commits in the same working tree; wait for it to end or stop it.`
    : null;
}

/**
 * The agent tickets that closing human ticket `closed` unblocks: not done, not running, naming it
 * as a blocker, with every other blocker already done (and a ticket of this feature).
 */
export function unblockedBy(tickets: TicketRow[], closed: string): string[] {
  const done = (n: string) =>
    n === closed ||
    isDoneStatus(tickets.find((t) => t.number === n)?.status ?? "");
  return tickets
    .filter(
      (t) =>
        !t.human &&
        !t.running &&
        !isDoneStatus(t.status) &&
        t.blockers.includes(closed) &&
        t.blockers.every(done),
    )
    .map((t) => t.number);
}

/** The Loop's notice after "Mark done" unblocked agent tickets. */
export const unblockedText = (ids: string[]) =>
  `Closing the human ticket unblocked ${ids.join(", ")}`;
