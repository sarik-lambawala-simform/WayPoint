import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { Workflow } from "./lib/api";
import type { LoopRunView as View, RunView, TicketRow } from "./lib/loopRun";
import { type LaunchTarget, LoopRunView } from "./LoopRunView";
import { StageBar } from "./StageBar";
import type { TicketTerminalsApi } from "./TicketTerminals";

const run = (over: Partial<RunView> = {}): RunView => ({
  id: "ralph-tickets-20261103-143625",
  dir: "/r/logs/ralph-tickets-20261103-143625",
  status: "finished",
  phase: "finished",
  phase_since: "",
  ticket: "",
  quota_resets_at: "",
  offline_since: "",
  exit_code: 0,
  started_at_ms: Date.now() - 200_000,
  ended_at_ms: Date.now() - 80_000,
  heartbeat_at_ms: null,
  tickets_ended: 2,
  cost: { usd: 3.1, partial: null },
  launch_line: null,
  stop_file: "/repo/logs/r/stop",
  stop_requested: false,
  ...over,
});

const ticket = (over: Partial<TicketRow> = {}): TicketRow => ({
  number: "01",
  name: "01-first.md",
  title: "The first ticket",
  status: "completed",
  human: false,
  running: false,
  blockers: [],
  blockers_met: true,
  spent: {
    seconds: 65,
    seconds_partial: null,
    cost: 2.5,
    cost_partial: null,
    running_since_ms: null,
  },
  ...over,
});

const render = (view: View) =>
  renderToStaticMarkup(<LoopRunView view={view} />);

describe("LoopRunView", () => {
  it("shows the run status, elapsed time and cost in the header", () => {
    const html = render({ run: run(), tickets: [ticket()] });
    expect(html).toContain("finished");
    expect(html).toContain("2m 00s");
    expect(html).toContain("$3.10");
  });

  it("says no heartbeat for N s on a died run", () => {
    const html = render({
      run: run({
        status: "died",
        phase: "running",
        heartbeat_at_ms: Date.now() - 42_000,
      }),
      tickets: [],
    });
    expect(html).toMatch(/no heartbeat for 4\d s/);
  });

  it("lists each ticket with id, title, status, time and cost", () => {
    const html = render({ run: run(), tickets: [ticket()] });
    expect(html).toContain("01");
    expect(html).toContain("The first ticket");
    expect(html).toContain("completed");
    expect(html).toContain("1m 05s");
    expect(html).toContain("$2.50");
  });

  it("marks a partial cost + and carries the reason in a tooltip", () => {
    const html = render({
      run: run({ cost: { usd: 1, partial: "1 ended ticket had no cost" } }),
      tickets: [
        ticket({
          spent: {
            seconds: 10,
            seconds_partial: null,
            cost: 0.5,
            cost_partial: "a stream was cut",
            running_since_ms: null,
          },
        }),
      ],
    });
    expect(html).toContain("$1.00+");
    expect(html).toContain('title="1 ended ticket had no cost"');
    expect(html).toContain("$0.50+");
    expect(html).toContain('title="a stream was cut"');
  });

  it("says so when the feature has no run, and still lists its tickets", () => {
    const html = render({ run: null, tickets: [ticket()] });
    expect(html).toContain("No run of this feature yet.");
    expect(html).toContain("The first ticket");
  });
});

