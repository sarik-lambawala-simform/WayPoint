import { Button } from "@/components/ui/button";
import { ageOf, type HeaderActions, type StageProgress } from "./lib/progress";
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
  onRecheck?: () => void;
  /** True while a check is running. */
  checking?: boolean;
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
  onRecheck,
  checking = false,
}: Props) {
  const literal = stage.produces.filter((p) => !p.includes("*"));
  const missing = literal.filter((p) => !stage.produced.includes(p));
  return (
    <div className="flex shrink-0 flex-wrap items-center gap-x-3 gap-y-1 border-b border-border/60 px-3 py-1.5 text-xs">
      <span className="font-medium">{stage.name}</span>
      <StageChips state={stage.state} repoScoped={stage.repoScoped} />
      {stage.markedAt && (
        <span
          className="text-[11px] text-muted-foreground"
          title={new Date(stage.markedAt).toLocaleString()}
        >
          {stage.gate === "check"
            ? `check passed ${ageOf(stage.markedAt, new Date())}`
            : new Date(stage.markedAt).toLocaleString()}
        </span>
      )}
      {stage.check && (
        <code
          className="min-w-0 truncate rounded bg-muted px-1.5 py-px font-mono text-[11px]"
          title={stage.check}
        >
          $ {stage.check}
        </code>
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
        {actions.recheck && onRecheck && (
          <Button
            size="xs"
            variant="outline"
            disabled={checking}
            onClick={onRecheck}
          >
            Recheck
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
            disabled={!actions.nextEnabled || checking}
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
