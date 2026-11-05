// How a run that ended is told to the developer: the reason (as the Ralph UI's `alert.ts` says it),
// the OS notice's title and body, and the chip on the Loop's cell. All pure: `now` and the repo's
// name come in as arguments.

import { formatUsd, type RunView } from "./loopRun";

export type Notice = { title: string; body: string };

/** The ended run's reason, as the notice says it. Null while the run is live. */
export function endReason(run: RunView): string | null {
  if (run.status === "live") return null;
  if (run.status === "died") return "Died";
  switch (run.exit_code) {
    case 0:
      // The script maps a stop-file stop to exit 0, so the file is what tells the two apart.
      return run.stop_requested ? "Stopped by you" : "Done";
    case 1:
      return "A ticket failed";
    case 2:
      return "Stopped on quota";
    case 130:
      return "Stopped by you";
    case null:
      return "Ended";
    default:
      return `Ended with exit code ${run.exit_code}`;
  }
}

/** `14:30` in the machine's time zone, or "" for a time that does not parse. */
function clockTime(iso: string): string {
  const at = new Date(iso);
  if (!iso || Number.isNaN(at.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(at.getHours())}:${pad(at.getMinutes())}`;
}

/** `. Resets at 14:30` on a run stopped on quota; empty otherwise. */
function resets(run: RunView): string {
  const at = run.exit_code === 2 ? clockTime(run.quota_resets_at) : "";
  return at ? `. Resets at ${at}` : "";
}

/** `42 min`, `1 h 5 min`, or `under 1 min`. */
function noticeDuration(ms: number): string {
  const min = Math.round(ms / 60000);
  if (min < 1) return "under 1 min";
  return min < 60 ? `${min} min` : `${Math.floor(min / 60)} h ${min % 60} min`;
}

/**
 * A feature folder's short name: it drops the repo's name as a prefix, then keeps a leading tag
 * with a digit in it (`memark-p10.975-the-answer` in Memark is `p10.975`). A name with no such
 * tag stays whole.
 */
export function shortName(repo: string, feature: string): string {
  const prefix = `${repo.toLowerCase()}-`;
  const rest = feature.toLowerCase().startsWith(prefix)
    ? feature.slice(prefix.length)
    : feature;
  return /^[A-Za-z]*[0-9][A-Za-z0-9.]*(?=-|$)/.exec(rest)?.[0] ?? feature;
}

/**
 * The notice for an ended run. `now` is when the app saw it end: a died run has no end of its
 * own, and a finished run's last phase change is its end.
 */
export function endNotice(
  repoName: string,
  feature: string,
  run: RunView,
  now: number,
): Notice {
  const finishedAt =
    run.status === "finished" && run.phase_since
      ? Date.parse(run.phase_since)
      : Number.NaN;
  const end = Number.isNaN(finishedAt) ? now : finishedAt;
  const tickets = run.tickets_ended;
  // No ticket ended, or none recorded a cost: unknown, never $0.00. A died run cut its last ticket, so its sum is a floor.
  const usd =
    tickets === 0 || run.cost.usd <= 0
      ? "cost unknown"
      : `${formatUsd(run.cost.usd)}${run.cost.partial || run.status === "died" ? "+" : ""}`;
  const took =
    run.started_at_ms === null
      ? ""
      : `, ${noticeDuration(end - run.started_at_ms)}`;
  return {
    title: `${repoName} · ${feature ? shortName(repoName, feature) : run.id}`,
    body: `${endReason(run)}. ${tickets} ${tickets === 1 ? "ticket" : "tickets"}${took}, ${usd}${resets(run)}`,
  };
}

/**
 * The chip on the Loop's cell: the run's status, with the end reason once it has ended
 * (`finished · ticket failed`, `stopped on quota · resets 14:30`); nothing when the feature has no
 * run. It stays until the next run starts, because the newest run is the one shown.
 */
export function runChipLabel(run: RunView | null): string | null {
  if (!run) return null;
  if (run.status !== "finished") return run.status;
  const reason = endReason(run) ?? "";
  if (reason === "Stopped on quota") {
    const at = clockTime(run.quota_resets_at);
    return at ? `stopped on quota · resets ${at}` : "stopped on quota";
  }
  return `finished · ${reason.charAt(0).toLowerCase()}${reason.slice(1)}`;
}

/** The id of the run last seen live, until its end has been told. */
export type EndWatch = { liveId: string | null };

export const START_WATCH: EndWatch = { liveId: null };

/**
 * One step of the watch over the feature's newest run. A notice is due only for a run seen live
 * and then seen ended, once. A run that was already over when first seen, or that ended while the
 * app was closed, never was live here. A quota or network wait is a live run's phase, so it gives
 * none either.
 */
export function stepEndWatch(
  watch: EndWatch,
  run: RunView | null,
): { watch: EndWatch; ended: RunView | null } {
  if (!run) return { watch, ended: null };
  if (run.status === "live") {
    return { watch: { liveId: run.id }, ended: null };
  }
  if (watch.liveId === run.id) return { watch: START_WATCH, ended: run };
  return { watch, ended: null };
}
