import { useEffect, useState } from "react";
import { sessionTurns } from "./lib/api";
import type { behindTarget } from "./lib/forks";

type Target = NonNullable<ReturnType<typeof behindTarget>>;

/**
 * Turns typed into the earlier stage's claude since the shown stage forked from it. Read from
 * claude's transcript when the stage comes up and when the window regains focus, never on a timer.
 */
export function useBehindTurns(repoRoot: string, target: Target | null) {
  const [turns, setTurns] = useState<number | null>(null);
  const id = target?.sessionId;
  const since = target?.since;
  useEffect(() => {
    setTurns(null);
    if (!id || !since) return;
    let live = true;
    const read = () =>
      sessionTurns(repoRoot, id, since).then(
        (n) => live && setTurns(n),
        () => live && setTurns(null),
      );
    void read();
    window.addEventListener("focus", read);
    return () => {
      live = false;
      window.removeEventListener("focus", read);
    };
  }, [repoRoot, id, since]);
  return turns;
}
