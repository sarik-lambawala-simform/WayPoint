import { describe, expect, it } from "vitest";
import type { Stage, Workflow } from "./api";
import {
  computeProgress,
  featureTabTitle,
  headerActions,
  matchProduces,
  type ProgressFile,
  type ProgressInput,
  repoListDirs,
} from "./progress";

const stage = (name: string, extra: Partial<Stage> = {}): Stage => ({
  name,
  optional: false,
  ...extra,
});

const mattPocock: Workflow = {
  id: "matt-pocock",
  title: "Matt Pocock",
  description: "",
  stages: [
    stage("Setup", {
      scope: "repo",
      produces: ["docs/agents/issue-tracker.md"],
    }),
    stage("Grill", {
      done_when: "confirm",
      routes: {
        wayfinder: {
          name: "Wayfinder",
          produces: ["map.md"],
          done_when: "map",
        },
      },
    }),
    stage("Prototype", { optional: true, done_when: "confirm" }),
    stage("Spec", { produces: ["spec.md"] }),
    stage("Tickets", { produces: ["issues/*.md"], done_when: "tickets" }),
    stage("Loop", { run: "loop" }),
    stage("Retro", { optional: true, done_when: "confirm" }),
  ],
};

const input = (over: Partial<ProgressInput> = {}): ProgressInput => ({
  workflow: mattPocock,
  route: null,
  featureFiles: [],
  repoFiles: [],
  repoProgress: null,
  featureProgress: null,
  ...over,
});

const mark = (stages: ProgressFile["stages"]): ProgressFile => ({ stages });
const at = "2026-11-03T10:00:00Z";
const states = (i: ProgressInput) =>
  computeProgress(i).stages.map((s) => s.state);

describe("computeProgress", () => {
  it("starts at the first stage of an empty folder", () => {
    const p = computeProgress(input());
    expect(p.current).toBe(0);
    expect(states(input())).toEqual([
      "current",
      "pending",
      "pending",
      "pending",
      "pending",
      "pending",
      "pending",
    ]);
  });

  it("lands on the Loop for a folder holding a spec and tickets, with no record", () => {
    const i = input({
      featureFiles: ["spec.md", "issues/01-a.md", "issues/02-b.md"],
      repoFiles: ["docs/agents/issue-tracker.md"],
    });
    const p = computeProgress(i);
    expect(p.stages[p.current as number].name).toBe("Loop");
    expect(states(i)).toEqual([
      "done",
      "not-recorded",
      "not-recorded",
      "done",
      "done",
      "current",
      "pending",
    ]);
  });

  it("blocks nothing for an earlier stage that was never recorded", () => {
    const i = input({ featureFiles: ["spec.md"] });
    const p = computeProgress(i);
    expect(p.stages[p.current as number].name).toBe("Tickets");
    expect(p.stages[0].state).toBe("not-recorded");
  });

  it("passes a confirm stage only on a confirmed mark", () => {
    const base = input({ repoFiles: ["docs/agents/issue-tracker.md"] });
    expect(computeProgress(base).stages[1].state).toBe("current");
    const confirmed = input({
      repoFiles: ["docs/agents/issue-tracker.md"],
      featureProgress: mark({ Grill: { confirmed: at } }),
    });
    const p = computeProgress(confirmed);
    expect(p.stages[1].state).toBe("done");
    expect(p.stages[1].markedAt).toBe(at);
    expect(p.current).toBe(2);
  });

  it("counts a skipped optional stage as passed and keeps its mark", () => {
    const i = input({
      repoFiles: ["docs/agents/issue-tracker.md"],
      featureProgress: mark({
        Grill: { confirmed: at },
        Prototype: { skipped: at },
      }),
    });
    const p = computeProgress(i);
    expect(p.stages[2].state).toBe("skipped");
    expect(p.stages[p.current as number].name).toBe("Spec");
  });

  it("ignores a skip mark on a stage that is not optional", () => {
    const i = input({ featureProgress: mark({ Grill: { skipped: at } }) });
    expect(computeProgress(i).stages[1].state).not.toBe("skipped");
  });

  it("takes a produces gate from the files, whatever the marks say", () => {
    const i = input({
      featureFiles: ["spec.md"],
      featureProgress: mark({ Spec: { confirmed: at } }),
    });
    expect(computeProgress(i).stages[3].state).toBe("done");
    const none = input({ featureProgress: mark({ Spec: { confirmed: at } }) });
    expect(computeProgress(none).stages[3].state).not.toBe("done");
  });

  it("needs every produces entry to match, and a glob to match at least one file", () => {
    const wf: Workflow = {
      ...mattPocock,
      stages: [stage("Two", { produces: ["a.md", "issues/*.md"] })],
    };
    const only = (files: string[]) =>
      computeProgress(input({ workflow: wf, featureFiles: files })).stages[0]
        .gatePasses;
    expect(only(["a.md"])).toBe(false);
    expect(only(["issues/x.md"])).toBe(false);
    expect(only(["a.md", "issues/x.md"])).toBe(true);
  });

  it("reads a repo-scoped stage from the repo files and the repo progress file", () => {
    const wf: Workflow = {
      ...mattPocock,
      stages: [
        stage("Setup", { scope: "repo", done_when: "confirm" }),
        stage("Grill", { done_when: "confirm" }),
      ],
    };
    const own = input({
      workflow: wf,
      featureProgress: mark({ Setup: { confirmed: at } }),
    });
    expect(computeProgress(own).stages[0].state).toBe("current");
    const repo = input({
      workflow: wf,
      repoProgress: mark({ Setup: { confirmed: at } }),
    });
    expect(computeProgress(repo).stages[0].state).toBe("done");
    expect(computeProgress(repo).stages[0].repoScoped).toBe(true);
  });

  it("applies the route's overrides: name, produces and gate", () => {
    const i = input({
      route: "wayfinder",
      repoFiles: ["docs/agents/issue-tracker.md"],
      featureFiles: ["map.md"],
    });
    const p = computeProgress(i);
    expect(p.stages[1].name).toBe("Wayfinder");
    expect(p.stages[1].key).toBe("Grill");
    expect(p.stages[1].produces).toEqual(["map.md"]);
    expect(p.stages[1].gatePasses).toBe(true);
  });

  it("keys marks by the plain stage name, not the route's name", () => {
    const i = input({
      route: "wayfinder",
      repoFiles: ["docs/agents/issue-tracker.md"],
      featureProgress: mark({ Grill: { confirmed: at } }),
    });
    expect(computeProgress(i).stages[1].state).not.toBe("done");
  });

  it("does not let Retro pull the current stage past an unfinished Loop", () => {
    const i = input({
      featureFiles: ["spec.md", "issues/01-a.md"],
      repoFiles: ["docs/agents/issue-tracker.md"],
      featureProgress: mark({ Retro: { skipped: at } }),
    });
    const p = computeProgress(i);
    expect(p.stages[p.current as number].name).toBe("Loop");
    expect(p.done).toBe(false);
    expect(p.stages[6].state).toBe("skipped");
  });

  it("moves to Retro when everything before it passes, and is done once Retro is recorded", () => {
    const wf: Workflow = {
      ...mattPocock,
      stages: [
        stage("Spec", { produces: ["spec.md"] }),
        stage("Retro", { optional: true, done_when: "confirm" }),
      ],
    };
    const before = computeProgress(
      input({ workflow: wf, featureFiles: ["spec.md"] }),
    );
    expect(before.current).toBe(1);
    expect(before.done).toBe(false);
    for (const m of [{ confirmed: at }, { skipped: at }]) {
      const after = computeProgress(
        input({
          workflow: wf,
          featureFiles: ["spec.md"],
          featureProgress: mark({ Retro: m }),
        }),
      );
      expect(after.current).toBeNull();
      expect(after.done).toBe(true);
    }
  });
});

