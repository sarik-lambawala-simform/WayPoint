import { describe, expect, it } from "vitest";
import {
  featureRel,
  forkLine,
  freshNote,
  joinNotes,
  missingSessionInput,
  freshLine,
  rerunNote,
  resumeLine,
  stageInput,
  substituteVars,
  ticketPathOf,
  unattendedLine,
  workOnThisInput,
} from "./stageCommand";

const ID = "6f1c2a52-8c0e-4a1f-9d57-3b1d3a0f6a11";
const OTHER = "0a1c2a52-8c0e-4a1f-9d57-3b1d3a0f6a22";

describe("the claude command lines", () => {
  it("starts a fresh session with the id the app picked", () => {
    expect(freshLine(ID)).toBe(`claude --session-id ${ID}`);
  });

  it("forks the previous stage's session under a new id the app picked", () => {
    expect(forkLine(ID, OTHER)).toBe(
      `claude --resume ${ID} --fork-session --session-id ${OTHER}`,
    );
  });

  it("refuses to fork from or into anything but a uuid", () => {
    expect(() => forkLine("x", OTHER)).toThrow();
    expect(() => forkLine(ID, "$(x)")).toThrow();
  });

  it("says in the terminal that a re-run keeps the old session on disk", () => {
    const note = rerunNote(ID);
    expect(note).toBe(
      `echo "Re-running: the previous session ${ID} stays on disk."`,
    );
    expect(note).not.toMatch(/claude/);
    expect(() => rerunNote("a; b")).toThrow();
  });

  it("resumes a stage's own session and nothing else", () => {
    expect(resumeLine(ID)).toBe(`claude --resume ${ID}`);
  });

  it("runs an unattended stage as claude -p with the command in double quotes", () => {
    expect(unattendedLine("/to-spec .scratch/f")).toBe(
      'claude -p "/to-spec .scratch/f"',
    );
  });

  it("escapes what a double-quoted shell string would expand", () => {
    expect(unattendedLine('say "hi" $HOME `x` \\')).toBe(
      'claude -p "say \\"hi\\" \\$HOME \\`x\\` \\\\"',
    );
  });

  it("keeps a multi-line prompt as one argument", () => {
    expect(unattendedLine("a\nb")).toBe('claude -p "a\nb"');
  });

  it("refuses an id that is not a plain uuid", () => {
    expect(() => freshLine("x; rm -rf /")).toThrow();
    expect(() => resumeLine("$(x)")).toThrow();
  });
});

describe("the text a stage types", () => {
  const vars = { feature: ".scratch/f", workflowDir: "/w" };

  it("types /<skill> <args>", () => {
    expect(
      stageInput(
        { name: "S", skill: "to-spec", args: "{{ feature }}/map.md" },
        vars,
      ),
    ).toBe("/to-spec .scratch/f/map.md");
  });

  it("types the bare slash command when there are no args", () => {
    expect(stageInput({ name: "S", skill: "grill-with-docs" }, vars)).toBe(
      "/grill-with-docs",
    );
    expect(stageInput({ name: "S", skill: "x", args: "  " }, vars)).toBe("/x");
  });

  it("types a prompt as written, placeholders filled", () => {
    expect(
      stageInput({ name: "S", prompt: "Work on {{ feature }}\nnow" }, vars),
    ).toBe("Work on .scratch/f\nnow");
  });

  it("has nothing to type for a loop stage", () => {
    expect(stageInput({ name: "Loop", run: "loop" }, vars)).toBeNull();
  });
});

describe("placeholders", () => {
  it("fills feature and workflow_dir and leaves other names alone", () => {
    expect(
      substituteVars(
        "{{feature}} {{ workflow_dir }}/x {{ other }} {{ feature",
        {
          feature: "f",
          workflowDir: "w",
        },
      ),
    ).toBe("f w/x {{ other }} {{ feature");
  });

  it("makes the feature folder relative to the repo root", () => {
    expect(featureRel("/r", "/r/.scratch/f")).toBe(".scratch/f");
    expect(featureRel("/r/", "\\r\\.scratch\\f")).toBe(".scratch/f");
  });
});

describe("when there is no session to continue", () => {
  const vars = { feature: ".scratch/f", workflowDir: "/w" };

  it("has Tickets start fresh from the spec's path", () => {
    expect(missingSessionInput({ skill: "to-tickets" }, vars)).toBe(
      "/to-tickets .scratch/f/spec.md",
    );
  });

  it("has no fallback for another stage, which stops and asks", () => {
    expect(missingSessionInput({ skill: "to-spec" }, vars)).toBeNull();
    expect(missingSessionInput({}, vars)).toBeNull();
  });

  it("notes a fresh start in the terminal without the word claude", () => {
    expect(freshNote()).not.toMatch(/claude/i);
    expect(freshNote()).toMatch(/^echo "/);
  });

  it("joins notes into one shell line", () => {
    expect(joinNotes([undefined, "echo a", "echo b"])).toBe("echo a; echo b");
    expect(joinNotes([undefined])).toBeUndefined();
  });
});

describe("Work on this", () => {
  it("opens a fresh interactive claude and types /implement with the ticket path", () => {
    expect(freshLine(ID)).toBe(`claude --session-id ${ID}`);
    expect(workOnThisInput(".scratch/f/issues/18-human.md")).toBe(
      "/implement .scratch/f/issues/18-human.md",
    );
  });

  it("refuses a path that is empty or spans lines", () => {
    expect(() => workOnThisInput("")).toThrow();
    expect(() => workOnThisInput("a.md\n/exit")).toThrow();
    expect(() => workOnThisInput("a.md\r")).toThrow();
  });

  it("names the ticket by its path from the repo root", () => {
    expect(ticketPathOf("/r", "/r/.scratch/f", "18-human.md")).toBe(
      ".scratch/f/issues/18-human.md",
    );
  });
});
