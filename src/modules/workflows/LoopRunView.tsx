import { Button } from "@/components/ui/button";
import { IS_LINUX } from "@/lib/platform";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { startLoop } from "./lib/api";
import {
  DEFAULT_LAUNCH,
  type LaunchContext,
  type LiveRun,
  launchArgs,
  launchLine,
  relativeTo,
  runDirFor,
  startBlockedBy,
  startButtonLabel,
} from "./lib/loopLaunch";
import { LoopLaunchForm } from "./LoopLaunchForm";
import { TicketTerminalArea, type TicketTerminalsApi } from "./TicketTerminals";
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

export type LaunchTarget = {
  repoRoot: string;
  featureDir: string;
  /** Live runs of the repo, whatever feature they work on. */
  live: LiveRun[];
  onStarted: () => void;
};

export const RUN_TONE: Record<RunStatus, string> = {
  live: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  finished: "bg-muted text-muted-foreground",
  died: "bg-destructive/15 text-destructive",
};

/** The Loop stage: the newest run's header, then every build ticket with its time and cost. */
export function LoopRunView({
  view,
  launch,
  terminals,
  feature = "",
  active = true,
}: {
  view: View | null;
  launch?: LaunchTarget;
  /** The ticket terminals; without them the list only lists. */
  terminals?: TicketTerminalsApi;
  feature?: string;
  /** The Loop is on screen, so its shown terminal is visible. */
  active?: boolean;
}) {
  const [formOpen, setFormOpen] = useState(false);
  const [options, setOptions] = useState(DEFAULT_LAUNCH);
  const [starting, setStarting] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);
  // A live run counts its time on, and a died run counts the silence.
  const ticking = Boolean(view?.run && view.run.status !== "finished");
  const now = useNow(ticking || formOpen);
  if (!view) return null;
  const { run, tickets } = view;
  const elapsed = run ? runElapsedSeconds(run, now) : null;
  const cost = run ? runCostText(run.cost) : null;
  const label = startButtonLabel(run?.status ?? null);
  const blocked = launch ? startBlockedBy(launch.live) : null;
  const ctx: LaunchContext | null = launch
    ? {
        featureFolder: relativeTo(launch.repoRoot, launch.featureDir),
        runDir: runDirFor(new Date(now)),
        caffeinate: IS_LINUX ? "app" : "script",
      }
    : null;
  const start = () => {
    if (!launch) return;
    // The folder is named at the click, so a form left open never starts a run that sorts before
    // an older one and hides behind it.
    const fresh: LaunchContext = {
      ...(ctx as LaunchContext),
      runDir: runDirFor(new Date()),
    };
    setStarting(true);
    setFailure(null);
    startLoop(
      launch.repoRoot,
      launchArgs(options, fresh),
      launchLine(options, fresh),
    ).then(
      () => {
        setStarting(false);
        setFormOpen(false);
        launch.onStarted();
      },
      (e) => {
        setStarting(false);
        setFailure(String(e));
      },
    );
  };
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
        {launch && label && !formOpen && (
          <Button
            size="xs"
            variant="outline"
            disabled={blocked !== null}
            title={blocked ?? undefined}
            onClick={() => setFormOpen(true)}
          >
            {label}
          </Button>
        )}
        {launch && label && !formOpen && blocked && (
          <span className="text-muted-foreground" data-testid="blocked">
            {blocked}
          </span>
        )}
        {run?.launch_line && (
          <code
            className="w-full truncate font-mono text-[11px] text-muted-foreground"
            title={run.launch_line}
            data-testid="run-launch-line"
          >
            {run.launch_line}
          </code>
        )}
      </div>
      {formOpen && ctx && (
        <LoopLaunchForm
          options={options}
          onChange={setOptions}
          ctx={ctx}
          blocked={blocked}
          failure={failure}
          starting={starting}
          onStart={start}
          onCancel={() => {
            setFormOpen(false);
            setFailure(null);
          }}
        />
      )}
      {tickets.length === 0 ? (
        !formOpen && (
          <div className="p-3 text-xs text-muted-foreground">
            This feature has no build tickets.
          </div>
        )
      ) : (
        // Hidden, not unmounted, behind the form: the ticket terminals keep running.
        <div className={cn("min-h-0 flex-1", formOpen ? "hidden" : "flex")}>
          <ul
            className={cn(
              "min-h-0 overflow-y-auto",
              terminals
                ? "w-[26rem] max-w-[45%] shrink-0 border-r border-border/60"
                : "flex-1",
            )}
            aria-label="Tickets"
          >
            {tickets.map((t) => {
              const time = ticketTimeText(t.spent, now);
              const usd = ticketCostText(t.spent);
              const chosen = terminals?.state.selected === t.number;
              const row = (
                <>
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
                </>
              );
              return (
                <li key={t.name} className="border-b border-border/40">
                  {terminals ? (
                    <button
                      type="button"
                      aria-pressed={chosen}
                      onClick={() => terminals.select(t.number)}
                      className={cn(
                        "flex w-full items-center gap-3 px-3 py-1.5 text-left text-xs hover:bg-muted/50",
                        chosen && "bg-muted",
                      )}
                    >
                      {row}
                    </button>
                  ) : (
                    <div className="flex items-center gap-3 px-3 py-1.5 text-xs">
                      {row}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
          {terminals && (
            <TicketTerminalArea
              api={terminals}
              tickets={tickets}
              run={run}
              feature={feature}
              active={active}
            />
          )}
        </div>
      )}
    </div>
  );
}
