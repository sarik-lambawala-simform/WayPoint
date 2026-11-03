// The Loop stage's run model as the page sees it: the types `workflows_loop_view` returns, and the
// pure functions that turn them into the header and the ticket list's text. Times are absolute, so
// everything here takes `now` and the page counts on from it once a second.

export type RunStatus = "live" | "finished" | "died";

/** A sum, with the reason it is only part of the whole when it is. */
export type Cost = { usd: number; partial: string | null };

export type RunView = {
  id: string;
  dir: string;
  status: RunStatus;
  phase: string;
  phase_since: string;
  ticket: string;
  quota_resets_at: string;
  offline_since: string;
  exit_code: number | null;
  started_at_ms: number | null;
  ended_at_ms: number | null;
  heartbeat_at_ms: number | null;
  tickets_ended: number;
  cost: Cost;
};

export type Spent = {
  seconds: number | null;
  seconds_partial: string | null;
  cost: number | null;
  /** Why the cost is partial, or why there is none. */
  cost_partial: string | null;
  running_since_ms: number | null;
};

export type TicketRow = {
  number: string;
  name: string;
  title: string;
  status: string;
  human: boolean;
  running: boolean;
  spent: Spent;
};

export type LoopRunView = { run: RunView | null; tickets: TicketRow[] };

/** `45s`, `4m 05s`, `1h 02m`. */
export function formatDuration(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const pad = (n: number) => String(n).padStart(2, "0");
  if (h > 0) return `${h}h ${pad(m)}m`;
  if (m > 0) return `${m}m ${pad(s % 60)}s`;
  return `${s}s`;
}

/** `$2.68`; below a cent `<$0.01`. */
export function formatUsd(usd: number): string {
  if (usd > 0 && usd < 0.005) return "<$0.01";
  return `$${usd.toFixed(2)}`;
}

/** The run's elapsed time: from its start to now while live, to its last write otherwise. */
export function runElapsedSeconds(run: RunView, now: number): number | null {
  if (run.started_at_ms === null) return null;
  const end = run.status === "live" ? now : (run.ended_at_ms ?? now);
  return Math.max(0, (end - run.started_at_ms) / 1000);
}

/** Whole seconds since the last heartbeat; null for a folder that has none. */
export function heartbeatAgeSeconds(run: RunView, now: number): number | null {
  return run.heartbeat_at_ms === null
    ? null
    : Math.max(0, Math.floor((now - run.heartbeat_at_ms) / 1000));
}

/** The note under a died run: how long it has been silent. */
export function diedNote(run: RunView, now: number): string {
  const age = heartbeatAgeSeconds(run, now);
  return age === null ? "no heartbeat" : `no heartbeat for ${age} s`;
}

/** The run's cost as the header shows it, with its tooltip when it is a floor. */
export function runCostText(cost: Cost): {
  text: string;
  title: string | null;
} {
  return {
    text: `${formatUsd(cost.usd)}${cost.partial ? "+" : ""}`,
    title: cost.partial,
  };
}

/** A ticket's time cell: the running ticket counts on from its start. */
export function ticketTimeText(
  spent: Spent,
  now: number,
): { text: string; title: string | null } {
  if (spent.running_since_ms !== null) {
    return {
      text: formatDuration((now - spent.running_since_ms) / 1000),
      title: null,
    };
  }
  if (spent.seconds === null) return { text: "—", title: null };
  return {
    text: `${formatDuration(spent.seconds)}${spent.seconds_partial ? "+" : ""}`,
    title: spent.seconds_partial,
  };
}

/** A ticket's cost cell: `+` after a known sum that is a floor, a dash and the reason when none. */
export function ticketCostText(spent: Spent): {
  text: string;
  title: string | null;
} {
  if (spent.cost === null) return { text: "—", title: spent.cost_partial };
  return {
    text: `${formatUsd(spent.cost)}${spent.cost_partial ? "+" : ""}`,
    title: spent.cost_partial,
  };
}

/** The status chip's text: what the live run is doing to it, else its status key. */
export function ticketStatusText(ticket: TicketRow): string {
  if (ticket.running) return "running";
  return ticket.status || "no status";
}

/** The chip on the Loop's cell: the run's status; nothing when the feature has no run. */
export function runChipLabel(run: RunView | null): string | null {
  return run ? run.status : null;
}
