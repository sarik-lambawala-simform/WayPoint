import { describe, expect, it } from "vitest";
import { fsChangeTouches, resolveMarkdownLink } from "./markdownLinks";

describe("resolveMarkdownLink", () => {
  const cur = "/repo/docs/guide/intro.md";

  it("resolves siblings and subfolders against the file's folder", () => {
    expect(resolveMarkdownLink("next.md", cur)).toBe("/repo/docs/guide/next.md");
    expect(resolveMarkdownLink("./sub/a.md", cur)).toBe(
      "/repo/docs/guide/sub/a.md",
    );
  });

  it("resolves parent segments and drops fragments and queries", () => {
    expect(resolveMarkdownLink("../README.md#top", cur)).toBe(
      "/repo/docs/README.md",
    );
    expect(resolveMarkdownLink("a.md?x=1", cur)).toBe("/repo/docs/guide/a.md");
  });

  it("decodes percent escapes", () => {
    expect(resolveMarkdownLink("my%20file.md", cur)).toBe(
      "/repo/docs/guide/my file.md",
    );
  });

  it("does not climb above the root", () => {
    expect(resolveMarkdownLink("../../../../../x.md", cur)).toBe("/x.md");
  });

  it("keeps Windows separators", () => {
    expect(resolveMarkdownLink("../b.md", "C:\\repo\\docs\\a.md")).toBe(
      "C:\\repo\\b.md",
    );
  });

  it.each([
    "https://example.com/a.md",
    "mailto:a@b.c",
    "#section",
    "/abs/a.md",
    "//host/a.md",
    "image.png",
    "dir/",
    "",
  ])("leaves %j alone", (href) => {
    expect(resolveMarkdownLink(href, cur)).toBeNull();
  });

  it("returns null for undefined and bad escapes", () => {
    expect(resolveMarkdownLink(undefined, cur)).toBeNull();
    expect(resolveMarkdownLink("%E0%A4%A.md", cur)).toBeNull();
  });
});

describe("fsChangeTouches", () => {
  it("matches the file regardless of separators", () => {
    expect(fsChangeTouches(["C:\\a\\b.md"], "C:/a/b.md")).toBe(true);
    expect(fsChangeTouches(["/a/c.md"], "/a/b.md")).toBe(false);
  });
});
