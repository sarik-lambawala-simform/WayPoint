import { cn } from "@/lib/utils";
import type { StageState } from "./lib/progress";

const LABEL: Partial<Record<StageState, string>> = {
  current: "current",
  done: "done",
  skipped: "skipped",
  "not-recorded": "not recorded",
};

const TONE: Partial<Record<StageState, string>> = {
  current: "bg-primary/15 text-primary",
  done: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  skipped: "bg-muted text-muted-foreground",
  "not-recorded": "bg-amber-500/15 text-amber-700 dark:text-amber-400",
};

/** The chip for a stage's state; a stage that has not come up yet has none. */
export function StageChips({
  state,
  repoScoped = false,
}: {
  state: StageState;
  /** A `scope: repo` stage that is done is done for every feature of the repo. */
  repoScoped?: boolean;
}) {
  const label =
    state === "done" && repoScoped ? "done (repo-wide)" : LABEL[state];
  if (!label) return null;
  return (
    <span
      className={cn(
        "shrink-0 rounded px-1.5 py-px text-[10px] leading-4",
        TONE[state],
      )}
    >
      {label}
    </span>
  );
}
