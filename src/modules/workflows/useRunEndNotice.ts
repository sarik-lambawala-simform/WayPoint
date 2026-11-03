import { osNotify } from "@/modules/agents/lib/notify";
import { useEffect, useRef } from "react";
import type { RunView } from "./lib/loopRun";
import { endNotice, START_WATCH, stepEndWatch } from "./lib/runEnd";
import { announce, browserNoticeEnv } from "./lib/runEndNotice";

const repoName = (root: string) =>
  root.split(/[\\/]/).filter(Boolean).pop() ?? root;

/**
 * Tells the developer, through the OS, when a run this app saw live has ended; `openLoop` runs
 * when they come back through the notice. The feature tab stays mounted while hidden, so this
 * sees the run end whichever tab is shown.
 */
export function useRunEndNotice(
  run: RunView | null,
  repoRoot: string,
  feature: string,
  openLoop: () => void,
) {
  const watch = useRef(START_WATCH);
  const open = useRef(openLoop);
  open.current = openLoop;
  useEffect(() => {
    const step = stepEndWatch(watch.current, run);
    watch.current = step.watch;
    if (!step.ended) return;
    const notice = endNotice(
      repoName(repoRoot),
      feature,
      step.ended,
      Date.now(),
    );
    void announce(
      browserNoticeEnv(async (n) => osNotify(n.title, n.body)),
      notice,
      () => open.current(),
    );
  }, [run, repoRoot, feature]);
}
