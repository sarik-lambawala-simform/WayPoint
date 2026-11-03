import { describe, expect, it } from "vitest";
import {
  basename,
  featureDirOf,
  featureNameError,
  findSpaceByRoot,
  joinPath,
  normalizeRoot,
} from "./featurePaths";

describe("featurePaths", () => {
  it("normalizes separators and trailing slashes", () => {
    expect(normalizeRoot("C:\\repo\\")).toBe("C:/repo");
    expect(normalizeRoot("/home/a/")).toBe("/home/a");
    expect(normalizeRoot("/")).toBe("/");
  });

  it("joins without doubling slashes", () => {
    expect(joinPath("/a/b/", "c")).toBe("/a/b/c");
    expect(joinPath("/", "c")).toBe("/c");
    expect(featureDirOf("/r/", "login")).toBe("/r/.scratch/login");
  });

  it("takes the last segment", () => {
    expect(basename("/a/b/repo/")).toBe("repo");
  });

  it("validates feature names", () => {
    expect(featureNameError("login-flow")).toBeNull();
    expect(featureNameError("  ")).toMatch(/required/);
    expect(featureNameError("a/b")).toMatch(/slash/);
    expect(featureNameError("a\\b")).toMatch(/slash/);
    expect(featureNameError("..")).not.toBeNull();
    expect(featureNameError(".hidden")).toMatch(/dot/);
    expect(featureNameError("a:b")).not.toBeNull();
  });

  it("finds the space of a repo by root, ignoring trailing slashes", () => {
    const spaces = [
      { id: "a", root: null },
      { id: "b", root: "/r/one/" },
      { id: "c", root: "/r/two" },
    ];
    expect(findSpaceByRoot(spaces, "/r/one")?.id).toBe("b");
    expect(findSpaceByRoot(spaces, "/r/two/")?.id).toBe("c");
    expect(findSpaceByRoot(spaces, "/r/three")).toBeUndefined();
  });
});
