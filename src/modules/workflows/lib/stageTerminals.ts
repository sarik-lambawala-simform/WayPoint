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

/** The stored `key -> start time` map, keeping only finite numbers. */
export function parseStarts(raw: unknown): Record<string, number> {
  const out: Record<string, number> = {};
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return out;
  for (const [k, v] of Object.entries(raw)) {
    if (typeof v === "number" && Number.isFinite(v)) out[k] = v;
  }
  return out;
}

/** The stored `key -> words` map, keeping only strings. */
export function parseWords(raw: unknown): Record<string, string> {
  const out: Record<string, string> = {};
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return out;
  for (const [k, v] of Object.entries(raw)) {
    if (typeof v === "string") out[k] = v;
  }
  return out;
}

type TerminalStatus = "running" | "ended";

export type TerminalEntry = {
  sessionId: string;
  /** When this session was started (ms since the epoch); null for one stored without it. */
  startedAt: number | null;
  /** The terminal showing the stage; null when it is not on this run of the app. */
  leaf: number | null;
  status: TerminalStatus;
  /** A `claude -p` stage: nothing to resume. */
  unattended: boolean;
  /** What the user wrote when starting it, sent after the stage's command; a re-run offers it again. */
  words: string;
};

/** By the stage's plain name. */
export type TerminalEntries = Record<string, TerminalEntry>;

export type TerminalAction =
  | {
      type: "restore";
      ids: Record<string, string>;
      starts?: Record<string, number>;
      words?: Record<string, string>;
    }
  | {
      type: "start";
      key: string;
      sessionId: string;
      startedAt: number;
      leaf: number;
      unattended: boolean;
      words: string;
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
          startedAt: action.starts?.[key] ?? null,
          leaf: null,
          status: "ended",
          unattended: false,
          words: action.words?.[key] ?? "",
        };
      }
      return next;
    }
    case "start":
      return {
        ...state,
        [action.key]: {
          sessionId: action.sessionId,
          startedAt: action.startedAt,
          leaf: action.leaf,
          status: "running",
          unattended: action.unattended,
          words: action.words,
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
const STARTS_KEY = "started";
const WORDS_KEY = "words";

async function loadSessions(): Promise<Record<string, string>> {
  return parseSessions(await store.get<unknown>(KEY));
}

let writes: Promise<void> = Promise.resolve();

/** Writes are chained: two stages started together must not lose one of the ids. */
export function saveSession(
  featureDir: string,
  stageKey: string,
  sessionId: string,
  startedAt: number,
  words: string,
): Promise<void> {
  const next = writes.then(async () => {
    const all = await loadSessions();
    const starts = parseStarts(await store.get<unknown>(STARTS_KEY));
    const stored = parseWords(await store.get<unknown>(WORDS_KEY));
    const key = sessionKey(featureDir, stageKey);
    all[key] = sessionId;
    starts[key] = startedAt;
    if (words) stored[key] = words;
    else delete stored[key];
    await store.set(KEY, all);
    await store.set(STARTS_KEY, starts);
    await store.set(WORDS_KEY, stored);
  });
  writes = next.catch(() => {});
  return next;
}

/** The ids and start times stored for one feature folder, by stage key. */
export async function loadFeatureSessions(featureDir: string): Promise<{
  ids: Record<string, string>;
  starts: Record<string, number>;
  words: Record<string, string>;
}> {
  const prefix = `${featureDir}\u0000`;
  const ids: Record<string, string> = {};
  const starts: Record<string, number> = {};
  const words: Record<string, string> = {};
  for (const [k, id] of Object.entries(await loadSessions())) {
    if (k.startsWith(prefix)) ids[k.slice(prefix.length)] = id;
  }
  for (const [k, t] of Object.entries(
    parseStarts(await store.get<unknown>(STARTS_KEY)),
  )) {
    if (k.startsWith(prefix)) starts[k.slice(prefix.length)] = t;
  }
  for (const [k, w] of Object.entries(
    parseWords(await store.get<unknown>(WORDS_KEY)),
  )) {
    if (k.startsWith(prefix)) words[k.slice(prefix.length)] = w;
  }
  return { ids, starts, words };
}
