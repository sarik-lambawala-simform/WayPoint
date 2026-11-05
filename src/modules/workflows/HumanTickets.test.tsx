import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import type { TicketRow } from "./lib/loopRun";
import { LoopRunView } from "./LoopRunView";
import type { LaunchTarget } from "./LoopRunView";
import type { TicketTerminalsApi } from "./TicketTerminals";

vi.mock("@/modules/terminal/TerminalPane", () => ({
  TerminalPane: () => null,
}));

const ticket = (over: Partial<TicketRow> = {}): TicketRow => ({
  number: "01",
  name: "01-first.md",
  title: "First",
  status: "ready-for-agent",
  human: false,
  running: false,
  blockers: [],
  blockers_met: true,
  spent: {
    seconds: null,
    seconds_partial: null,
    cost: null,
    cost_partial: null,
    running_since_ms: null,
  },
  ...over,
});

const human = ticket({
  number: "02",
  name: "02-hitl-check.md",
  status: "ready-for-human",
  human: true,
});

const api = (selected: string): TicketTerminalsApi => ({
  state: {
    selected,
    opened: {
      [selected]: {
        replay: 1,
        shell: null,
        showShell: false,
        work: null,
        showWork: false,
        pickedRun: null,
      },
    },
  },
  select: () => {},
  openShell: () => {},
  work: () => {},
  showRun: () => {},
  pickRun: () => {},
  onShellExit: () => {},
  repoRoot: "/r",
  onOpenCommitFile: () => {},
});

const target = (over: Partial<LaunchTarget> = {}): LaunchTarget => ({
  repoRoot: "/r",
  featureDir: "/r/.scratch/demo",
  live: [],
  onStarted: () => {},
  ...over,
});

const render = (
  selected: string,
  tickets: TicketRow[],
  launch: LaunchTarget | null = target(),
) =>
  renderToStaticMarkup(
    <LoopRunView
      view={{ run: null, tickets }}
      launch={launch ?? undefined}
      terminals={api(selected)}
      feature="demo"
    />,
  );

describe("a human ticket's terminal header", () => {
  it("offers Work on this and Mark done", () => {
    const html = render("02", [ticket(), human]);
    expect(html).toContain("Work on this");
    expect(html).toContain("Mark done");
    expect(html).not.toContain('aria-disabled="true"');
  });

  it("dims Work on this while the repo has a live run, and the title says why", () => {
    const html = render("02", [ticket(), human], {
      ...target(),
      live: [{ feature: "other", run_id: "r1" }],
    });
    expect(html).toContain('aria-disabled="true"');
    expect(html).toContain("other has a live run in this repo");
    expect(html).toContain("same working tree");
  });

  it("offers no Mark done on a ticket that is already done", () => {
    const html = render("02", [ticket(), { ...human, status: "done" }]);
    expect(html).toContain("Work on this");
    expect(html).not.toContain("Mark done");
  });

  it("offers neither on an agent ticket", () => {
    const html = render("01", [ticket(), human]);
    expect(html).not.toContain("Work on this");
    expect(html).not.toContain("Mark done");
  });

  it("offers neither without a launch target", () => {
    const html = render("02", [ticket(), human], null);
    expect(html).not.toContain("Work on this");
  });
});
