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
  check: null,
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
        recheck: false,
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

  it("shows a check's command and the age of its pass, and Recheck", () => {
    const html = renderToStaticMarkup(
      <StageHeader
        stage={{
          ...stage,
          gate: "check",
          state: "done",
          check: "pnpm lint",
          markedAt: new Date(Date.now() - 5 * 60_000).toISOString(),
        }}
        actions={{
          next: "Ship",
          nextEnabled: true,
          done: false,
          skip: false,
          recheck: true,
        }}
        pathOf={(p) => p}
        onOpen={() => {}}
        onNext={() => {}}
        onDone={() => {}}
        onSkip={() => {}}
        onRecheck={() => {}}
      />,
    );
    expect(html).toContain("$ pnpm lint");
    expect(html).toContain("check passed 5 min ago");
    expect(html).toContain(">Recheck<");
  });

  it("labels a done repo stage as repo-wide", () => {
    expect(
      renderToStaticMarkup(
        <StageHeader
          stage={{ ...stage, state: "done", repoScoped: true }}
          actions={{
            next: null,
            nextEnabled: false,
            done: false,
            skip: false,
            recheck: false,
          }}
          pathOf={(p) => p}
          onOpen={() => {}}
          onNext={() => {}}
          onDone={() => {}}
          onSkip={() => {}}
        />,
      ),
    ).toContain("done (repo-wide)");
  });
});
