import { describe, expect, it } from "vitest";
import { planFeatureOpen, type Tab } from "./useTabs";

const input = {
  repoRoot: "/r",
  feature: "login",
  featureDir: "/r/.scratch/login",
};

function ids() {
  let n = 10;
  return () => n++;
}

describe("planFeatureOpen", () => {
  it("adds a feature tab in the space", () => {
    const plan = planFeatureOpen([], input, "sp1", ids());
    expect(plan.tabs).toEqual([
      {
        id: 10,
        kind: "feature",
        spaceId: "sp1",
        title: "login",
        repoRoot: "/r",
        feature: "login",
        featureDir: "/r/.scratch/login",
      },
    ]);
    expect(plan.targetId).toBe(10);
  });

  it("switches to the existing tab of the same feature in the same space", () => {
    const first = planFeatureOpen([], input, "sp1", ids());
    const again = planFeatureOpen(first.tabs, input, "sp1", ids());
    expect(again.tabs).toBe(first.tabs);
    expect(again.targetId).toBe(10);
  });

  it("keeps several feature tabs beside other tabs", () => {
    const shell = {
      id: 1,
      kind: "markdown",
      spaceId: "sp1",
      title: "x",
      path: "/x",
    } as Tab;
    const a = planFeatureOpen([shell], input, "sp1", ids());
    const b = planFeatureOpen(
      a.tabs,
      { ...input, feature: "signup", featureDir: "/r/.scratch/signup" },
      "sp1",
      ids(),
    );
    expect(b.tabs.map((t) => t.kind)).toEqual([
      "markdown",
      "feature",
      "feature",
    ]);
    // same folder in another space is its own tab
    const c = planFeatureOpen(b.tabs, input, "sp2", ids());
    expect(c.tabs).toHaveLength(4);
  });
});
