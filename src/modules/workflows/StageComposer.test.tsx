import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { StageComposer } from "./StageComposer";

const render = (p: Partial<Parameters<typeof StageComposer>[0]>) =>
  renderToStaticMarkup(
    <StageComposer
      stageName="Grill"
      command="/grill-with-docs"
      ask="required"
      verb="Start"
      onStart={() => {}}
      {...p}
    />,
  );

/** The Start (or Run) button's opening tag. */
const startButton = (html: string) =>
  html.match(/<button[^>]*>(?:(?!<\/button>).)*(?:Start|Run) /)?.[0] ?? "";

describe("the composer before a stage starts", () => {
  it("keeps Start disabled on a stage that needs words until there are some", () => {
    const html = render({});
    expect(html).toContain("What&#x27;s this feature about?");
    expect(startButton(html)).toMatch(/ disabled=""/);
    expect(startButton(render({ initial: "a get user API" }))).not.toMatch(
      / disabled=""/,
    );
  });

  it("lets an optional stage start empty, and says so", () => {
    const html = render({ stageName: "Spec", command: "/to-spec", ask: null });
    expect(html).toContain("Anything to add for Spec?");
    expect(html).toContain("(optional)");
    expect(startButton(html)).not.toMatch(/ disabled=""/);
    expect(html).toContain("Start Spec</button>");
    expect(render({ ask: "optional", initial: "x" })).toContain(
      "Start Grill with note",
    );
  });

  it("offers the last run's words on a re-run, which can be called off", () => {
    const html = render({ initial: "a get user API", onCancel: () => {} });
    expect(html).toContain(">a get user API</textarea>");
    expect(html).toContain("Cancel");
    expect(render({})).not.toContain("Cancel");
  });

  it("says Run for an unattended stage", () => {
    expect(render({ ask: null, verb: "Run" })).toContain("Run Grill</button>");
  });
});
