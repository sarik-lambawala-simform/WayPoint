import { describe, expect, it } from "vitest";
import {
  type Cost,
  diedNote,
  formatDuration,
  formatUsd,
  runChipLabel,
  runCostText,
  runElapsedSeconds,
  type RunView,
  type Spent,
  ticketCostText,
  ticketStatusText,
  type TicketRow,
  ticketTimeText,
} from "./loopRun";

const run = (over: Partial<RunView> = {}): RunView => ({
  id: "ralph-tickets-1",
  dir: "/r/logs/ralph-tickets-1",
  status: "live",
  phase: "running",
  phase_since: "",
  ticket: "01",
  quota_resets_at: "",
  offline_since: "",
  exit_code: null,
  started_at_ms: 1_000_000,
  ended_at_ms: null,
  heartbeat_at_ms: 1_050_000,
  tickets_ended: 0,
  cost: { usd: 0, partial: null },
  ...over,
});

const spent = (over: Partial<Spent> = {}): Spent => ({
  seconds: null,
  seconds_partial: null,
  cost: null,
  cost_partial: null,
  running_since_ms: null,
  ...over,
});

describe("formatting", () => {
  it("writes durations by their largest unit", () => {
    expect(formatDuration(0)).toBe("0s");
    expect(formatDuration(45.9)).toBe("45s");
    expect(formatDuration(245)).toBe("4m 05s");
    expect(formatDuration(3720)).toBe("1h 02m");
    expect(formatDuration(-5)).toBe("0s");
  });

  it("writes cost in dollars and cents", () => {
    expect(formatUsd(2.679905)).toBe("$2.68");
    expect(formatUsd(0)).toBe("$0.00");
    expect(formatUsd(0.001)).toBe("<$0.01");
  });
});

describe("the run header", () => {
  it("counts a live run's elapsed time on from its start", () => {
    expect(runElapsedSeconds(run(), 1_090_000)).toBe(90);
  });

  it("stops a finished or died run's elapsed time at its last write", () => {
    const done = run({ status: "finished", ended_at_ms: 1_030_000 });
    expect(runElapsedSeconds(done, 9_999_999)).toBe(30);
    expect(runElapsedSeconds(run({ started_at_ms: null }), 5)).toBeNull();
  });

  it("says how long a died run has been silent", () => {
    expect(diedNote(run({ status: "died" }), 1_083_900)).toBe(
      "no heartbeat for 33 s",
    );
    expect(diedNote(run({ heartbeat_at_ms: null }), 5)).toBe("no heartbeat");
  });

  it("marks a partial run cost with + and carries the reason as the tooltip", () => {
    const whole: Cost = { usd: 2.68, partial: null };
    expect(runCostText(whole)).toEqual({ text: "$2.68", title: null });
    const floor: Cost = { usd: 2.68, partial: "a stream was cut" };
    expect(runCostText(floor)).toEqual({
      text: "$2.68+",
      title: "a stream was cut",
    });
  });

  it("puts the run status on the Loop cell's chip, and none when there is no run", () => {
    expect(runChipLabel(run({ status: "died" }))).toBe("died");
    expect(runChipLabel(null)).toBeNull();
  });
});

describe("the ticket list", () => {
  it("shows a recorded ticket's time and cost", () => {
    const s = spent({ seconds: 245, cost: 1.5 });
    expect(ticketTimeText(s, 0)).toEqual({ text: "4m 05s", title: null });
    expect(ticketCostText(s)).toEqual({ text: "$1.50", title: null });
  });

  it("counts the running ticket's time on and shows no cost for it", () => {
    const s = spent({ running_since_ms: 1_000_000 });
    expect(ticketTimeText(s, 1_065_000).text).toBe("1m 05s");
    expect(ticketCostText(s)).toEqual({ text: "—", title: null });
  });

  it("marks a partial cost + with the reason, and a missing one with a dash and the reason", () => {
    const floor = spent({ cost: 0.5, cost_partial: "cut stream" });
    expect(ticketCostText(floor)).toEqual({
      text: "$0.50+",
      title: "cut stream",
    });
    const none = spent({ cost_partial: "died mid-ticket" });
    expect(ticketCostText(none)).toEqual({
      text: "—",
      title: "died mid-ticket",
    });
  });

  it("marks the time of a ticket a dead run was on with +", () => {
    const s = spent({ seconds: 30, seconds_partial: "the run died" });
    expect(ticketTimeText(s, 0)).toEqual({
      text: "30s+",
      title: "the run died",
    });
  });

  it("shows running for the live ticket and the status key for the rest", () => {
    const t = (over: Partial<TicketRow>): TicketRow => ({
      number: "01",
      name: "01-a.md",
      title: "A",
      status: "ready-for-agent",
      human: false,
      running: false,
      spent: spent(),
      ...over,
    });
    expect(ticketStatusText(t({ running: true }))).toBe("running");
    expect(ticketStatusText(t({}))).toBe("ready-for-agent");
    expect(ticketStatusText(t({ status: "" }))).toBe("no status");
  });
});
