import type { ReactNode } from "react";
import { TerminalPane } from "@/modules/terminal/TerminalPane";
import type { TerminalEntries } from "./lib/stageTerminals";

type Props = {
  entries: TerminalEntries;
  /** The stage whose terminal fills the tab; null when none does. */
  shownKey: string | null;
  /** The feature tab is the active tab. */
  active: boolean;
  repoRoot: string;
  onShellExit: (leaf: number) => void;
  /** Above the terminal, for the shown stage (the "ended, Resume" bar). */
  bar?: ReactNode;
};

/**
 * Every stage terminal of the feature stays mounted and running; only the shown one is visible.
 * The area layer is the one the WebGPU renderer draws this stack's panes into.
 */
export function StageTerminalHost({
  entries,
  shownKey,
  active,
  repoRoot,
  onShellExit,
  bar,
}: Props) {
  return (
    <div className="flex h-full min-h-0 flex-col">
      {bar}
      <div className="min-h-0 flex-1 px-3 py-2">
        <div data-terminal-stack="" className="relative h-full w-full">
          <div
            data-terminal-area=""
            aria-hidden="true"
            className="zoom-exempt pointer-events-none absolute inset-0 overflow-hidden"
          />
          {Object.entries(entries).map(([key, e]) =>
            e.leaf === null ? null : (
              <div
                key={e.leaf}
                className="absolute inset-0"
                aria-hidden={key !== shownKey}
              >
                <TerminalPane
                  leafId={e.leaf}
                  visible={active && key === shownKey}
                  focused={active && key === shownKey}
                  initialCwd={repoRoot}
                  onExit={onShellExit}
                />
              </div>
            ),
          )}
        </div>
      </div>
    </div>
  );
}
