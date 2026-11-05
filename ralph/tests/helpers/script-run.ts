/**
 * Run the real `run-ralph-tickets.sh` against a temp repo with fake tools.
 *
 * Every run test builds on this. `makeRepo` makes a git repo with a
 * `.scratch/` feature folder. `startScript` runs the script in it with
 * `tests/fakes/` first on `PATH`, so the script's `claude`, `curl` and
 * `osascript` are the fakes and its `git` and `jq` are real.
 */

import { spawn, spawnSync, type ChildProcess } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

// `ralph/`: this file is `ralph/tests/helpers/script-run.ts`.
export const ROOT = resolve(import.meta.dirname, "..", "..");
export const SCRIPT = join(ROOT, "run-ralph-tickets.sh");
export const FAKES = join(ROOT, "tests", "fakes");
export const STREAMS = join(ROOT, "tests", "fixtures", "streams");

/** The feature folder `makeRepo` writes, relative to the repo. */
export const FEATURE = ".scratch/demo";

/** `<run-dir>/state.json`, as the script writes it. */
export interface State {
  script_pid: number;
  claude_pid: number | "";
  feature: string;
  ticket: string;
  phase: string;
  phase_since: string;
  quota_resets_at: string;
  offline_since: string;
  exit_code: number | "";
  updated_at: string;
}

function git(repo: string, ...args: string[]): string {
  const r = spawnSync("git", args, { cwd: repo, encoding: "utf8" });
  if (r.status !== 0) throw new Error(`git ${args.join(" ")}: ${r.stderr}`);
  return r.stdout;
}

/**
 * A temp git repo with one commit and one feature folder holding ticket 01,
 * `ready-for-agent`. `.scratch/` and `logs/` are gitignored, as in Memark.
 */
export function makeRepo(): string {
  const repo = mkdtempSync(join(tmpdir(), "ralph-run-"));
  git(repo, "init", "-q", "-b", "main");
  git(repo, "config", "user.email", "test@example.com");
  git(repo, "config", "user.name", "Test");
  git(repo, "config", "commit.gpgsign", "false");
  writeFileSync(join(repo, ".gitignore"), ".scratch/\nlogs/\n");
  writeFileSync(join(repo, "README.md"), "temp repo\n");
  git(repo, "add", ".");
  git(repo, "commit", "-q", "-m", "start");
  const issues = join(repo, FEATURE, "issues");
  mkdirSync(issues, { recursive: true });
  writeFileSync(join(repo, FEATURE, "spec.md"), "# Demo\n");
  writeFileSync(
    ticketPath(repo),
    "# 01. The first ticket\n\n**Blocked by:** None\n\n**Status:** ready-for-agent\n\n- [ ] Do it.\n",
  );
  return repo;
}

/** The path of ticket 01 in a repo from `makeRepo`. */
export function ticketPath(repo: string): string {
  return join(repo, FEATURE, "issues", "01-the-first-ticket.md");
}

/** Ticket 01's `**Status:**` value. */
export function ticketStatus(repo: string): string {
  const m = readFileSync(ticketPath(repo), "utf8").match(/^\*\*Status:\*\* (.*)$/m);
  if (!m) throw new Error("ticket 01 has no **Status:** line");
  return m[1]!;
}

/** Commit subjects on HEAD, newest first. */
export function subjects(repo: string): string[] {
  return git(repo, "log", "--format=%s").trim().split("\n");
}

/**
 * Read `state.json`, or null if it is not there yet. A file that is there but
 * does not parse throws: every write is a `mv`, so a reader must never see half
 * a file.
 */
export function readState(runDir: string): State | null {
  const file = join(runDir, "state.json");
  if (!existsSync(file)) return null;
  return JSON.parse(readFileSync(file, "utf8")) as State;
}

/** One line of `FAKE_TRAIL`: a fake was called and saw this state. */
export interface TrailEntry {
  tool: "claude" | "curl";
  event: string;
  pid?: number;
  state: State | null;
}

export function readTrail(file: string): TrailEntry[] {
  if (!existsSync(file)) return [];
  return readFileSync(file, "utf8")
    .trim()
    .split("\n")
    .filter((l) => l)
    .map((l) => JSON.parse(l) as TrailEntry);
}

export interface Ended {
  code: number | null;
  signal: NodeJS.Signals | null;
  stdout: string;
  stderr: string;
}

export interface Run {
  child: ChildProcess;
  ended: Promise<Ended>;
}

/**
 * Start the script in `repo`. `args` come after `-y --issues-dir <feature>
 * --no-caffeinate`. `env` is laid over the test's own, with the fakes first on
 * `PATH`.
 */
export function startScript(
  repo: string,
  args: string[] = [],
  env: Record<string, string> = {},
): Run {
  const child = spawn(SCRIPT, ["-y", "--issues-dir", FEATURE, "--no-caffeinate", ...args], {
    cwd: repo,
    env: {
      ...process.env,
      FAKE_CLAUDE_STREAM: join(STREAMS, "done.jsonl"),
      ...env,
      PATH: `${FAKES}:${process.env.PATH}`,
    },
    stdio: ["ignore", "pipe", "pipe"],
  });
  let stdout = "";
  let stderr = "";
  child.stdout!.on("data", (d: Buffer) => (stdout += d.toString()));
  child.stderr!.on("data", (d: Buffer) => (stderr += d.toString()));
  const ended = new Promise<Ended>((done) => {
    child.on("close", (code, signal) => done({ code, signal, stdout, stderr }));
  });
  return { child, ended };
}

/** Poll `check` every 20 ms until it returns a value, or throw after `ms`. */
export async function waitFor<T>(
  what: string,
  check: () => T | null | undefined | false,
  ms = 15000,
): Promise<T> {
  const until = Date.now() + ms;
  for (;;) {
    const v = check();
    if (v) return v;
    if (Date.now() > until) throw new Error(`timed out waiting for ${what}`);
    await new Promise((r) => setTimeout(r, 20));
  }
}
