import { describe, expect, it } from "vitest";
import type { Stage, Workflow } from "./api";
import {
  ageOf,
  chosenRoute,
  computeProgress,
  featureTabTitle,
  hasRouteOverride,
  headerActions,
  type MapFacts,
  matchProduces,
  type ProgressFile,
  type ProgressInput,
  repoListDirs,
  routesOf,
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
    stage("Spec", {
      produces: ["spec.md"],
      routes: { wayfinder: { session: "fresh", args: "{{ feature }}/map.md" } },
    }),
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

const cleared: MapFacts = {
  exists: true,
  open_wayfinder: [],
  unspecified_clear: true,
};

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
      buildTickets: ["01-a.md", "02-b.md"],
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
      mapFacts: cleared,
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
      buildTickets: ["01-a.md"],
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
      buildTickets: ["01-a.md"],
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

const files = ["spec.md", "issues/01-a.md"];
const repoFiles = ["docs/agents/issue-tracker.md"];

describe("the tickets gate", () => {
  const tickets = (buildTickets: string[]) =>
    computeProgress(input({ featureFiles: files, repoFiles, buildTickets }));

  it("passes with one build ticket, human tickets included", () => {
    const p = tickets(["01-a.md"]);
    expect(p.stages[4].gatePasses).toBe(true);
    expect(p.stages[4].state).toBe("done");
  });

  it("does not pass when the folder holds only wayfinder tickets or none", () => {
    // issues/*.md exists, but the Rust reader found no build ticket among them.
    const p = tickets([]);
    expect(p.stages[4].gatePasses).toBe(false);
    expect(p.stages[p.current as number].name).toBe("Tickets");
  });
});

describe("the check gate", () => {
  const lint: Workflow = {
    id: "w",
    title: "W",
    description: "",
    stages: [
      stage("Build", { done_when: "confirm" }),
      stage("Lint", { done_when: { check: "pnpm lint {{ feature }}" } }),
      stage("Ship", { done_when: "confirm" }),
    ],
  };
  const run = (stages?: ProgressFile["stages"]) =>
    computeProgress(
      input({
        workflow: lint,
        featureProgress: mark({ Build: { confirmed: at }, ...stages }),
      }),
    );

  it("stays unmet until a pass is recorded, and carries its command", () => {
    const p = run();
    expect(p.stages[1].state).toBe("current");
    expect(p.stages[1].gate).toBe("check");
    expect(p.stages[1].check).toBe("pnpm lint {{ feature }}");
    expect(p.stages[1].markedAt).toBeNull();
  });

  it("passes on a recorded pass and keeps its time", () => {
    const p = run({ Lint: { "check passed": at } });
    expect(p.stages[1].state).toBe("done");
    expect(p.stages[1].markedAt).toBe(at);
    expect(p.current).toBe(2);
  });

  it("keeps Next pressable on a check stage, since Next runs the check", () => {
    const p = run();
    expect(headerActions(p, 1)).toMatchObject({
      next: "Ship",
      nextEnabled: true,
      recheck: true,
    });
    expect(headerActions(p, 0).recheck).toBe(false);
    expect(headerActions(p, 2).recheck).toBe(false);
  });
});

describe("a scope: repo stage", () => {
  const repoOnly = (over: Partial<ProgressInput>) =>
    computeProgress(input({ featureFiles: [], ...over })).stages[0];

  it("resolves produces against the repo files and is done in every feature", () => {
    for (const featureFiles of [[], ["spec.md"]]) {
      const s = repoOnly({ repoFiles, featureFiles });
      expect(s.state).toBe("done");
      expect(s.repoScoped).toBe(true);
    }
    expect(
      repoOnly({
        repoFiles: [],
        featureFiles: ["docs/agents/issue-tracker.md"],
      }).state,
    ).toBe("current");
  });

  it("records in the repo-root progress.yaml, not the feature's", () => {
    const setup: Workflow = {
      ...mattPocock,
      stages: [
        stage("Setup", { scope: "repo", done_when: "confirm" }),
        stage("Grill", { done_when: "confirm" }),
      ],
    };
    const base = { workflow: setup, featureFiles: [] };
    expect(
      computeProgress(
        input({ ...base, repoProgress: mark({ Setup: { confirmed: at } }) }),
      ).stages[0].state,
    ).toBe("done");
    expect(
      computeProgress(
        input({ ...base, featureProgress: mark({ Setup: { confirmed: at } }) }),
      ).stages[0].state,
    ).toBe("current");
  });
});

describe("ageOf", () => {
  const now = new Date("2026-11-03T12:00:00Z");
  it("reads a pass's age", () => {
    expect(ageOf("2026-11-03T11:59:40Z", now)).toBe("just now");
    expect(ageOf("2026-11-03T11:55:00Z", now)).toBe("5 min ago");
    expect(ageOf("2026-11-03T09:00:00Z", now)).toBe("3 h ago");
    expect(ageOf("2026-11-01T12:00:00Z", now)).toBe("2 d ago");
  });
});

describe("routes", () => {
  it("lists the workflow's routes and which stages override", () => {
    expect(routesOf(mattPocock)).toEqual(["wayfinder"]);
    expect(routesOf({ ...mattPocock, stages: [stage("A")] })).toEqual([]);
    expect(mattPocock.stages.map(hasRouteOverride)).toEqual([
      false,
      true,
      false,
      true,
      false,
      false,
      false,
    ]);
  });

  it("runs stages without an override unchanged on a route", () => {
    const plain = computeProgress(input()).stages;
    const way = computeProgress(input({ route: "wayfinder" })).stages;
    for (const i of [0, 2, 4, 5, 6]) {
      expect(way[i].name).toBe(plain[i].name);
      expect(way[i].gate).toBe(plain[i].gate);
      expect(way[i].produces).toEqual(plain[i].produces);
    }
    expect(way[1].name).toBe("Wayfinder");
    expect(plain[1].name).toBe("Grill");
  });

  it("ignores a route the workflow does not have", () => {
    const p = computeProgress(input({ route: "nope" }));
    expect(p.stages[1].name).toBe("Grill");
  });

  it("uses the recorded route, and the empty one as the plain route", () => {
    expect(chosenRoute(mattPocock, "wayfinder", [])).toEqual({
      route: "wayfinder",
      inferred: false,
    });
    expect(chosenRoute(mattPocock, "", ["map.md"])).toEqual({
      route: null,
      inferred: false,
    });
  });

  it("infers the Wayfinder route from a map.md when nothing is recorded", () => {
    expect(chosenRoute(mattPocock, null, ["map.md", "issues/01.md"])).toEqual({
      route: "wayfinder",
      inferred: true,
    });
    expect(chosenRoute(mattPocock, undefined, ["map.md"]).inferred).toBe(true);
    expect(chosenRoute(mattPocock, null, ["spec.md"])).toEqual({
      route: null,
      inferred: false,
    });
    expect(
      chosenRoute({ ...mattPocock, stages: [stage("A")] }, null, ["map.md"]),
    ).toEqual({ route: null, inferred: false });
  });
});

describe("the map gate", () => {
  const way = (
    facts: MapFacts | undefined,
    extra: Partial<ProgressInput> = {},
  ) =>
    computeProgress(
      input({
        route: "wayfinder",
        repoFiles: ["docs/agents/issue-tracker.md"],
        featureFiles: ["map.md"],
        mapFacts: facts,
        ...extra,
      }),
    ).stages[1];

  it("passes when the map exists, no wayfinder ticket is open and nothing is unspecified", () => {
    expect(way(cleared).gatePasses).toBe(true);
    expect(way(cleared).state).toBe("done");
  });

  it("fails on an open wayfinder ticket", () => {
    const s = way({ ...cleared, open_wayfinder: ["02-b.md"] });
    expect(s.gatePasses).toBe(false);
    expect(s.state).toBe("current");
  });

  it("fails while Not yet specified holds something", () => {
    expect(way({ ...cleared, unspecified_clear: false }).gatePasses).toBe(
      false,
    );
  });

  it("fails without a map.md or without facts, even with map.md listed", () => {
    expect(way({ ...cleared, exists: false }).gatePasses).toBe(false);
    expect(way(undefined).gatePasses).toBe(false);
  });

  it("lets Spec pass on arrival when the map's last ticket wrote spec.md", () => {
    const p = computeProgress(
      input({
        route: "wayfinder",
        repoFiles: ["docs/agents/issue-tracker.md"],
        featureFiles: ["map.md", "spec.md"],
        mapFacts: cleared,
      }),
    );
    expect(p.stages[1].state).toBe("done");
    expect(p.stages[3].state).toBe("done");
    expect(p.stages[4].state).toBe("current");
    expect(p.current).toBe(4);
  });
});
