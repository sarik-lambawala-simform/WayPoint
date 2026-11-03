import { Channel, invoke } from "@tauri-apps/api/core";
import { useEffect, useState } from "react";
import { loopLive } from "./lib/api";
import type { LiveRun } from "./lib/loopLaunch";
import type { LoopRunView } from "./lib/loopRun";

/**
 * The feature's newest run and build tickets, kept current by the Rust watcher (`notify` plus a
 * 1 s timer). Null until the first read, and while `enabled` is false.
 */
export function useLoopRun(
  repoRoot: string,
  featureDir: string,
  feature: string,
  enabled: boolean,
): LoopRunView | null {
  const [view, setView] = useState<LoopRunView | null>(null);
  useEffect(() => {
    if (!enabled) return;
    let stopped = false;
    let id: number | null = null;
    const onView = new Channel<LoopRunView>();
    onView.onmessage = (next) => {
      if (!stopped) setView(next);
    };
    invoke<number>("workflows_loop_watch", {
      repoRoot,
      featureDir,
      feature,
      onView,
    }).then(
      (watchId) => {
        id = watchId;
        // Unmounted before the watch came back.
        if (stopped) void invoke("workflows_loop_unwatch", { id: watchId });
      },
      (e) => console.error("could not watch the loop", e),
    );
    return () => {
      stopped = true;
      if (id !== null) void invoke("workflows_loop_unwatch", { id });
    };
  }, [repoRoot, featureDir, feature, enabled]);
  return enabled ? view : null;
}

/** A clock that ticks once a second while `running`, for the elapsed times that count on. */
export function useNow(running: boolean): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!running) return;
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [running]);
  return now;
}

/**
 * The repo's live runs, read every two seconds while `enabled` and again on `refresh`, so "Start
 * the loop" knows when another feature has one. Empty until the first read.
 */
export function useLiveRuns(
  repoRoot: string,
  enabled: boolean,
): { live: LiveRun[]; refresh: () => void } {
  const [live, setLive] = useState<LiveRun[]>([]);
  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (!enabled) return;
    let stopped = false;
    const read = () =>
      loopLive(repoRoot).then(
        (runs) => {
          if (!stopped) setLive(runs);
        },
        () => {},
      );
    void read();
    const t = setInterval(read, 2000);
    return () => {
      stopped = true;
      clearInterval(t);
    };
  }, [repoRoot, enabled, tick]);
  return { live, refresh: () => setTick((n) => n + 1) };
}
