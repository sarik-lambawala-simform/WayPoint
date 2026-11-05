import { describe, expect, it } from "vitest";
import {
  MAX_COMMITS,
  replayedRun,
  runOptionLabel,
  ticketCommits,
} from "./ticketCommits";
import type { RunView } from "./loopRun";

const e = (sha: string, secs: number) => ({
  sha,
  shortSha: sha.slice(0, 7),
  subject: sha,
  timestampSecs: secs,
});
// Newest first, as `git log` gives it.
const log = [
  e("dddddddd0", 400),
  e("cccccccc0", 300),
  e("bbbbbbbb0", 200),
  e("aaaaaaaa0", 100),
  e("00000000", 50),
];
const win = (over = {}) => ({
  base_sha: "aaaaaaaa",
  ended_ms: 310_000,
  completed: true,
  ...over,
});

describe("ticket commits", () => {
  it("lists the commits after the base that are not newer than the stream, oldest first", () => {
    expect(ticketCommits(log, win()).map((c) => c.sha)).toEqual([
      "bbbbbbbb0",
      "cccccccc0",
    ]);
  });

  it("lists none for a ticket that did not complete, or when nothing says where it began", () => {
    expect(ticketCommits(log, win({ completed: false }))).toEqual([]);
    expect(ticketCommits(log, win({ base_sha: null }))).toEqual([]);
    expect(ticketCommits(log, win({ ended_ms: null }))).toEqual([]);
    expect(ticketCommits(log, null)).toEqual([]);
  });

  it("lists none when the base is not in the log", () => {
    expect(ticketCommits(log, win({ base_sha: "ffffffff" }))).toEqual([]);
  });

  it("caps the list", () => {
    const many = Array.from({ length: 20 }, (_, i) =>
      e(`c${i}`.padEnd(8, "0"), 1000 - i),
    ).concat(e("base0000", 1));
    const got = ticketCommits(
      many,
      win({ base_sha: "base0000", ended_ms: 2_000_000 }),
    );
    expect(got).toHaveLength(MAX_COMMITS);
  });
});

const run = (id: string, over: Partial<RunView> = {}) =>
  ({ id, status: "finished", started_at_ms: null, ...over }) as RunView;

describe("the Run: picker", () => {
  it("replays the picked run, but the live view of it when it is the newest", () => {
    const newest = run("r2", { status: "live" });
    expect(replayedRun(newest, null)).toBe(newest);
    expect(replayedRun(newest, run("r1"))?.id).toBe("r1");
    expect(replayedRun(newest, run("r2"))).toBe(newest);
    expect(replayedRun(null, run("r1"))?.id).toBe("r1");
  });

  it("labels an option with its start, its status, and marks the newest", () => {
    expect(runOptionLabel(run("r1"), "r2")).toBe("r1 · finished");
    expect(runOptionLabel(run("r2", { status: "died" }), "r2")).toBe(
      "r2 · died (newest)",
    );
  });
});
