import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { StageProgress } from "./lib/progress";
import { StageHeader } from "./StageHeader";

const stage: StageProgress = {
  name: "Spec",
  key: "Spec",
  state: "current",
  gate: "produces",
  gatePasses: false,
  optional: false,
  repoScoped: false,
  produces: ["spec.md", "notes/*.txt"],
  produced: ["spec.md"],
  markedAt: null,
};

const render = (
  actions: Partial<Parameters<typeof StageHeader>[0]["actions"]>,
) =>
  renderToStaticMarkup(
    <StageHeader
      stage={stage}
      actions={{
        next: null,
        nextEnabled: false,
        done: false,
        skip: false,
        ...actions,
      }}
      pathOf={(p) => `/r/.scratch/login/${p}`}
      onOpen={() => {}}
      onNext={() => {}}
      onDone={() => {}}
      onSkip={() => {}}
    />,
  );

describe("StageHeader", () => {
  it("shows the stage name, its chip and its produced files as links", () => {
    const html = render({});
    expect(html).toContain("Spec");
    expect(html).toContain("current");
    expect(html).toContain('title="/r/.scratch/login/spec.md"');
  });

  it("disables Next while the gate fails and enables it once it passes", () => {
    expect(render({ next: "Tickets", nextEnabled: false })).toMatch(
      /<button[^>]* disabled=""[^>]*>Next: (<!-- -->)?Tickets/,
    );
    expect(render({ next: "Tickets", nextEnabled: true })).not.toMatch(
      / disabled=""/,
    );
  });

  it("shows Done and Skip only when asked", () => {
    expect(render({})).not.toContain(">Done<");
    expect(render({})).not.toContain(">Skip<");
    expect(render({ done: true, skip: true })).toContain(">Done<");
    expect(render({ done: true, skip: true })).toContain(">Skip<");
  });
});
