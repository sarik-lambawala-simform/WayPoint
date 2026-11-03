import { cn } from "@/lib/utils";
import type { ReactNode } from "react";
import type { Workflow } from "./lib/api";
import type { Progress } from "./lib/progress";
import { StageChips } from "./StageChips";

type Props = {
  workflow: Workflow;
  featureDir: string;
  selected: number;
  onSelect: (index: number) => void;
  /** Replaces the plain workflow title, e.g. with the workflow picker. */
  picker?: ReactNode;
  /** The route picker, under the workflow picker. */
  routePicker?: ReactNode;
  /** Each stage's state, shown as a chip on its cell. */
  progress?: Progress | null;
};

/** Workflow name and feature path first, then one cell per stage in workflow order. */
export function StageBar({
  workflow,
  featureDir,
  selected,
  onSelect,
  picker,
  routePicker,
  progress,
}: Props) {
  return (
    <div
      className="flex shrink-0 items-stretch overflow-x-auto border-b border-border/60"
      role="tablist"
      aria-label="Stages"
    >
      <div className="flex min-w-48 max-w-72 shrink-0 flex-col justify-center gap-0.5 border-r border-border/60 px-3 py-2">
        {picker ?? (
          <span className="truncate text-xs font-medium">{workflow.title}</span>
        )}
        {routePicker}
        <span
          className="truncate text-[11px] text-muted-foreground"
          title={featureDir}
        >
          {featureDir}
        </span>
      </div>
      {workflow.stages.map((stage, i) => (
        <button
          key={stage.name}
          type="button"
          role="tab"
          aria-selected={i === selected}
          onClick={() => onSelect(i)}
          className={cn(
            "flex shrink-0 items-center gap-1.5 border-r border-border/60 px-4 py-2 text-xs transition-colors",
            i === selected
              ? "bg-accent text-accent-foreground"
              : "text-muted-foreground hover:bg-accent/50",
          )}
        >
          <span className="tabular-nums text-[11px] opacity-60">{i + 1}</span>
          <span>{progress?.stages[i]?.name ?? stage.name}</span>
          {progress?.stages[i] && (
            <StageChips
              state={progress.stages[i].state}
              repoScoped={progress.stages[i].repoScoped}
            />
          )}
        </button>
      ))}
    </div>
  );
}
