import { Button } from "@/components/ui/button";
import type { HeaderActions, StageProgress } from "./lib/progress";
import { StageChips } from "./StageChips";

type Props = {
  stage: StageProgress;
  actions: HeaderActions;
  /** Absolute path of a produced file, from its path relative to the stage's folder. */
  pathOf: (relative: string) => string;
  onOpen: (path: string) => void;
  onNext: () => void;
  onDone: () => void;
  onSkip: () => void;
};

/** One line under the stage bar: the stage, its chips, what it produced, and what to do next. */
export function StageHeader({
  stage,
  actions,
  pathOf,
  onOpen,
  onNext,
  onDone,
  onSkip,
}: Props) {
  const unmatched = stage.produces.filter((p) => !p.includes("*"));
  const missing = unmatched.filter((p) => !stage.produced.includes(p));
  return (
    <div className="flex shrink-0 flex-wrap items-center gap-x-3 gap-y-1 border-b border-border/60 px-3 py-1.5 text-xs">
      <span className="font-medium">{stage.name}</span>
      <StageChips state={stage.state} />
      {stage.markedAt && (
        <span className="text-[11px] text-muted-foreground">
          {new Date(stage.markedAt).toLocaleString()}
        </span>
      )}
      {(stage.produced.length > 0 || missing.length > 0) && (
        <span className="flex min-w-0 flex-wrap items-center gap-x-2 text-[11px]">
          <span className="text-muted-foreground">produces</span>
          {stage.produced.map((p) => (
            <button
              key={p}
              type="button"
              className="truncate text-primary underline-offset-2 hover:underline"
              title={pathOf(p)}
              onClick={() => onOpen(pathOf(p))}
            >
              {p}
            </button>
          ))}
          {missing.map((p) => (
            <span key={p} className="text-muted-foreground">
              {p}
            </span>
          ))}
        </span>
      )}
      <span className="ml-auto flex items-center gap-1.5">
        {actions.skip && (
          <Button size="xs" variant="ghost" onClick={onSkip}>
            Skip
          </Button>
        )}
        {actions.done && (
          <Button size="xs" variant="outline" onClick={onDone}>
            Done
          </Button>
        )}
        {actions.next && (
          <Button
            size="xs"
            disabled={!actions.nextEnabled}
            onClick={onNext}
            title={
              actions.nextEnabled
                ? undefined
                : `${stage.name} is not finished yet`
            }
          >
            Next: {actions.next} →
          </Button>
        )}
      </span>
    </div>
  );
}
