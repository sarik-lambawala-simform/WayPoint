import { describe, expect, it } from "vitest";
import {
  DEFAULT_LAUNCH,
  launchArgs,
  launchLine,
  type LaunchContext,
  type LaunchOptions,
  optionProblems,
  relativeTo,
  runDirFor,
  shellQuote,
  startBlockedBy,
  startButtonLabel,
} from "./loopLaunch";

const ctx: LaunchContext = {
  featureFolder: ".scratch/demo",
  runDir: "logs/ralph-tickets-20261103-143625",
  caffeinate: "script",
};
const opts = (over: Partial<LaunchOptions> = {}): LaunchOptions => ({
  ...DEFAULT_LAUNCH,
  ...over,
});

describe("launchArgs and launchLine", () => {
  it("always passes -y, --issues-dir and --run-dir, and nothing else by default", () => {
    expect(launchArgs(opts(), ctx)).toEqual([
      "-y",
      "--issues-dir",
      ".scratch/demo",
      "--run-dir",
      "logs/ralph-tickets-20261103-143625",
    ]);
    expect(launchLine(opts(), ctx)).toBe(
      "setsid ralph/run-ralph-tickets.sh -y --issues-dir .scratch/demo --run-dir logs/ralph-tickets-20261103-143625",
    );
  });

  it("on WSL the line starts wsl.exe in the distro and the repo's Linux path, then setsid", () => {
    const wsl = { distro: "Ubuntu-24.04", linuxRoot: "/home/me/my app" };
    expect(launchLine(opts(), { ...ctx, caffeinate: "app", wsl })).toBe(
      "wsl.exe -d Ubuntu-24.04 --cd '/home/me/my app' -- setsid ralph/run-ralph-tickets.sh -y --issues-dir .scratch/demo --run-dir logs/ralph-tickets-20261103-143625",
    );
    expect(launchLine(opts(), { ...ctx, wsl: null })).toMatch(/^setsid /);
  });

  it("adds what to run, branch, model, quota and failure flags in the form's order", () => {
    const line = launchLine(
      opts({
        only: "2-10",
        order: "11,1",
        max: "4",
        branchMode: "current",
        allowProtected: true,
        model: "opus[1m]",
        waitForReset: true,
        quotaCeiling: "0.8",
        keepGoing: true,
        noWipCommit: true,
        noNetworkCheck: true,
        networkWait: "600",
        networkRetries: "5",
        maxConsecutiveFailures: "2",
      }),
      ctx,
    );
    expect(line).toBe(
      "setsid ralph/run-ralph-tickets.sh -y --issues-dir .scratch/demo --run-dir logs/ralph-tickets-20261103-143625" +
        " --only 2-10 --order 11,1 --max 4" +
        " --current-branch --allow-protected" +
        " --model 'opus[1m]' --wait-for-reset --quota-ceiling 0.8" +
        " --keep-going --no-wip-commit --max-consecutive-failures 2" +
        " --no-network-check --network-wait 600 --network-retries 5",
    );
  });

  it("names a new branch and its base, or stacks a branch per ticket", () => {
    expect(
      launchArgs(opts({ branchName: "feat/x", base: "main" }), ctx).slice(5),
    ).toEqual(["--new-branch", "feat/x", "--base", "main"]);
    expect(
      launchArgs(opts({ branchMode: "per-ticket" }), ctx).slice(5),
    ).toEqual(["--branch-per-ticket"]);
  });

  it("leaves a flag out when it holds the script's own default", () => {
    const args = launchArgs(
      opts({
        quotaCeiling: "0.9",
        networkRetries: "3",
        maxConsecutiveFailures: "3",
      }),
      ctx,
    );
    expect(args).toHaveLength(5);
  });

  it("passes --no-caffeinate only where the script's caffeinate is the setting", () => {
    expect(
      launchArgs(opts({ caffeinate: false }), { ...ctx, caffeinate: "script" }),
    ).toContain("--no-caffeinate");
    expect(
      launchArgs(opts({ caffeinate: false }), { ...ctx, caffeinate: "app" }),
    ).not.toContain("--no-caffeinate");
  });

  it("quotes what a shell would split", () => {
    expect(shellQuote("plain-1.2/x")).toBe("plain-1.2/x");
    expect(shellQuote("a b")).toBe("'a b'");
    expect(shellQuote("it's")).toBe("'it'\\''s'");
    expect(shellQuote("")).toBe("''");
    expect(
      launchLine(opts(), { ...ctx, featureFolder: ".scratch/my feat" }),
    ).toContain("--issues-dir '.scratch/my feat'");
  });
});

describe("optionProblems", () => {
  it("accepts the default and well-formed lists", () => {
    expect(optionProblems(opts())).toEqual({});
    expect(
      optionProblems(opts({ only: "1, 3, 5-8", order: "[11,1]" })),
    ).toEqual({});
  });

  it("names a malformed list, count or ceiling", () => {
    const p = optionProblems(
      opts({ only: "a-b", max: "-1", quotaCeiling: "1.5", networkWait: "x" }),
    );
    expect(Object.keys(p).sort()).toEqual([
      "max",
      "networkWait",
      "only",
      "quotaCeiling",
    ]);
  });
});

describe("paths and the one-run rule", () => {
  it("makes a feature folder relative to the repo root", () => {
    expect(relativeTo("/r", "/r/.scratch/demo")).toBe(".scratch/demo");
    expect(relativeTo("/r/", "/r/.scratch/demo")).toBe(".scratch/demo");
  });

  it("names the run folder from the clock", () => {
    expect(runDirFor(new Date(2026, 10, 3, 14, 36, 25))).toBe(
      "logs/ralph-tickets-20261103-143625",
    );
  });

  it("blocks a start while another feature has a live run, and says which", () => {
    expect(startBlockedBy([])).toBeNull();
    expect(startBlockedBy([{ feature: "other", run_id: "r1" }])).toBe(
      "other has a live run in this repo.",
    );
    expect(startBlockedBy([{ feature: "demo", run_id: "r1" }])).toBe(
      "demo has a live run in this repo.",
    );
  });
});

describe("startButtonLabel", () => {
  it("offers a start, a start again after a died run, and nothing while live", () => {
    expect(startButtonLabel(null)).toBe("Start the loop");
    expect(startButtonLabel("finished")).toBe("Start the loop");
    expect(startButtonLabel("died")).toBe("Start the loop again");
    expect(startButtonLabel("live")).toBeNull();
  });
});
