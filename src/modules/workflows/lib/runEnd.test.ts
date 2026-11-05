import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  realpathSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { RunView } from "./loopRun";
import {
  endNotice,
  endReason,
  runChipLabel,
  shortName,
  START_WATCH,
  stepEndWatch,
} from "./runEnd";

// The run folders here are real folders on disk, read the way the Rust run model reads them
// (`state.json`, the feature's `tickets.tsv`, the `stop` file), so each notice is built from what a
// finished run leaves behind.

let repo: string;
let dir: string;
beforeEach(() => {
  repo = join(
    realpathSync(mkdtempSync(join(tmpdir(), "waypoint-run-end-"))),
    "Memark",
  );
  dir = join(repo, "logs", "ralph-tickets-20261009-120000");
  mkdirSync(join(dir, "01-memark-p10.98-the-answer"), { recursive: true });
});
afterEach(() => rmSync(join(repo, ".."), { recursive: true, force: true }));

/** One `tickets.tsv` row per cost; an empty cost is a ticket that recorded none. */
function tickets(...costs: string[]) {
  const rows = costs.map(
    (usd, i) =>
      `${String(i + 1).padStart(2, "0")}\tcompleted\t60\t${usd}\t0\t0\t0\tA ticket\t`,
  );
  writeFileSync(
    join(dir, "01-memark-p10.98-the-answer", "tickets.tsv"),
    `${rows.join("\n")}\n`,
  );
}

type Written = { exit_code: number | ""; resets?: string; died?: boolean };

/** Writes `state.json` and reads the folder back as the Loop view does. */
function readRun(
  w: Written,
  endedAfterMin: number,
): { run: RunView; now: number } {
  const started = statSync(dir).birthtimeMs || statSync(dir).mtimeMs;
  const end = started + endedAfterMin * 60000;
  writeFileSync(
    join(dir, "state.json"),
    JSON.stringify({
      script_pid: 1,
      feature: "memark-p10.98-the-answer",
      phase: w.died ? "running" : "finished",
      phase_since: new Date(end).toISOString(),
      quota_resets_at: w.resets ?? "",
      exit_code: w.exit_code,
    }),
  );
  const state = JSON.parse(readFileSync(join(dir, "state.json"), "utf8"));
  let rows: string[] = [];
  try {
    rows = readFileSync(
      join(dir, "01-memark-p10.98-the-answer", "tickets.tsv"),
      "utf8",
    )
      .trim()
      .split("\n")
      .filter(Boolean);
  } catch {}
  const costs = rows.map((r) => Number(r.split("\t")[3]) || 0);
  const unknown = costs.filter((c) => c <= 0).length + (w.died ? 1 : 0);
  let stopped = false;
  try {
    stopped = statSync(join(dir, "stop")).isFile();
  } catch {}
  const run: RunView = {
    id: "ralph-tickets-20261009-120000",
    dir,
    status: w.died ? "died" : "finished",
    phase: state.phase,
    phase_since: state.phase_since,
    ticket: "",
    quota_resets_at: state.quota_resets_at,
    offline_since: "",
    exit_code: state.exit_code === "" ? null : state.exit_code,
    started_at_ms: started,
    ended_at_ms: end,
    heartbeat_at_ms: null,
    tickets_ended: rows.length,
    cost: {
      usd: costs.reduce((a, b) => a + b, 0),
      partial: unknown > 0 ? "a floor" : null,
    },
    launch_line: null,
    stop_file: join(dir, "stop"),
    stop_requested: stopped,
  };
  return { run, now: end };
}

const notice = (
  w: Written,
  min: number,
  feature = "memark-p10.98-the-answer",
) => {
  const { run, now } = readRun(w, min);
  return endNotice("Memark", feature, run, now);
};

