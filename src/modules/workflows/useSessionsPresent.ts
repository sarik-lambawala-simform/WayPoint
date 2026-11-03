import { useEffect, useState } from "react";
import { sessionsPresent } from "./lib/api";
import type { TerminalEntries } from "./lib/stageTerminals";

/**
 * For each stored claude session, whether its transcript is on this machine. Read when the set of
 * sessions changes and when the window regains focus, never on a timer. A session running in a
 * terminal of this run is not asked about.
 */
export function useSessionsPresent(
  repoRoot: string,
  entries: TerminalEntries,
): Record<string, boolean> {
  const ids = Object.values(entries)
    .filter((e) => !e.unattended && e.leaf === null)
    .map((e) => e.sessionId)
    .sort();
  const joined = ids.join(",");
  const [present, setPresent] = useState<Record<string, boolean>>({});
  useEffect(() => {
    if (!joined) return;
    const list = joined.split(",");
    let live = true;
    const read = () =>
      sessionsPresent(repoRoot, list).then(
        (flags) => {
          if (!live) return;
          setPresent(Object.fromEntries(list.map((id, i) => [id, flags[i]])));
        },
        (e) => console.error("could not look for the claude sessions", e),
      );
    void read();
    window.addEventListener("focus", read);
    return () => {
      live = false;
      window.removeEventListener("focus", read);
    };
  }, [repoRoot, joined]);
  return present;
}
