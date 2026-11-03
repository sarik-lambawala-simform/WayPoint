import { invoke } from "@tauri-apps/api/core";
import { useCallback, useEffect, useReducer, useRef } from "react";
import { useShallow } from "zustand/react/shallow";
import { native } from "@/modules/ai/lib/native";
import {
  disposeSession,
  leafIdForPty,
  ptyIdForLeaf,
  subscribeAgentSignals,
  useAgentActivityStore,
  whenSessionReady,
  writeToSession,
} from "@/modules/terminal";
import { freshLine, resumeLine, unattendedLine } from "./lib/stageCommand";
import {
  allocateStageLeaf,
  loadFeatureSessions,
  reduceTerminals,
  saveSession,
  staleFeatureDirs,
  type TerminalEntries,
} from "./lib/stageTerminals";

/** claude has been started; its TUI needs this long before typed text lands in its prompt. */
const CLAUDE_READY_MS = 3000;
const SUBMIT_GAP_MS = 150;
const START_TIMEOUT_MS = 15_000;

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/** Terminal leaves per feature folder, so closing a feature tab can dispose them. */
const leavesByFeature = new Map<string, Set<number>>();

function remember(featureDir: string, leaf: number) {
  let set = leavesByFeature.get(featureDir);
  if (!set) leavesByFeature.set(featureDir, (set = new Set()));
  set.add(leaf);
}

/** Kills the terminals of every feature folder that no longer has a tab. */
export function disposeClosedFeatures(openDirs: Set<string>) {
  for (const dir of staleFeatureDirs([...leavesByFeature.keys()], openDirs)) {
    for (const leaf of leavesByFeature.get(dir) ?? []) disposeSession(leaf);
    leavesByFeature.delete(dir);
  }
}

/** Resolves true on the first `started` signal of `pty`, false after the timeout. */
function whenClaudeStarted(pty: number): {
  done: Promise<boolean>;
  stop: () => void;
} {
  let stop = () => {};
  const done = new Promise<boolean>((resolve) => {
    const timer = setTimeout(() => resolve(false), START_TIMEOUT_MS);
    const off = subscribeAgentSignals((s) => {
      if (s.id === pty && (s.kind === "started" || s.kind === "working")) {
        resolve(true);
      }
    });
    stop = () => {
      clearTimeout(timer);
      off();
    };
  }).finally(() => stop());
  return { done, stop };
}

export type StartRequest = {
  /** The stage's plain name. */
  key: string;
  /** `/<skill> <args>` or the prompt; typed into claude once it is up. */
  input: string;
  unattended: boolean;
};

/**
 * One terminal per started stage of a feature, in the repo root. Each runs a real claude and
 * stays mounted and running while another stage is shown. Imperative shell around
 * `reduceTerminals`; the command lines come from `stageCommand`.
 */
export function useStageTerminals(
  featureDir: string,
  repoRoot: string,
  onUnattendedExit: (key: string) => void,
) {
  const [entries, dispatch] = useReducer(
    reduceTerminals,
    {} as TerminalEntries,
  );
  const entriesRef = useRef(entries);
  entriesRef.current = entries;
  const exitRef = useRef(onUnattendedExit);
  exitRef.current = onUnattendedExit;

  useEffect(() => {
    let live = true;
    loadFeatureSessions(featureDir).then(
      (ids) => live && dispatch({ type: "restore", ids }),
      (e) => console.error("could not read the stage sessions", e),
    );
    return () => {
      live = false;
    };
  }, [featureDir]);

  // claude exiting inside a terminal leaves the shell: the stage is ended, the terminal stays.
  useEffect(
    () =>
      subscribeAgentSignals((s) => {
        if (s.kind !== "exited") return;
        const leaf = leafIdForPty(s.id);
        if (leaf === null) return;
        for (const [key, e] of Object.entries(entriesRef.current)) {
          if (e.leaf !== leaf || e.status !== "running") continue;
          dispatch({ type: "claude-exited", key });
          if (e.unattended) exitRef.current(key);
        }
      }),
    [],
  );

  const onShellExit = useCallback((leaf: number) => {
    for (const [key, e] of Object.entries(entriesRef.current)) {
      if (e.leaf !== leaf) continue;
      const wasRunning = e.status === "running";
      dispatch({ type: "shell-exited", key });
      disposeSession(leaf);
      if (wasRunning && e.unattended) exitRef.current(key);
    }
  }, []);

  /** Types `line` once the terminal's shell is ready, then `input` once claude is up. */
  const launch = useCallback(
    async (leaf: number, line: string, input: string | null) => {
      await native.workspaceAuthorize(repoRoot).catch(() => {});
      await invoke("agent_enable_hooks", { agent: "claude" }).catch((e) =>
        console.warn("[waypoint] could not enable claude notifications:", e),
      );
      await whenSessionReady(leaf);
      const pty = ptyIdForLeaf(leaf);
      const started =
        input !== null && pty !== null ? whenClaudeStarted(pty) : null;
      if (!writeToSession(leaf, `${line}\r`)) {
        started?.stop();
        console.error(`[waypoint] stage terminal ${leaf} closed before launch`);
        return;
      }
      if (!started || input === null) return;
      if (!(await started.done)) return;
      await sleep(CLAUDE_READY_MS);
      if (!writeToSession(leaf, input)) return;
      await sleep(SUBMIT_GAP_MS);
      writeToSession(leaf, "\r");
    },
    [repoRoot],
  );

  const start = useCallback(
    ({ key, input, unattended }: StartRequest) => {
      const sessionId = crypto.randomUUID();
      const leaf = allocateStageLeaf();
      remember(featureDir, leaf);
      dispatch({ type: "start", key, sessionId, leaf, unattended });
      if (!unattended)
        void saveSession(featureDir, key, sessionId).catch((e) =>
          console.error("could not store the stage session", e),
        );
      void launch(
        leaf,
        unattended ? unattendedLine(input) : freshLine(sessionId),
        unattended ? null : input,
      );
    },
    [featureDir, launch],
  );

  /** `claude --resume <its own id>` in the live shell, or in a new terminal when there is none. */
  const resume = useCallback(
    (key: string) => {
      const e = entriesRef.current[key];
      if (!e || e.unattended || e.status === "running") return;
      const leaf = e.leaf ?? allocateStageLeaf();
      if (e.leaf === null) remember(featureDir, leaf);
      dispatch({ type: "resume", key, leaf });
      void launch(leaf, resumeLine(e.sessionId), null);
    },
    [featureDir, launch],
  );

  return { entries, start, resume, onShellExit };
}

/** For each stage, whether a claude is running in its terminal. */
export function useLiveStages(
  entries: TerminalEntries,
): Record<string, boolean> {
  return useAgentActivityStore(
    useShallow((s) => {
      const live: Record<string, boolean> = {};
      for (const [key, e] of Object.entries(entries)) {
        if (e.leaf === null || e.status !== "running") continue;
        const pty = ptyIdForLeaf(e.leaf);
        live[key] = pty !== null && pty in s.phases;
      }
      return live;
    }),
  );
}
