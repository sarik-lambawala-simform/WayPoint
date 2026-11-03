import { Channel, invoke } from "@tauri-apps/api/core";
import { useEffect, useState } from "react";
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
