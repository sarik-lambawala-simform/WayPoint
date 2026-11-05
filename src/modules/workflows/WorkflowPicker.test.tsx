import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { Catalog } from "./lib/api";
import { WorkflowList } from "./WorkflowPicker";

const workflow = (id: string, title: string) => ({
  id,
  title,
  description: "",
  stages: [],
});

const catalog: Catalog = {
  entries: [
    {
      id: "shared",
      source: "repo",
      path: "/r/.workflows/shared.yaml",
      dir: "/r/.workflows",
      workflow: workflow("shared", "Team shared"),
      shadows: [
        {
          source: "user",
          path: "/home/u/.config/waypoint/workflows/shared.yaml",
        },
        { source: "shipped", path: "shared.yaml (shipped)" },
      ],
    },
    {
      id: "matt-pocock",
      source: "shipped",
      path: "matt-pocock.yaml (shipped)",
      dir: "",
      workflow: workflow("matt-pocock", "Matt Pocock"),
      shadows: [],
    },
  ],
  errors: [
    { file: "/r/.workflows/bad.yaml", line: 7, message: "unknown field `x`" },
  ],
  user_dir: "/home/u/.config/waypoint/workflows",
};

const html = renderToStaticMarkup(
  <WorkflowList catalog={catalog} selectedId="shared" onPick={() => {}} />,
);

describe("WorkflowList", () => {
  it("shows the file in use and the files it shadows", () => {
    expect(html).toContain("/r/.workflows/shared.yaml");
    expect(html).toContain(
      "shadows yours: /home/u/.config/waypoint/workflows/shared.yaml",
    );
    expect(html).toContain("shadows shipped: shared.yaml (shipped)");
  });

  it("marks the selected workflow", () => {
    const options = [...html.matchAll(/<button[^>]*aria-current="(\w+)"/g)];
    expect(options.map((m) => m[1])).toEqual(["true", "false"]);
  });

  it("shows load errors with file and line", () => {
    expect(html).toContain("/r/.workflows/bad.yaml:7: unknown field `x`");
  });

  it("shows the real path of the user workflows folder", () => {
    expect(html).toContain(
      "Your workflows folder: /home/u/.config/waypoint/workflows",
    );
  });
});