describe("the Loop cell's chip", () => {
  const workflow: Workflow = {
    id: "w",
    title: "W",
    description: "",
    stages: [
      { name: "Grill", optional: false },
      { name: "Loop", run: "loop", optional: false },
    ],
  };
  const bar = (status: "live" | "finished" | "died" | null) =>
    renderToStaticMarkup(
      <StageBar
        workflow={workflow}
        featureDir="/r/.scratch/x"
        selected={0}
        onSelect={() => {}}
        run={status ? run({ status }) : null}
      />,
    );

  it("shows the run status on the Loop's cell only", () => {
    const html = bar("died");
    expect(html.match(/data-testid="run-chip"/g)).toHaveLength(1);
    expect(html.indexOf("run-chip")).toBeGreaterThan(html.indexOf(">Loop<"));
    expect(html).toContain(">died<");
  });

  it("carries the end reason on the chip until the next run starts", () => {
    const chip = (r: RunView) =>
      renderToStaticMarkup(
        <StageBar
          workflow={workflow}
          featureDir="/r/.scratch/x"
          selected={0}
          onSelect={() => {}}
          run={r}
        />,
      );
    expect(chip(run({ exit_code: 1 }))).toContain(
      ">finished · a ticket failed<",
    );
    expect(
      chip(
        run({
          exit_code: 2,
          quota_resets_at: new Date(2026, 9, 19, 14, 30).toISOString(),
        }),
      ),
    ).toContain(">stopped on quota · resets 14:30<");
    // The next run is the newest one, so its chip replaces the reason.
    expect(chip(run({ status: "live", phase: "running" }))).toContain(">live<");
  });

  it("shows no chip while the feature has no run", () => {
    expect(bar(null)).not.toContain("run-chip");
  });

  describe("launching", () => {
    const target = (over: Partial<LaunchTarget> = {}): LaunchTarget => ({
      repoRoot: "/r",
      featureDir: "/r/.scratch/demo",
      live: [],
      onStarted: () => {},
      ...over,
    });
    const renderLaunch = (view: View, launch: LaunchTarget) =>
      renderToStaticMarkup(<LoopRunView view={view} launch={launch} />);

    it("offers Start the loop on a finished run and Start the loop again on a died one", () => {
      const done = renderLaunch({ run: run(), tickets: [] }, target());
      expect(done).toContain("Start the loop");
      expect(done).not.toContain("Start the loop again");
      const died = renderLaunch(
        { run: run({ status: "died", phase: "running" }), tickets: [] },
        target(),
      );
      expect(died).toContain("Start the loop again");
    });

    it("offers no start while this feature's run is live", () => {
      const html = renderLaunch(
        {
          run: run({
            status: "live",
            phase: "running",
            heartbeat_at_ms: Date.now(),
          }),
          tickets: [],
        },
        target(),
      );
      expect(html).not.toContain("Start the loop");
    });

    it("disables the start and names the feature when another one has a live run", () => {
      const html = renderLaunch(
        { run: null, tickets: [] },
        target({ live: [{ feature: "other-feature", run_id: "r1" }] }),
      );
      expect(html).toContain("other-feature has a live run in this repo.");
      expect(html).toMatch(/<button[^>]*disabled[^>]*>Start the loop/);
    });

    const live = (over: Partial<RunView> = {}) =>
      run({
        status: "live",
        phase: "running",
        heartbeat_at_ms: Date.now(),
        ...over,
      });

    it("offers Stop the run while the run is live, and not otherwise", () => {
      const html = renderLaunch({ run: live(), tickets: [] }, target());
      expect(html).toContain("Stop the run");
      expect(html).not.toContain("Stopping…");
      const done = renderLaunch({ run: run(), tickets: [] }, target());
      expect(done).not.toContain("Stop the run");
      const died = renderLaunch(
        { run: run({ status: "died" }), tickets: [] },
        target(),
      );
      expect(died).not.toContain("Stop the run");
    });

    it("shows Stopping… and the stop file's path once the stop file exists", () => {
      const html = renderLaunch(
        {
          run: live({ stop_requested: true, stop_file: "/r/logs/x/stop" }),
          tickets: [],
        },
        target(),
      );
      expect(html).toContain("Stopping…");
      expect(html).toContain("/r/logs/x/stop");
      expect(html).not.toContain("Stop the run");
    });

    it("shows the launch line the app wrote in the header", () => {
      const html = renderLaunch(
        {
          run: run({ launch_line: "setsid ralph/run-ralph-tickets.sh -y" }),
          tickets: [],
        },
        target(),
      );
      expect(html).toContain("setsid ralph/run-ralph-tickets.sh -y");
    });
  });

  describe("ticket terminals", () => {
    const api = (selected: string | null = null): TicketTerminalsApi => ({
      state: { selected, opened: {} },
      select: () => {},
      openShell: () => {},
      work: () => {},
      showRun: () => {},
      pickRun: () => {},
      onShellExit: () => {},
      repoRoot: "/r",
      onOpenCommitFile: () => {},
    });
    const withTerminals = (selected: string | null) =>
      renderToStaticMarkup(
        <LoopRunView
          view={{ run: run(), tickets: [ticket(), ticket({ number: "02" })] }}
          terminals={api(selected)}
          feature="f"
        />,
      );

    it("makes every ticket row a button and asks for a choice before one is made", () => {
      const html = withTerminals(null);
      expect(html.match(/<button[^>]*aria-pressed="false"/g)).toHaveLength(2);
      expect(html).toContain("Choose a ticket to see its terminal.");
    });

    it("marks the chosen ticket", () => {
      const html = withTerminals("02");
      expect(html.match(/aria-pressed="true"/g)).toHaveLength(1);
    });
  });
});
