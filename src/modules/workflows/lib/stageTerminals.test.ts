import { describe, expect, it } from "vitest";
import {
  allocateStageLeaf,
  parseSessions,
  reduceTerminals,
  sessionKey,
  STAGE_LEAF_BASE,
  staleFeatureDirs,
  type TerminalEntries,
} from "./stageTerminals";

const A = "6f1c2a52-8c0e-4a1f-9d57-3b1d3a0f6a11";
const B = "0a1c2a52-8c0e-4a1f-9d57-3b1d3a0f6a22";

describe("stage terminal ids", () => {
  it("never hands out an id a terminal tab can have", () => {
    const a = allocateStageLeaf();
    const b = allocateStageLeaf();
    expect(a).toBeGreaterThanOrEqual(STAGE_LEAF_BASE);
    expect(b).toBe(a + 1);
    expect(STAGE_LEAF_BASE).toBeGreaterThan(1_000_000_000);
  });

  it("keys a session by feature folder and plain stage name", () => {
    expect(sessionKey("/r/.scratch/f", "Grill")).toBe(
      "/r/.scratch/f\u0000Grill",
    );
    expect(sessionKey("/r/.scratch/f", "Grill")).not.toBe(
      sessionKey("/r/.scratch/g", "Grill"),
    );
  });

  it("keeps only well-formed ids from the stored file", () => {
    expect(parseSessions({ k: A, bad: "nope", n: 3 })).toEqual({ k: A });
    expect(parseSessions(null)).toEqual({});
    expect(parseSessions([A])).toEqual({});
  });

  it("finds the feature folders that lost their tab", () => {
    expect(staleFeatureDirs(["/a", "/b", "/c"], new Set(["/b"]))).toEqual([
      "/a",
      "/c",
    ]);
  });
});

describe("the terminals of a feature", () => {
  const none: TerminalEntries = {};

  it("comes back ended, with its id and no terminal, after a restart", () => {
    const s = reduceTerminals(none, { type: "restore", ids: { Grill: A } });
    expect(s.Grill).toEqual({
      sessionId: A,
      leaf: null,
      status: "ended",
      unattended: false,
    });
  });

  it("runs from the moment a stage starts, with a terminal", () => {
    const s = reduceTerminals(none, {
      type: "start",
      key: "Grill",
      sessionId: A,
      leaf: 7,
      unattended: false,
    });
    expect(s.Grill).toEqual({
      sessionId: A,
      leaf: 7,
      status: "running",
      unattended: false,
    });
  });

  it("keeps the terminal and ends when claude exits", () => {
    const running = reduceTerminals(none, {
      type: "start",
      key: "Grill",
      sessionId: A,
      leaf: 7,
      unattended: false,
    });
    const s = reduceTerminals(running, { type: "claude-exited", key: "Grill" });
    expect(s.Grill.status).toBe("ended");
    expect(s.Grill.leaf).toBe(7);
  });

  it("drops the terminal when the shell itself exits", () => {
    const running = reduceTerminals(none, {
      type: "start",
      key: "Grill",
      sessionId: A,
      leaf: 7,
      unattended: false,
    });
    const s = reduceTerminals(running, { type: "shell-exited", key: "Grill" });
    expect(s.Grill).toMatchObject({
      status: "ended",
      leaf: null,
      sessionId: A,
    });
  });

  it("resumes in the live terminal, or in a new one when there is none", () => {
    const ended: TerminalEntries = {
      Grill: { sessionId: A, leaf: 7, status: "ended", unattended: false },
      Spec: { sessionId: B, leaf: null, status: "ended", unattended: false },
    };
    const live = reduceTerminals(ended, {
      type: "resume",
      key: "Grill",
      leaf: 7,
    });
    expect(live.Grill).toMatchObject({ status: "running", leaf: 7 });
    const fresh = reduceTerminals(ended, {
      type: "resume",
      key: "Spec",
      leaf: 9,
    });
    expect(fresh.Spec).toMatchObject({
      status: "running",
      leaf: 9,
      sessionId: B,
    });
  });

  it("does not let a restore overwrite a stage that already has a terminal", () => {
    const running = reduceTerminals(none, {
      type: "start",
      key: "Grill",
      sessionId: A,
      leaf: 7,
      unattended: false,
    });
    const s = reduceTerminals(running, {
      type: "restore",
      ids: { Grill: B, Spec: B },
    });
    expect(s.Grill.sessionId).toBe(A);
    expect(s.Spec.sessionId).toBe(B);
  });
});
