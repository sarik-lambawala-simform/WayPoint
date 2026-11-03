/**
 * The script writes `state.json`, takes `--run-dir`, and keeps its stop file
 * in the run folder.
 *
 * Each test runs the real script in a temp git repo, with fake `claude` and
 * `curl` first on `PATH` (see `helpers/script-run.ts`). What it checks is what
 * a watching tool would see: `state.json`, the ticket's status line, the
 * commits, and the exit code.
 *
 * The fakes copy `state.json` into a trail file when they are called. That is
 * how a test sees the short phases: `picking` is the phase while fake `curl`
 * answers the network check, and `running` the phase while fake `claude` plays.
 */

import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import {
  FEATURE,
  makeRepo,
  readState,
  readTrail,
  startScript,
  STREAMS,
  subjects,
  ticketPath,
  ticketStatus,
  waitFor,
  type State,
} from "./helpers/script-run.ts";

// Each test runs the whole script, which takes a few seconds.
vi.setConfig({ testTimeout: 30000 });

let repo: string;
let trail: string;
beforeEach(() => {
  repo = makeRepo();
  // Outside the repo, so the script never sees it as uncommitted work.
  trail = `${repo}-trail.jsonl`;
});
afterEach(() => {
  rmSync(repo, { recursive: true, force: true });
  rmSync(trail, { force: true });
  for (const f of streams.splice(0)) rmSync(f, { force: true });
});

const RUN_DIR = "logs/run-a";

/** Start a run in `RUN_DIR`, with the fakes writing to the trail. */
function start(args: string[] = [], env: Record<string, string> = {}) {
  return startScript(repo, ["--run-dir", RUN_DIR, ...args], {
    FAKE_TRAIL: trail,
    FAKE_STATE: join(repo, RUN_DIR, "state.json"),
    RALPH_STOP_POLL: "0.1",
    ...env,
  });
}

const runDir = () => join(repo, RUN_DIR);
const ISO = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/;
const iso = (epoch: number) => new Date(epoch * 1000).toISOString().replace(".000", "");

/** The state once its phase is `phase`, for `waitFor`. */
function phaseIs(phase: string): () => State | null {
  return () => {
    const s = readState(runDir());
    return s?.phase === phase ? s : null;
  };
}

/** Streams written by `editedStream`, removed after each test. */
const streams: string[] = [];

/** A copy of a saved stream with each `[from, to]` replaced, written next to the repo. */
function editedStream(name: string, edits: [string, string][]): string {
  const file = `${repo}-${streams.length}-${name}`;
  let text = readFileSync(join(STREAMS, name), "utf8");
  for (const [from, to] of edits) text = text.replaceAll(from, to);
  writeFileSync(file, text);
  streams.push(file);
  return file;
}

/** A copy of quota.jsonl whose limit resets at `resetsAt`, written next to the repo. */
function quotaStream(resetsAt: number): string {
  return editedStream("quota.jsonl", [["1791444600", String(resetsAt)]]);
}

/** A second ticket, ready and unblocked, so a run has one to start after 01. */
function addSecondTicket(): string {
  const file = join(repo, FEATURE, "issues", "02-the-second-ticket.md");
  writeFileSync(file, "# 02. The second ticket\n\n**Blocked by:** None\n\n**Status:** ready-for-agent\n\n- [ ] Do it.\n");
  return file;
}

/** The state once fake claude's pid is in it, which means claude is running. */
function claudeRunning(): State | null {
  const s = readState(runDir());
  return s && s.claude_pid !== "" ? s : null;
}

