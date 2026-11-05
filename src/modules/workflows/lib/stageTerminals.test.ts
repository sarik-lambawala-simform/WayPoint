import { describe, expect, it } from "vitest";
import {
  allocateStageLeaf,
  parseSessions,
  parseStarts,
  parseWords,
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

  it("keeps only finite start times from the stored file", () => {
    expect(parseStarts({ a: 5, b: "x", c: null })).toEqual({ a: 5 });
    expect(parseStarts([1])).toEqual({});
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
      startedAt: null,
      leaf: null,
      status: "ended",
      unattended: false,
      words: "",
    });
  });

  it("runs from the moment a stage starts, with a terminal", () => {
    const s = reduceTerminals(none, {
      type: "start",
      key: "Grill",
      sessionId: A,
      startedAt: 1,
      leaf: 7,
      unattended: false,
      words: "",
    });
    expect(s.Grill).toEqual({
      sessionId: A,
      startedAt: 1,
      leaf: 7,
      status: "running",
      unattended: false,
      words: "",
    });
  });

  it("keeps the terminal and ends when claude exits", () => {
    const running = reduceTerminals(none, {
      type: "start",
      key: "Grill",
      sessionId: A,
      startedAt: 1,
      leaf: 7,
      unattended: false,
      words: "",
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
      startedAt: 1,
      leaf: 7,
      unattended: false,
      words: "",
    });
    const s = reduceTerminals(running, { type: "shell-exited", key: "Grill" });
    expect(s.Grill).toMatchObject({
      status: "ended",
      leaf: null,
      sessionId: A,
      startedAt: 1,
    });
  });

  it("resumes in the live terminal, or in a new one when there is none", () => {
    const ended: TerminalEntries = {
      Grill: {
        sessionId: A,
        startedAt: 1,
        leaf: 7,
        status: "ended",
        unattended: false,
        words: "",
      },
      Spec: {
        sessionId: B,
        startedAt: 2,
        leaf: null,
        status: "ended",
        unattended: false,
        words: "",
      },
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
      startedAt: 2,
    });
  });

  it("restores the start times next to the ids", () => {
    const s = reduceTerminals(none, {
      type: "restore",
      ids: { Grill: A },
      starts: { Grill: 99 },
    });
    expect(s.Grill.startedAt).toBe(99);
  });

  it("replaces the id, the start time and the status when a stage is started again", () => {
    const ended: TerminalEntries = {
      Spec: {
        sessionId: A,
        startedAt: 1,
        leaf: 7,
        status: "ended",
        unattended: false,
        words: "",
      },
    };
    const s = reduceTerminals(ended, {
      type: "start",
      key: "Spec",
      sessionId: B,
      startedAt: 5,
      leaf: 7,
      unattended: false,
      words: "",
    });
    expect(s.Spec).toMatchObject({
      sessionId: B,
      startedAt: 5,
      leaf: 7,
      status: "running",
    });
  });

  it("does not let a restore overwrite a stage that already has a terminal", () => {
    const running = reduceTerminals(none, {
      type: "start",
      key: "Grill",
      sessionId: A,
      startedAt: 1,
      leaf: 7,
      unattended: false,
      words: "",
    });
    const s = reduceTerminals(running, {
      type: "restore",
      ids: { Grill: B, Spec: B },
    });
    expect(s.Grill.sessionId).toBe(A);
    expect(s.Spec.sessionId).toBe(B);
  });
});

describe("the words a stage was started with", () => {
  it("keeps them on the entry, and brings them back after a restart", () => {
    const started = reduceTerminals(
      {},
      {
        type: "start",
        key: "Grill",
        sessionId: A,
        startedAt: 1,
        leaf: STAGE_LEAF_BASE,
        unattended: false,
        words: "a get user API",
      },
    );
    expect(started.Grill.words).toBe("a get user API");
    const restored = reduceTerminals(
      {},
      { type: "restore", ids: { Grill: A, Spec: B }, words: { Grill: "x" } },
    );
    expect(restored.Grill.words).toBe("x");
    expect(restored.Spec.words).toBe("");
  });

  it("reads only strings from the store", () => {
    expect(parseWords({ a: "x", b: 3, c: null })).toEqual({ a: "x" });
    expect(parseWords(["x"])).toEqual({});
    expect(parseWords(null)).toEqual({});
  });
});
