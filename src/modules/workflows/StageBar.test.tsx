import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { Workflow } from "./lib/api";
import { StageBar } from "./StageBar";

const workflow: Workflow = {
  id: "matt-pocock",
  title: "Matt Pocock",
  description: "",
  stages: ["Setup", "Grill", "Loop"].map((name) => ({
    name,
    optional: false,
  })),
};

describe("StageBar", () => {
  const html = renderToStaticMarkup(
    <StageBar
      workflow={workflow}
      featureDir="/r/.scratch/login"
      selected={1}
      onSelect={() => {}}
    />,
  );

  it("starts with the workflow name and the feature folder path", () => {
    expect(html.indexOf("Matt Pocock")).toBeGreaterThan(-1);
    expect(html.indexOf("/r/.scratch/login")).toBeGreaterThan(-1);
    expect(html.indexOf("Matt Pocock")).toBeLessThan(html.indexOf("Setup"));
  });

  it("has one cell per stage, in order, and marks the selected one", () => {
    const cells = [...html.matchAll(/role="tab" aria-selected="(\w+)"/g)];
    expect(cells.map((m) => m[1])).toEqual(["false", "true", "false"]);
    const order = ["Setup", "Grill", "Loop"].map((n) => html.indexOf(`>${n}<`));
    expect(order).toEqual([...order].sort((a, b) => a - b));
    expect(order.every((i) => i > -1)).toBe(true);
  });
});
