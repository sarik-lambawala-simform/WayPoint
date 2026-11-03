// The model of a feature's stage terminals and the store of their claude session ids. Pure,
// except the id file. Session ids live in the app's data folder, never in the feature folder.

import { LazyStore } from "@tauri-apps/plugin-store";
import { isSessionId } from "./stageCommand";

/** Terminal tabs take their ids from a counter that starts at 3; ours start far above it. */
export const STAGE_LEAF_BASE = 2 ** 30;

let nextLeaf = STAGE_LEAF_BASE;
export const allocateStageLeaf = () => nextLeaf++;

/** Key of a stage's session id: the feature folder and the stage's plain name. */
export const sessionKey = (featureDir: string, stageKey: string) =>
  `${featureDir}\u0000${stageKey}`;

/** The stored `key -> id` map, keeping only entries that are well formed. */
export function parseSessions(raw: unknown): Record<string, string> {
  const out: Record<string, string> = {};
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return out;
  for (const [k, v] of Object.entries(raw)) {
    if (typeof v === "string" && isSessionId(v)) out[k] = v;
  }
  return out;
}

/** Feature folders that have terminals but no tab any more. */
export const staleFeatureDirs = (known: string[], open: Set<string>) =>
  known.filter((d) => !open.has(d));

export type TerminalStatus = "running" | "ended";

export type TerminalEntry = {
  sessionId: string;
  /** The terminal showing the stage; null when it is not on this run of the app. */
  leaf: number | null;
  status: TerminalStatus;
  /** A `claude -p` stage: nothing to resume. */
  unattended: boolean;
};

/** By the stage's plain name. */
export type TerminalEntries = Record<string, TerminalEntry>;

export type TerminalAction =
  | { type: "restore"; ids: Record<string, string> }
  | {
      type: "start";
      key: string;
      sessionId: string;
      leaf: number;
      unattended: boolean;
    }
  | { type: "claude-exited"; key: string }
  | { type: "shell-exited"; key: string }
  | { type: "resume"; key: string; leaf: number };

export function reduceTerminals(
  state: TerminalEntries,
  action: TerminalAction,
): TerminalEntries {
  switch (action.type) {
    case "restore": {
      const next = { ...state };
      for (const [key, sessionId] of Object.entries(action.ids)) {
        if (next[key]) continue;
        next[key] = {
          sessionId,
          leaf: null,
          status: "ended",
          unattended: false,
        };
      }
      return next;
    }
    case "start":
      return {
        ...state,
        [action.key]: {
          sessionId: action.sessionId,
          leaf: action.leaf,
          status: "running",
          unattended: action.unattended,
        },
      };
    case "claude-exited": {
      const e = state[action.key];
      return e ? { ...state, [action.key]: { ...e, status: "ended" } } : state;
    }
    case "shell-exited": {
      const e = state[action.key];
      return e
        ? { ...state, [action.key]: { ...e, leaf: null, status: "ended" } }
        : state;
    }
    case "resume": {
      const e = state[action.key];
      return e
        ? {
            ...state,
            [action.key]: { ...e, leaf: action.leaf, status: "running" },
          }
        : state;
    }
  }
}

const store = new LazyStore("waypoint-stage-sessions.json", {
  defaults: {},
  autoSave: 200,
});
const KEY = "sessions";

export async function loadSessions(): Promise<Record<string, string>> {
  return parseSessions(await store.get<unknown>(KEY));
}

let writes: Promise<void> = Promise.resolve();

/** Writes are chained: two stages started together must not lose one of the ids. */
export function saveSession(
  featureDir: string,
  stageKey: string,
  sessionId: string,
): Promise<void> {
  const next = writes.then(async () => {
    const all = await loadSessions();
    all[sessionKey(featureDir, stageKey)] = sessionId;
    await store.set(KEY, all);
  });
  writes = next.catch(() => {});
  return next;
}

/** The ids stored for one feature folder, by stage key. */
export async function loadFeatureSessions(
  featureDir: string,
): Promise<Record<string, string>> {
  const prefix = `${featureDir}\u0000`;
  const out: Record<string, string> = {};
  for (const [k, id] of Object.entries(await loadSessions())) {
    if (k.startsWith(prefix)) out[k.slice(prefix.length)] = id;
  }
  return out;
}
