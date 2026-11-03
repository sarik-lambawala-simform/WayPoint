import { describe, expect, it } from "vitest";
import {
  behindNote,
  behindTarget,
  forkFromId,
  forkParent,
  type ForkStage,
  outOfDate,
  rerunClearsConfirmed,
} from "./forks";
import type { TerminalEntries, TerminalEntry } from "./stageTerminals";

const id = (n: number) =>
  `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const entry = (n: number, startedAt: number | null): TerminalEntry => ({
  sessionId: id(n),
  startedAt,
  leaf: null,
  status: "ended",
  unattended: false,
});

const stages: ForkStage[] = [
  { key: "Grill", session: null },
  { key: "Prototype", session: "continue" },
  { key: "Spec", session: "continue" },
  { key: "Tickets", session: "continue" },
];

describe("which session a stage forks", () => {
  it("forks the last stage before it that ran, passing over a skipped one", () => {
    const entries: TerminalEntries = { Grill: entry(1, 10) };
    expect(forkParent(stages, entries, 2)).toBe("Grill");
    expect(forkFromId(stages, entries, 2)).toBe(id(1));
    const withProto: TerminalEntries = {
      ...entries,
      Prototype: entry(2, 20),
    };
    expect(forkFromId(stages, withProto, 2)).toBe(id(2));
  });

  it("forks nothing for a fresh stage or when no earlier stage ran", () => {
    expect(forkFromId(stages, { Grill: entry(1, 10) }, 0)).toBeNull();
    expect(forkFromId(stages, {}, 2)).toBeNull();
    const fresh: ForkStage[] = [
      { key: "Grill" },
      { key: "Spec", session: "fresh" },
    ];
    expect(forkFromId(fresh, { Grill: entry(1, 10) }, 1)).toBeNull();
  });

  it("does not fork an unattended stage's claude -p", () => {
    const entries: TerminalEntries = {
      Grill: { ...entry(1, 10), unattended: true },
    };
    expect(forkParent(stages, entries, 2)).toBeNull();
  });
});

describe("out of date", () => {
  const all = (g: number, p: number | null, s: number, t: number) => {
    const e: TerminalEntries = {
      Grill: entry(1, g),
      Spec: entry(3, s),
      Tickets: entry(4, t),
    };
    if (p !== null) e.Prototype = entry(2, p);
    return e;
  };

  it("flags nothing while every fork is newer than what it forked", () => {
    expect(outOfDate(stages, all(10, null, 20, 30))).toEqual({});
  });

  it("flags Spec and Tickets when Grill is run again", () => {
    expect(outOfDate(stages, all(40, null, 20, 30))).toEqual({
      Spec: "Grill",
      Tickets: "Grill",
    });
  });

  it("clears only Spec's flag when Spec is run again", () => {
    expect(outOfDate(stages, all(40, null, 50, 30))).toEqual({
      Tickets: "Grill",
    });
  });

  it("does not flag a fresh stage, a stage without an entry or an unknown time", () => {
    const entries: TerminalEntries = {
      Grill: entry(1, 40),
      Prototype: entry(2, null),
      Spec: entry(3, 20),
    };
    expect(outOfDate(stages, entries)).toEqual({ Spec: "Grill" });
    expect(
      outOfDate([{ key: "Grill" }, { key: "Spec", session: "fresh" }], {
        Grill: entry(1, 40),
        Spec: entry(3, 20),
      }),
    ).toEqual({});
  });
});

describe("behind", () => {
  it("targets the stage it forked, from the moment it started", () => {
    const entries: TerminalEntries = {
      Grill: entry(1, 10),
      Spec: entry(3, Date.UTC(2026, 10, 3, 10, 0, 0)),
    };
    expect(behindTarget(stages, entries, 2)).toEqual({
      parentKey: "Grill",
      sessionId: id(1),
      since: "2026-11-03T10:00:00.000Z",
    });
    expect(behindTarget(stages, entries, 0)).toBeNull();
    expect(behindTarget(stages, { Grill: entry(1, 10) }, 2)).toBeNull();
  });

  it("words the note, and says nothing for no turns", () => {
    expect(behindNote("Grill", "Spec", 3)).toBe(
      "Grill has 3 more turns since Spec forked",
    );
    expect(behindNote("Grill", "Spec", 1)).toBe(
      "Grill has 1 more turn since Spec forked",
    );
    expect(behindNote("Grill", "Spec", 0)).toBeNull();
    expect(behindNote("Grill", "Spec", null)).toBeNull();
  });
});

describe("re-running", () => {
  it("clears a confirm stage's own mark and nothing else", () => {
    expect(rerunClearsConfirmed({ gate: "confirm", markedAt: "t" })).toBe(true);
    expect(rerunClearsConfirmed({ gate: "confirm", markedAt: null })).toBe(
      false,
    );
    expect(rerunClearsConfirmed({ gate: "produces", markedAt: "t" })).toBe(
      false,
    );
  });
});
