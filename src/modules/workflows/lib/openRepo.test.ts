import { describe, expect, it } from "vitest";
import { planOpenRepo } from "./openRepo";

describe("planOpenRepo", () => {
  it("switches to the space already rooted at the repo", () => {
    const spaces = [{ id: "a", root: "/work/app" }];
    expect(planOpenRepo(spaces, "/work/app/")).toEqual({
      kind: "switch",
      spaceId: "a",
    });
  });

  it("creates a space named after the repo folder otherwise", () => {
    expect(planOpenRepo([{ id: "a", root: "/x" }], "/work/app")).toEqual({
      kind: "create",
      name: "app",
      root: "/work/app",
    });
  });
});