describe("a run that ends", () => {
  test("a done ticket leaves the phase finished and exit_code 0", async () => {
    const run = start();
    const end = await run.ended;
    expect(end.code, end.stderr).toBe(0);

    const s = readState(runDir())!;
    expect(s).toMatchObject({
      script_pid: run.child.pid,
      claude_pid: "",
      feature: "demo",
      // The last pick found nothing left, so no ticket is current.
      ticket: "",
      phase: "finished",
      quota_resets_at: "",
      offline_since: "",
      exit_code: 0,
    });
    expect(s.phase_since).toMatch(ISO);
    expect(s.updated_at).toMatch(ISO);
    expect(ticketStatus(repo)).toBe("completed");
  });

  test("the phase is picking during the network check and running while claude plays", async () => {
    const end = await start().ended;
    expect(end.code, end.stderr).toBe(0);

    const t = readTrail(trail);
    const curl = t.find((e) => e.tool === "curl")!;
    expect(curl.state).toMatchObject({ phase: "picking", ticket: "01", feature: "demo" });
    const claude = t.find((e) => e.tool === "claude" && e.event === "start")!;
    expect(claude.state).toMatchObject({ phase: "running", ticket: "01" });
  });

  test("claude_pid is the running claude's pid", async () => {
    const run = start([], { FAKE_CLAUDE_DELAY: "0.3" });
    const s = await waitFor("claude to start", claudeRunning);
    const end = await run.ended;
    expect(end.code, end.stderr).toBe(0);
    const claude = readTrail(trail).find((e) => e.tool === "claude")!;
    expect(s.claude_pid).toBe(claude.pid);
    expect(s.phase).toBe("running");
  });

  test("a failed ticket gives exit 1 and blocked", async () => {
    const end = await start([], { FAKE_CLAUDE_EXIT: "1" }).ended;
    expect(end.code, end.stderr).toBe(1);
    expect(readState(runDir())).toMatchObject({ phase: "finished", exit_code: 1 });
    expect(ticketStatus(repo)).toBe("blocked");
  });

  test("a quota event gives exit 2 and keeps the reset time", async () => {
    const end = await start([], { FAKE_CLAUDE_STREAM: join(STREAMS, "quota.jsonl") }).ended;
    expect(end.code, end.stderr).toBe(2);
    expect(readState(runDir())).toMatchObject({
      phase: "finished",
      exit_code: 2,
      quota_resets_at: iso(1791444600), // resetsAt in quota.jsonl
    });
    expect(ticketStatus(repo)).toBe("in-progress");
  });

  test("a rejected event with no reset of its own keeps the fullest window's reset", async () => {
    const quota = editedStream("quota.jsonl", [['"status":"rejected","resetsAt":1791444600,', '"status":"rejected",']]);
    const end = await start([], { FAKE_CLAUDE_STREAM: quota }).ended;
    expect(end.code, end.stderr).toBe(2);
    // seven_day, at 0.06, is fuller than five_hour at 0.02.
    expect(readState(runDir())).toMatchObject({ exit_code: 2, quota_resets_at: iso(1791453600) });
  });

  // done.jsonl reports five_hour at 0.02 and seven_day at 0.06 in unifiedWindows.
  test("usage at the quota ceiling stops before the next ticket with exit 2 and the reset time", async () => {
    const second = addSecondTicket();
    const end = await start(["--quota-ceiling", "0.05"]).ended;
    expect(end.code, end.stderr).toBe(2);
    expect(end.stdout).toContain("⚠ quota 6% (7-day)");
    expect(end.stdout).toContain("Quota at 6% — not starting ticket 02");
    expect(readState(runDir())).toMatchObject({
      phase: "finished",
      exit_code: 2,
      ticket: "02",
      // The fullest window's reset: seven_day's, not five_hour's.
      quota_resets_at: iso(1791453600),
    });
    expect(ticketStatus(repo)).toBe("completed");
    expect(readFileSync(second, "utf8")).toContain("**Status:** ready-for-agent");
  });

  test("usage below the quota ceiling starts the next ticket, with no quota line", async () => {
    const second = addSecondTicket();
    const end = await start(["--quota-ceiling", "0.07"]).ended;
    expect(end.code, end.stderr).toBe(0);
    expect(end.stdout).not.toContain("⚠ quota");
    expect(readFileSync(second, "utf8")).toContain("**Status:** completed");
  });

  test("a ceiling of 1 never stops, even at a reading of exactly 1", async () => {
    const second = addSecondTicket();
    const full = editedStream("done.jsonl", [['"seven_day":{"utilization":0.06', '"seven_day":{"utilization":1']]);
    const end = await start(["--quota-ceiling", "1"], { FAKE_CLAUDE_STREAM: full }).ended;
    expect(end.code, end.stderr).toBe(0);
    expect(readFileSync(second, "utf8")).toContain("**Status:** completed");
  });

  test("usage at the quota ceiling with no ticket left finishes rather than stopping", async () => {
    const end = await start(["--quota-ceiling", "0.05"]).ended;
    expect(end.code, end.stderr).toBe(0);
    expect(readState(runDir())).toMatchObject({ phase: "finished", exit_code: 0 });
  });

  test("every write is a mv, so no temp file is left", async () => {
    const end = await start().ended;
    expect(end.code, end.stderr).toBe(0);
    expect(readdirSync(runDir()).filter((f) => f.startsWith("state.json."))).toEqual([]);
  });
});