describe("the run-end notice's text", () => {
  it("names the repo and the feature's short name, and sums tickets, time and cost", () => {
    tickets("1.20", "2.00");
    expect(notice({ exit_code: 0 }, 42)).toEqual({
      title: "Memark · p10.98",
      body: "Done. 2 tickets, 42 min, $3.20",
    });
  });

  it("gives each exit code its reason, and the stop file turns exit 0 into Stopped by you", () => {
    tickets("1.00");
    const reason = (exit: number) =>
      notice({ exit_code: exit }, 5).body.split(".")[0];
    expect([0, 1, 2, 130].map(reason)).toEqual([
      "Done",
      "A ticket failed",
      "Stopped on quota",
      "Stopped by you",
    ]);
    expect(reason(7)).toBe("Ended with exit code 7");
    writeFileSync(join(dir, "stop"), "");
    expect(reason(0)).toBe("Stopped by you");
  });

  it("says when a run stopped on quota resets, in local time, and for no other ending", () => {
    tickets("1.00");
    const at = new Date(2026, 9, 19, 14, 30).toISOString();
    expect(notice({ exit_code: 2, resets: at }, 5).body).toBe(
      "Stopped on quota. 1 ticket, 5 min, $1.00. Resets at 14:30",
    );
    expect(notice({ exit_code: 0, resets: at }, 5).body).toBe(
      "Done. 1 ticket, 5 min, $1.00",
    );
    expect(notice({ exit_code: 2 }, 5).body).toBe(
      "Stopped on quota. 1 ticket, 5 min, $1.00",
    );
  });

  it("tells a died run, ended when the app saw it, with its cut ticket's cost missing", () => {
    tickets("1.00");
    const { run, now } = readRun({ exit_code: "", died: true }, 0);
    expect(
      endNotice("Memark", "memark-p10.98-the-answer", run, now + 75 * 60000)
        .body,
    ).toBe("Died. 1 ticket, 1 h 15 min, $1.00+");
  });

  it("never writes $0.00 for a cost no ticket recorded, and marks a partial sum with +", () => {
    expect(notice({ exit_code: 0 }, 0).body).toBe(
      "Done. 0 tickets, under 1 min, cost unknown",
    );
    tickets("", "");
    expect(notice({ exit_code: 0 }, 0).body).toBe(
      "Done. 2 tickets, under 1 min, cost unknown",
    );
    tickets("2.5", "");
    expect(notice({ exit_code: 0 }, 0).body).toBe(
      "Done. 2 tickets, under 1 min, $2.50+",
    );
  });

  it("shortens a feature name by dropping the repo's prefix and keeping a leading tag", () => {
    expect(shortName("Memark", "memark-p10.975-the-answer-is-never-told")).toBe(
      "p10.975",
    );
    expect(shortName("Memark", "p04.5-bug-fix")).toBe("p04.5");
    expect(shortName("MEANSoftwareFactory", "ralph-ui")).toBe("ralph-ui");
    expect(shortName("Memark", "memark-the-answer")).toBe("memark-the-answer");
  });
});

describe("the Loop cell's chip", () => {
  it("carries the end reason of a finished run", () => {
    tickets("1.00");
    const chip = (w: Written) => runChipLabel(readRun(w, 5).run);
    expect(chip({ exit_code: 0 })).toBe("finished · done");
    expect(chip({ exit_code: 1 })).toBe("finished · a ticket failed");
    expect(chip({ exit_code: 130 })).toBe("finished · stopped by you");
    expect(chip({ exit_code: "", died: true })).toBe("died");
    const at = new Date(2026, 9, 19, 14, 30).toISOString();
    expect(chip({ exit_code: 2, resets: at })).toBe(
      "stopped on quota · resets 14:30",
    );
    expect(runChipLabel(null)).toBeNull();
  });

  it("is the live status while the run is live", () => {
    const live = {
      ...readRun({ exit_code: 0 }, 1).run,
      status: "live" as const,
    };
    expect(runChipLabel(live)).toBe("live");
    expect(endReason(live)).toBeNull();
  });
});

describe("when a notice is due", () => {
  const base = readRunStub();
  function readRunStub(): RunView {
    return {
      id: "r1",
      dir: "/r/logs/r1",
      status: "live",
      phase: "running",
      phase_since: "",
      ticket: "01",
      quota_resets_at: "",
      offline_since: "",
      exit_code: null,
      started_at_ms: 0,
      ended_at_ms: null,
      heartbeat_at_ms: null,
      tickets_ended: 0,
      cost: { usd: 0, partial: null },
      launch_line: null,
      stop_file: "",
      stop_requested: false,
    };
  }
  const as = (over: Partial<RunView>): RunView => ({ ...base, ...over });

  it("is due once, for a run seen live and then seen ended", () => {
    let w = stepEndWatch(START_WATCH, as({})).watch;
    // A quota or network wait is still a live run.
    w = stepEndWatch(w, as({ phase: "quota-wait" })).watch;
    expect(stepEndWatch(w, as({ phase: "offline" })).ended).toBeNull();
    const over = as({ status: "finished", exit_code: 1 });
    const first = stepEndWatch(w, over);
    expect(first.ended).toBe(over);
    expect(stepEndWatch(first.watch, over).ended).toBeNull();
  });

  it("is never due for a run that ended while the app was closed", () => {
    const over = as({ status: "died" });
    expect(stepEndWatch(START_WATCH, over).ended).toBeNull();
    expect(stepEndWatch(START_WATCH, null).ended).toBeNull();
  });

  it("is due for a run that died after being seen live", () => {
    const w = stepEndWatch(START_WATCH, as({})).watch;
    expect(stepEndWatch(w, as({ status: "died" })).ended).not.toBeNull();
  });

  it("is not due for another run's end", () => {
    const w = stepEndWatch(START_WATCH, as({})).watch;
    expect(
      stepEndWatch(w, as({ id: "r0", status: "finished" })).ended,
    ).toBeNull();
  });
});
