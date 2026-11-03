import { cn } from "@/lib/utils";
import {
  diedNote,
  formatDuration,
  type LoopRunView as View,
  runCostText,
  runElapsedSeconds,
  type RunStatus,
  ticketCostText,
  ticketStatusText,
  ticketTimeText,
} from "./lib/loopRun";
import { useNow } from "./useLoopRun";

export const RUN_TONE: Record<RunStatus, string> = {
  live: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  finished: "bg-muted text-muted-foreground",
  died: "bg-destructive/15 text-destructive",
};

/** The Loop stage: the newest run's header, then every build ticket with its time and cost. */
export function LoopRunView({ view }: { view: View | null }) {
  // A live run counts its time on, and a died run counts the silence.
  const ticking = Boolean(view?.run && view.run.status !== "finished");
  const now = useNow(ticking);
  if (!view) return null;
  const { run, tickets } = view;
  const elapsed = run ? runElapsedSeconds(run, now) : null;
  const cost = run ? runCostText(run.cost) : null;
  return (
    <div className="flex h-full min-h-0 flex-col" data-testid="loop-run">
      <div className="flex shrink-0 flex-wrap items-center gap-x-4 gap-y-1 border-b border-border/60 px-3 py-2 text-xs">
        {run ? (
          <>
            <span
              className={cn(
                "rounded px-1.5 py-px text-[10px] leading-4",
                RUN_TONE[run.status],
              )}
            >
              {run.status}
            </span>
            {run.status === "died" && (
              <span className="text-destructive">{diedNote(run, now)}</span>
            )}
            {run.status === "live" && run.phase && (
              <span className="text-muted-foreground">{run.phase}</span>
            )}
            <span className="tabular-nums" title="Elapsed time of this run">
              {elapsed === null ? "—" : formatDuration(elapsed)}
            </span>
            <span
              className="tabular-nums"
              title={cost?.title ?? "Cost of this run"}
            >
              {cost?.text}
            </span>
            <span
              className="min-w-0 truncate text-muted-foreground"
              title={run.dir}
            >
              {run.id}
            </span>
          </>
        ) : (
          <span className="text-muted-foreground">
            No run of this feature yet.
          </span>
        )}
      </div>
      {tickets.length === 0 ? (
        <div className="p-3 text-xs text-muted-foreground">
          This feature has no build tickets.
        </div>
      ) : (
        <ul className="min-h-0 flex-1 overflow-y-auto" aria-label="Tickets">
          {tickets.map((t) => {
            const time = ticketTimeText(t.spent, now);
            const usd = ticketCostText(t.spent);
            return (
              <li
                key={t.name}
                className="flex items-center gap-3 border-b border-border/40 px-3 py-1.5 text-xs"
              >
                <span className="w-6 shrink-0 tabular-nums text-muted-foreground">
                  {t.number}
                </span>
                <span className="min-w-0 flex-1 truncate" title={t.name}>
                  {t.title || t.name}
                </span>
                <span
                  className={cn(
                    "shrink-0 rounded px-1.5 py-px text-[10px] leading-4",
                    t.running
                      ? RUN_TONE.live
                      : "bg-muted text-muted-foreground",
                  )}
                >
                  {ticketStatusText(t)}
                </span>
                <span
                  className="w-16 shrink-0 text-right tabular-nums"
                  title={time.title ?? undefined}
                >
                  {time.text}
                </span>
                <span
                  className="w-16 shrink-0 text-right tabular-nums"
                  title={usd.title ?? undefined}
                >
                  {usd.text}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