describe("the ticket's comment", () => {
  /** The agent's final message in done.jsonl, the stream fake claude plays by default. */
  const finalMessage = () =>
    readFileSync(join(STREAMS, "done.jsonl"), "utf8")
      .split("\n")
      .filter((l) => l.includes('"type":"result"'))
      .map((l) => JSON.parse(l).result as string)
      .pop()!;

  test("a done ticket gets the agent's final message under ## Comments", async () => {
    const end = await start().ended;
    expect(end.code, end.stderr).toBe(0);
    const text = readFileSync(ticketPath(repo), "utf8");
    expect(text.endsWith(`\n## Comments\n\n${finalMessage()}\n`)).toBe(true);
  });

  test("a ticket that already has ## Comments gets the message after the old one, under one heading", async () => {
    writeFileSync(
      ticketPath(repo),
      "# 01. The first ticket\n\n**Blocked by:** None\n\n**Status:** ready-for-agent\n\n- [ ] Do it.\n\n## Comments\n\nAn older note.\n",
    );
    const end = await start().ended;
    expect(end.code, end.stderr).toBe(0);
    const text = readFileSync(ticketPath(repo), "utf8");
    expect(text.match(/^## Comments$/gm)).toHaveLength(1);
    expect(text.endsWith(`\n## Comments\n\nAn older note.\n\n${finalMessage()}\n`)).toBe(true);
  });

  test("a failed ticket gets no comment", async () => {
    const end = await start([], { FAKE_CLAUDE_EXIT: "1" }).ended;
    expect(end.code, end.stderr).toBe(1);
    expect(readFileSync(ticketPath(repo), "utf8")).not.toContain("## Comments");
  });
});

describe("the stop file", () => {
  test("touching it parks the ticket in-progress with a wip commit and exits 0", async () => {
    const run = start([], { FAKE_CLAUDE_DELAY: "0.5" });
    await waitFor("claude to start", claudeRunning);
    writeFileSync(join(runDir(), "stop"), "");
    const end = await run.ended;

    expect(end.code, end.stderr).toBe(0);
    expect(ticketStatus(repo)).toBe("in-progress");
    expect(subjects(repo)[0]).toMatch(/^wip\(01\): /);
    expect(readState(runDir())).toMatchObject({ phase: "finished", exit_code: 0 });
    // The script wrote `stopping` before it sent claude the SIGTERM.
    const term = readTrail(trail).find((e) => e.tool === "claude" && e.event === "term");
    expect(term?.state).toMatchObject({ phase: "stopping", ticket: "01" });
  });

  test("a stop file left by an old run does not block a new one", async () => {
    mkdirSync(join(repo, "logs", "old-run"), { recursive: true });
    writeFileSync(join(repo, "logs", "old-run", "stop"), "");
    // The old default, in the repo root. Untracked, so the run needs --allow-dirty.
    writeFileSync(join(repo, ".ralph-stop"), "");
    const end = await start(["--allow-dirty"]).ended;
    expect(end.code, end.stderr).toBe(0);
    expect(ticketStatus(repo)).toBe("completed");
  });

  test("--stop-file names the stop file in place of the default", async () => {
    writeFileSync(join(repo, "my-stop"), "");
    const end = await start(["--stop-file", "my-stop", "--allow-dirty"]).ended;
    // A stop file that is already there refuses the run before it starts.
    expect(end.code).toBe(1);
    expect(end.stderr).toContain("The stop file 'my-stop' is already there");
    expect(ticketStatus(repo)).toBe("ready-for-agent");
  });
});

describe("waits", () => {
  test("an offline link shows waiting-network with offline_since", async () => {
    const run = start(["--network-wait", "1"], { FAKE_CURL_EXIT: "7" });
    const s = await waitFor("waiting-network", phaseIs("waiting-network"));
    expect(s.offline_since).toMatch(ISO);
    expect(s.ticket).toBe("01");

    const end = await run.ended;
    expect(end.code, end.stderr).toBe(0);
    expect(readState(runDir())).toMatchObject({ phase: "finished", offline_since: "" });
    expect(ticketStatus(repo)).toBe("ready-for-agent");
  });

  test("--wait-for-reset shows waiting-quota with quota_resets_at, then resumes", async () => {
    // The script waits until 60 seconds after the reset, so a reset 58 seconds
    // ago is a two-second wait.
    const resetsAt = Math.floor(Date.now() / 1000) - 58;
    const quota = quotaStream(resetsAt);
    try {
      const run = start(["--wait-for-reset"], {
        FAKE_CLAUDE_STREAM: `${quota}:${join(STREAMS, "done.jsonl")}`,
        FAKE_CLAUDE_CALLS: `${repo}-calls.txt`,
      });
      const s = await waitFor("waiting-quota", phaseIs("waiting-quota"));
      expect(s.quota_resets_at).toBe(iso(resetsAt));

      const end = await run.ended;
      expect(end.code, end.stderr).toBe(0);
      expect(readState(runDir())).toMatchObject({ phase: "finished", quota_resets_at: "" });
      expect(ticketStatus(repo)).toBe("completed");
    } finally {
      rmSync(quota, { force: true });
      rmSync(`${repo}-calls.txt`, { force: true });
    }
  });

  test("--wait-for-reset at the quota ceiling waits before the next ticket, naming it", async () => {
    const second = addSecondTicket();
    // A ten-minute wait, so it is still on however slow ticket 01 is. The stop
    // file ends it; the resume after a reset is the test above.
    const resetsAt = String(Math.floor(Date.now() / 1000) + 600);
    const done = editedStream("done.jsonl", [["1791444600", resetsAt], ["1791453600", resetsAt]]);
    const run = start(["--quota-ceiling", "0.05", "--wait-for-reset"], { FAKE_CLAUDE_STREAM: done });
    const s = await waitFor("waiting-quota", phaseIs("waiting-quota"));
    expect(s).toMatchObject({ ticket: "02", quota_resets_at: iso(Number(resetsAt)) });

    writeFileSync(join(runDir(), "stop"), "");
    const end = await run.ended;
    expect(end.code, end.stderr).toBe(0);
    expect(readFileSync(second, "utf8")).toContain("**Status:** ready-for-agent");
  });

  test("touching the stop file ends a quota wait", async () => {
    // A ten-minute wait, which only the stop file can cut short.
    const quota = quotaStream(Math.floor(Date.now() / 1000) + 600);
    try {
      const run = start(["--wait-for-reset"], { FAKE_CLAUDE_STREAM: quota });
      await waitFor("waiting-quota", phaseIs("waiting-quota"));
      writeFileSync(join(runDir(), "stop"), "");
      const end = await run.ended;
      expect(end.code, end.stderr).toBe(0);
      expect(readState(runDir())).toMatchObject({ phase: "finished", exit_code: 0 });
      expect(ticketStatus(repo)).toBe("in-progress");
    } finally {
      rmSync(quota, { force: true });
    }
  });
});

describe("signals", () => {
  test.each(["SIGINT", "SIGTERM"] as const)("%s ends finished with exit 130", async (sig) => {
    const run = start([], { FAKE_CLAUDE_DELAY: "0.2" });
    await waitFor("claude to start", claudeRunning);
    run.child.kill(sig);
    const end = await run.ended;
    expect(end.code, end.stderr).toBe(130);
    expect(readState(runDir())).toMatchObject({ phase: "finished", exit_code: 130 });
  });
});

describe("--run-dir", () => {
  test("without it the run folder is named from the clock", async () => {
    const end = await startScript(repo, [], { RALPH_STOP_POLL: "0.1" }).ended;
    expect(end.code, end.stderr).toBe(0);
    const runs = readdirSync(join(repo, "logs"));
    expect(runs).toHaveLength(1);
    expect(runs[0]).toMatch(/^ralph-tickets-\d{8}-\d{6}$/);
    expect(readState(join(repo, "logs", runs[0]!))).toMatchObject({
      phase: "finished",
      exit_code: 0,
    });
  });

  test("with it every run file lands in that folder", async () => {
    const end = await start().ended;
    expect(end.code, end.stderr).toBe(0);
    expect(existsSync(join(runDir(), "run.log"))).toBe(true);
    expect(existsSync(join(runDir(), "run-summary.md"))).toBe(true);
    expect(readdirSync(join(repo, "logs"))).toEqual(["run-a"]);
  });
});