describe("matchProduces", () => {
  it("matches literals, single-folder globs and double-star globs", () => {
    const files = ["spec.md", "issues/01.md", "issues/sub/02.md", "map.md"];
    expect(matchProduces("spec.md", files)).toEqual(["spec.md"]);
    expect(matchProduces("issues/*.md", files)).toEqual(["issues/01.md"]);
    expect(matchProduces("issues/**/*.md", files)).toEqual([
      "issues/01.md",
      "issues/sub/02.md",
    ]);
    expect(matchProduces("sp.c.md", files)).toEqual([]);
  });
});

describe("repoListDirs", () => {
  it("lists the folder holding each repo-scoped produces entry", () => {
    expect(repoListDirs(mattPocock)).toEqual(["docs/agents"]);
  });
});

describe("featureTabTitle", () => {
  it("is the feature and the current stage", () => {
    const p = computeProgress(input());
    expect(featureTabTitle("login", p)).toBe("login · Setup");
    expect(featureTabTitle("login", null)).toBe("login");
  });
});

describe("headerActions", () => {
  const loop = computeProgress(
    input({
      featureFiles: ["spec.md", "issues/01-a.md"],
      repoFiles: ["docs/agents/issue-tracker.md"],
    }),
  );

  it("offers a disabled Next on the current stage and an enabled one on the stage just passed", () => {
    expect(headerActions(loop, 5).nextEnabled).toBe(false);
    expect(headerActions(loop, 5).next).toBe("Retro");
    expect(headerActions(loop, 4)).toMatchObject({
      next: "Loop",
      nextEnabled: true,
    });
    expect(headerActions(loop, 3).next).toBeNull();
  });

  it("offers Done on a confirm stage and Skip on an optional one", () => {
    const grill = computeProgress(
      input({ repoFiles: ["docs/agents/issue-tracker.md"] }),
    );
    expect(headerActions(grill, 1)).toMatchObject({ done: true, skip: false });
    expect(headerActions(grill, 2)).toMatchObject({ done: false, skip: false });
    const later = computeProgress(
      input({
        repoFiles: ["docs/agents/issue-tracker.md"],
        featureFiles: ["spec.md"],
      }),
    );
    expect(headerActions(later, 2)).toMatchObject({ done: true, skip: true });
    expect(headerActions(later, 3)).toMatchObject({ done: false, skip: false });
  });
});
