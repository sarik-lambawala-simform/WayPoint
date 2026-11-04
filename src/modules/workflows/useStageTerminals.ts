import { useCallback, useEffect, useReducer, useRef } from "react";
import { useShallow } from "zustand/react/shallow";
import {
  disposeSession,
  leafIdForPty,
  ptyIdForLeaf,
  subscribeAgentSignals,
  useAgentActivityStore,
} from "@/modules/terminal";
import { launchClaude } from "./launchClaude";
import {
  forkLine,
  freshLine,
  joinNotes,
  rerunNote,
  resumeLine,
  unattendedLine,
} from "./lib/stageCommand";
import {
  allocateStageLeaf,
  loadFeatureSessions,
  reduceTerminals,
  saveSession,
  staleFeatureDirs,
  type TerminalAction,
  type TerminalEntries,
} from "./lib/stageTerminals";

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

export type StartRequest = {
  /** The stage's plain name. */
  key: string;
  /** `/<skill> <args>` or the prompt; claude's first message, passed on its command line. */
  input: string;
  unattended: boolean;
  /** The session this stage forks (`session: continue`); null starts a fresh session. */
  forkFrom?: string | null;
  /** A shell line (an `echo`) typed before claude starts. */
  note?: string;
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
  const [entries, dispatchRaw] = useReducer(
    reduceTerminals,
    {} as TerminalEntries,
  );
  const entriesRef = useRef<TerminalEntries>({});
  // Applied to the ref at once too, so a second exit signal in the same tick sees the ended stage.
  const dispatch = useCallback((action: TerminalAction) => {
    entriesRef.current = reduceTerminals(entriesRef.current, action);
    dispatchRaw(action);
  }, []);
  const exitRef = useRef(onUnattendedExit);
  exitRef.current = onUnattendedExit;

  useEffect(() => {
    let live = true;
    loadFeatureSessions(featureDir).then(
      ({ ids, starts }) => live && dispatch({ type: "restore", ids, starts }),
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

  const launch = useCallback(
    (leaf: number, line: string, note?: string) =>
      launchClaude(repoRoot, leaf, line, note),
    [repoRoot],
  );

  /**
   * Starts a stage, or re-runs it when it has an entry: only while its claude is not running. A
   * re-run takes a new session id (forked again from `forkFrom`) and keeps the shell it has.
   */
  const start = useCallback(
    ({ key, input, unattended, forkFrom, note: extra }: StartRequest) => {
      const previous = entriesRef.current[key];
      if (previous?.status === "running") return;
      const sessionId = crypto.randomUUID();
      const startedAt = Date.now();
      const leaf = previous?.leaf ?? allocateStageLeaf();
      if (previous?.leaf == null) remember(featureDir, leaf);
      dispatch({ type: "start", key, sessionId, startedAt, leaf, unattended });
      if (!unattended)
        void saveSession(featureDir, key, sessionId, startedAt).catch((e) =>
          console.error("could not store the stage session", e),
        );
      const line = unattended
        ? unattendedLine(input)
        : forkFrom
          ? forkLine(forkFrom, sessionId, input)
          : freshLine(sessionId, input);
      const note = joinNotes([
        previous && !previous.unattended
          ? rerunNote(previous.sessionId)
          : undefined,
        extra,
      ]);
      void launch(leaf, line, note);
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
      void launch(leaf, resumeLine(e.sessionId));
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

/** For each stage, whether its claude is mid-turn (working, not waiting for the user). */
export function useWorkingStages(
  entries: TerminalEntries,
): Record<string, boolean> {
  return useAgentActivityStore(
    useShallow((s) => {
      const working: Record<string, boolean> = {};
      for (const [key, e] of Object.entries(entries)) {
        if (e.leaf === null || e.status !== "running") continue;
        const pty = ptyIdForLeaf(e.leaf);
        working[key] = pty !== null && s.phases[pty] === "working";
      }
      return working;
    }),
  );
}
