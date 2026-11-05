import { UnfoldMoreIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import type { Catalog, WorkflowSource } from "./lib/api";

const SOURCE_LABEL: Record<WorkflowSource, string> = {
  repo: "repo",
  user: "yours",
  shipped: "shipped",
};

type ListProps = {
  catalog: Catalog;
  selectedId: string;
  onPick: (id: string) => void;
};

/** Each workflow with the file in use under it, and the files it shadows. */
export function WorkflowList({ catalog, selectedId, onPick }: ListProps) {
  return (
    <div className="flex flex-col gap-2 text-xs">
      <ul className="flex flex-col" aria-label="Workflows">
        {catalog.entries.map((e) => (
          <li key={e.id}>
            <button
              type="button"
              aria-current={e.id === selectedId}
              onClick={() => onPick(e.id)}
              className={cn(
                "flex w-full flex-col gap-0.5 rounded px-2 py-1.5 text-left hover:bg-accent/50",
                e.id === selectedId && "bg-accent text-accent-foreground",
              )}
            >
              <span className="flex items-center gap-1.5">
                <span className="font-medium">{e.workflow.title}</span>
                <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                  {SOURCE_LABEL[e.source]}
                </span>
              </span>
              <span className="break-all text-[11px] text-muted-foreground">
                {e.path}
              </span>
              {e.shadows.map((s) => (
                <span
                  key={s.path}
                  className="break-all text-[11px] text-muted-foreground"
                >
                  shadows {SOURCE_LABEL[s.source]}: {s.path}
                </span>
              ))}
            </button>
          </li>
        ))}
      </ul>
      {catalog.errors.length > 0 && (
        <ul className="flex flex-col gap-1 border-t border-border/60 pt-2">
          {catalog.errors.map((e) => (
            <li
              key={`${e.file}:${e.line}`}
              className="break-all text-[11px] text-destructive"
            >
              {e.file}:{e.line}: {e.message}
            </li>
          ))}
        </ul>
      )}
      <p className="break-all border-t border-border/60 pt-2 text-[11px] text-muted-foreground">
        Your workflows folder: {catalog.user_dir || "unknown"}
      </p>
    </div>
  );
}

type PickerProps = ListProps & { title: string };

/** The first cell of the stage bar: the workflow in use, and a list to change it. */
export function WorkflowPicker({ title, ...list }: PickerProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="flex min-w-0 items-center gap-1 text-left text-xs font-medium hover:text-foreground/80"
          aria-label="Choose the workflow"
        >
          <span className="truncate">{title}</span>
          <HugeiconsIcon
            icon={UnfoldMoreIcon}
            size={12}
            className="shrink-0 opacity-60"
          />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="max-h-96 w-96 overflow-y-auto">
        <WorkflowList {...list} />
      </PopoverContent>
    </Popover>
  );
}
