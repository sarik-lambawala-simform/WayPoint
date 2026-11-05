import { describe, expect, it } from "vitest";
import type { Tab } from "@/modules/tabs";
import { isSerializableTab } from "@/modules/spaces/lib/serialize";
import { featureEntries, planRestore } from "./featureStore";

const featureTab: Tab = {
  id: 7,
  kind: "feature",
  spaceId: "sp1",
  title: "login",
  repoRoot: "/r",
  feature: "login",
  featureDir: "/r/.scratch/login",
};

describe("featureStore", () => {
  it("Terax's tab saving leaves feature tabs out", () => {
    expect(isSerializableTab(featureTab)).toBe(false);
  });

  it("lists feature tabs only", () => {
    const shell = {
      id: 1,
      kind: "markdown",
      spaceId: "sp1",
      title: "x",
      path: "/x",
    } as Tab;
    expect(featureEntries([shell, featureTab])).toEqual([
      { spaceId: "sp1", repoRoot: "/r", feature: "login" },
    ]);
  });

  it("restores only known spaces and folders that still exist", () => {
    const saved = [
      { spaceId: "sp1", repoRoot: "/r", feature: "login" },
      { spaceId: "gone", repoRoot: "/r", feature: "login" },
      { spaceId: "sp1", repoRoot: "/r", feature: "deleted" },
      { spaceId: "sp1", repoRoot: "/other", feature: "x" },
      { nonsense: true },
    ];
    const out = planRestore(saved, new Set(["sp1"]), (root) =>
      root === "/r" ? new Set(["login"]) : undefined,
    );
    expect(out).toEqual([{ spaceId: "sp1", repoRoot: "/r", feature: "login" }]);
    expect(planRestore("garbage", new Set(["sp1"]), () => undefined)).toEqual(
      [],
    );
  });
});
