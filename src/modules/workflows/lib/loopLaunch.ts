// The Loop's launch line, built from the form's values. The page shows it live and the same
// arguments go to Rust, so what is shown is what runs. The script's defaults are not passed.

import type { RunStatus } from "./loopRun";

const SCRIPT = "ralph/run-ralph-tickets.sh";

export type BranchMode = "new" | "current" | "per-ticket";

export type LaunchOptions = {
  only: string;
  order: string;
  max: string;
  branchMode: BranchMode;
  /** `--new-branch <name>`; empty lets the script derive one. */
  branchName: string;
  base: string;
  allowProtected: boolean;
  allowDirty: boolean;
  model: string;
  waitForReset: boolean;
  quotaCeiling: string;
  /** The script's `caffeinate` (macOS); false passes `--no-caffeinate`. */
  caffeinate: boolean;
  keepGoing: boolean;
  noWipCommit: boolean;
  maxConsecutiveFailures: string;
  noNetworkCheck: boolean;
  networkWait: string;
  networkRetries: string;
};

export const DEFAULT_LAUNCH: LaunchOptions = {
  only: "",
  order: "",
  max: "",
  branchMode: "new",
  branchName: "",
  base: "",
  allowProtected: false,
  allowDirty: false,
  model: "",
  waitForReset: false,
  quotaCeiling: "0.9",
  caffeinate: true,
  keepGoing: false,
  noWipCommit: false,
  maxConsecutiveFailures: "3",
  noNetworkCheck: false,
  networkWait: "",
  networkRetries: "3",
};

export type LaunchContext = {
  /** The feature folder as the script reads it from the repo root, e.g. `.scratch/demo`. */
  featureFolder: string;
  /** The run folder the app passes, e.g. `logs/ralph-tickets-20261103-143625`. */
  runDir: string;
  /** Who holds the machine awake: the script's `caffeinate` (macOS) or the app (Linux). */
  caffeinate: "script" | "app";
  /** On Windows the script runs in the space's distro, started through `wsl.exe`. */
  wsl?: { distro: string; linuxRoot: string } | null;
};

/** The arguments after the script: the three the app always passes, then the form's flags. */
export function launchArgs(o: LaunchOptions, ctx: LaunchContext): string[] {
  const a = ["-y", "--issues-dir", ctx.featureFolder, "--run-dir", ctx.runDir];
  const value = (flag: string, v: string) => {
    const t = v.trim();
    if (t) a.push(flag, t);
  };
  value("--only", o.only);
  value("--order", o.order);
  value("--max", o.max);
  if (o.branchMode === "current") {
    a.push("--current-branch");
    if (o.allowProtected) a.push("--allow-protected");
  } else if (o.branchMode === "per-ticket") {
    a.push("--branch-per-ticket");
  } else if (o.branchName.trim()) {
    a.push("--new-branch", o.branchName.trim());
  }
  value("--base", o.base);
  if (o.allowDirty) a.push("--allow-dirty");
  value("--model", o.model);
  if (o.waitForReset) a.push("--wait-for-reset");
  if (o.quotaCeiling.trim() !== DEFAULT_LAUNCH.quotaCeiling) {
    value("--quota-ceiling", o.quotaCeiling);
  }
  if (!o.caffeinate && ctx.caffeinate === "script") a.push("--no-caffeinate");
  if (o.keepGoing) a.push("--keep-going");
  if (o.noWipCommit) a.push("--no-wip-commit");
  if (
    o.maxConsecutiveFailures.trim() !== DEFAULT_LAUNCH.maxConsecutiveFailures
  ) {
    value("--max-consecutive-failures", o.maxConsecutiveFailures);
  }
  if (o.noNetworkCheck) a.push("--no-network-check");
  value("--network-wait", o.networkWait);
  if (o.networkRetries.trim() !== DEFAULT_LAUNCH.networkRetries) {
    value("--network-retries", o.networkRetries);
  }
  return a;
}

/** `s` as one shell word: bare when it is safe, else single-quoted. */
export function shellQuote(s: string): string {
  if (s !== "" && /^[A-Za-z0-9_@%+=:,./-]+$/.test(s)) return s;
  return `'${s.replace(/'/g, `'\\''`)}'`;
}

/**
 * The command the app starts, as a shell would read it. In a repo without its own `ralph/` the
 * app runs its bundled copy from `<run dir>/ralph/`, and the line stored with the run says so.
 */
export function launchLine(o: LaunchOptions, ctx: LaunchContext): string {
  const script = ["setsid", SCRIPT, ...launchArgs(o, ctx).map(shellQuote)];
  const via = ctx.wsl
    ? ["wsl.exe", "-d", ctx.wsl.distro, "--cd", ctx.wsl.linuxRoot, "--"].map(
        shellQuote,
      )
    : [];
  return [...via, ...script].join(" ");
}

const LIST = /^[0-9\s,;\-[\]]*$/;
const COUNT = /^[0-9]*$/;

/** What is wrong with each field, by field name; empty when the form can start. */
export function optionProblems(o: LaunchOptions): Record<string, string> {
  const p: Record<string, string> = {};
  const list = (key: "only" | "order") => {
    const t = o[key].trim();
    if (t && (!LIST.test(t) || /[0-9]-(?![0-9])|-[,\s\]]|^-/.test(t))) {
      p[key] = "Ticket numbers, ranges or both: 1,3,5 or 2-10.";
    }
  };
  list("only");
  list("order");
  const count = (
    key: "max" | "networkWait" | "networkRetries" | "maxConsecutiveFailures",
  ) => {
    if (!COUNT.test(o[key].trim())) p[key] = "A whole number.";
  };
  count("max");
  count("networkWait");
  count("networkRetries");
  count("maxConsecutiveFailures");
  const q = o.quotaCeiling.trim();
  const n = Number(q);
  if (q === "" || Number.isNaN(n) || n < 0 || n > 1) {
    p.quotaCeiling = "A number from 0 to 1.";
  }
  return p;
}

/** `path` relative to `root`, with forward slashes; unchanged when it is not under it. */
export function relativeTo(root: string, path: string): string {
  const r = root.replace(/\\/g, "/").replace(/\/+$/, "");
  const p = path.replace(/\\/g, "/");
  return p.startsWith(`${r}/`) ? p.slice(r.length + 1) : p;
}

/** The run folder for a start at `now`, named as the script names its own. */
export function runDirFor(now: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  const day = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}`;
  const time = `${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
  return `logs/ralph-tickets-${day}-${time}`;
}

/** The header's start button: none while this feature's run is live, "again" after a died run. */
export function startButtonLabel(status: RunStatus | null): string | null {
  if (status === "live") return null;
  return status === "died" ? "Start the loop again" : "Start the loop";
}

export type LiveRun = { feature: string; run_id: string };

/** Why "Start the loop" is off: the repo already has a live run, and which feature it is on. */
export function startBlockedBy(live: LiveRun[]): string | null {
  const first = live[0];
  return first ? `${first.feature} has a live run in this repo.` : null;
}
