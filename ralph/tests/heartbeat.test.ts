/**
 * `heartbeat` in the run folder: the script touches it every
 * `RALPH_HEARTBEAT_SECS` (5 s by default) while it lives, and the loop ends
 * with the script, on a stop, on a failure and on a kill -9.
 *
 * The real script runs in a temp repo with fake `claude` and `curl`. The beat
 * is shortened to 0.2 s so a test does not wait 5 s per touch.
 */

import { existsSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import {
  makeRepo,
  readState,
  startScript,
  STREAMS,
  waitFor,
} from "./helpers/script-run.ts";

vi.setConfig({ testTimeout: 30000 });

let repo: string;
beforeEach(() => {
  repo = makeRepo();
});
afterEach(() => {
  rmSync(repo, { recursive: true, force: true });
});

const RUN_DIR = "logs/run-a";
const runDir = () => join(repo, RUN_DIR);
const beat = () => join(runDir(), "heartbeat");
const mtime = () => statSync(beat()).mtimeMs;
/** The file stops changing: no touch over several beats once `settle` ms have passed. */
async function expectBeatStopped(settle = 100) {
  await sleep(settle);
  const after = mtime();
  await sleep(700);
  expect(mtime()).toBe(after);
}
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function start(env: Record<string, string> = {}) {
  return startScript(repo, ["--run-dir", RUN_DIR], {
    RALPH_STOP_POLL: "0.1",
    RALPH_HEARTBEAT_SECS: "0.2",
    FAKE_CLAUDE_DELAY: "0.3",
    ...env,
  });
}

describe("heartbeat", () => {
  test("a running script keeps the file fresh", async () => {
    const run = start();
    await waitFor("heartbeat", () => existsSync(beat()));
    const first = mtime();
    await waitFor("a later touch", () => mtime() > first);
    const second = mtime();
    await waitFor("a third touch", () => mtime() > second);
    expect(Date.now() - mtime()).toBeLessThan(2000);
    run.child.kill("SIGTERM");
    await run.ended;
  });

  test("it is a separate file from state.json", async () => {
    const run = start();
    await waitFor("heartbeat", () => existsSync(beat()));
    expect(readdirSync(runDir())).toEqual(expect.arrayContaining(["heartbeat", "state.json"]));
    expect(readState(runDir())).not.toBeNull();
    run.child.kill("SIGTERM");
    await run.ended;
  });

  test("it does not beat faster than the 5 s default", async () => {
    const run = startScript(repo, ["--run-dir", RUN_DIR], {
      RALPH_STOP_POLL: "0.1",
      FAKE_CLAUDE_DELAY: "0.3",
    });
    await waitFor("heartbeat", () => existsSync(beat()));
    await waitFor("claude", () => readState(runDir())?.phase === "running");
    const first = mtime();
    await sleep(1500);
    expect(mtime()).toBe(first); // nothing before the 5 s mark
    run.child.kill("SIGTERM");
    await run.ended;
  });

  test("the file stops changing when the run finishes", async () => {
    const end = await start({ FAKE_CLAUDE_DELAY: "0" }).ended;
    expect(end.code, end.stderr).toBe(0);
    await expectBeatStopped();
  });

  test("the loop ends on a failed ticket", async () => {
    const end = await start({
      FAKE_CLAUDE_STREAM: join(STREAMS, "done.jsonl"),
      FAKE_CLAUDE_EXIT: "1",
      FAKE_CLAUDE_DELAY: "0",
    }).ended;
    expect(end.code).not.toBe(0);
    await expectBeatStopped();
  });

  test("the loop ends on a stop file", async () => {
    const run = start();
    await waitFor("claude", () => readState(runDir())?.phase === "running");
    writeFileSync(join(runDir(), "stop"), "");
    const end = await run.ended;
    expect(end.code, end.stderr).toBe(0);
    await expectBeatStopped();
  });

  test("the loop ends within a beat of a kill -9", async () => {
    const run = start({ FAKE_CLAUDE_DELAY: "1" });
    await waitFor("claude", () => readState(runDir())?.phase === "running");
    run.child.kill("SIGKILL");
    // Not `run.ended`: it waits for the pipes, which the orphaned fake claude holds.
    await new Promise((r) => run.child.once("exit", r));
    // One more beat may land before the loop sees the script gone.
    await expectBeatStopped(600);
  });
});
