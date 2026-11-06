import {
  KanbanIcon,
  LeftToRightListBulletIcon,
  PlayIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { IS_LINUX, IS_WINDOWS } from "@/lib/platform";
import { cn } from "@/lib/utils";
import {
  listFiles,
  markTicketDone,
  startLoop,
  stopLoop,
  wslCheck,
  wslDistro,
} from "./lib/api";
import { isDoneStatus, unblockedBy, unblockedText } from "./lib/humanTicket";
import { docsOf, headCount, panelTabFor } from "./lib/loopBoard";
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
import {
  diedNote,
  formatDuration,
  runCostText,
  runElapsedSeconds,
  type RunStatus,
  type TicketRow,
  type LoopRunView as View,
} from "./lib/loopRun";
import { loopStartProblem } from "./lib/wsl";
import { LoopLaunchForm } from "./LoopLaunchForm";
import { CAPS, DocList, Rail, TicketBoard, TicketList } from "./LoopTickets";
import { TicketTerminalArea, type TicketTerminalsApi } from "./TicketTerminals";
import {
  DocText,
  PanelFrame,
  type PanelTab,
  type PanelTarget,
  TicketDetails,
} from "./TicketPanel";
import { useNow } from "./useLoopRun";

export type LaunchTarget = {
  repoRoot: string;
  featureDir: string;
  /** Live runs of the repo, whatever feature they work on. */
  live: LiveRun[];
  onStarted: () => void;
  /** A ticket file was written here, so what reads the tickets should read them again. */
  onTicketsChanged?: () => void;
};

export const RUN_TONE: Record<RunStatus, string> = {
  live: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  finished: "bg-muted text-muted-foreground",
  died: "bg-destructive/15 text-destructive",
};

/** What the side panel shows: the chosen ticket, or one of the feature's docs. */
type Panel = { kind: "ticket" } | { kind: "doc"; path: string } | null;

/** The panel's share of the Loop's width, and its bounds. */
const PANEL_WIDTH = { initial: 0.5, min: 0.3, max: 0.75 };

/** The feature folder's notes, listed again whenever `refresh` changes. */
function useDocs(featureDir: string | undefined, refresh: number) {
  const [docs, setDocs] = useState<string[] | null>(null);
  // biome-ignore lint/correctness/useExhaustiveDependencies: refresh asks for a fresh listing
  useEffect(() => {
    if (!featureDir) return;
    let live = true;
    listFiles(featureDir, [""]).then(
      (files) => live && setDocs(docsOf(files)),
      () => live && setDocs([]),
    );
    return () => {
      live = false;
    };
  }, [featureDir, refresh]);
  return docs;
}

/**
 * The Loop stage: the feature's header with its ticket rail and the run, the tickets as a list or a
 * board, the feature's docs, and a side panel per ticket with its Details and its Terminal. Every
 * ticket terminal stays mounted while the panel is closed or on Details, so a replay never restarts.
 */
export function LoopRunView({
  view,
  launch,
  terminals,
  feature = "",
  active = true,
}: {
  view: View | null;
  launch?: LaunchTarget;
  /** The ticket terminals; without them the panel has Details only. */
  terminals?: TicketTerminalsApi;
  feature?: string;
  /** The Loop is on screen, so its shown terminal is visible. */
  active?: boolean;
}) {
  const [formOpen, setFormOpen] = useState(false);
  const [options, setOptions] = useState(DEFAULT_LAUNCH);
  const [starting, setStarting] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);
  // The run id whose stop was asked for here, so "Stopping…" shows before the next read.
  const [stopAsked, setStopAsked] = useState<string | null>(null);
  const [stopFailure, setStopFailure] = useState<string | null>(null);
  // The human ticket closed here: its line, and the agent tickets that closing it unblocked.
  const [closed, setClosed] = useState<{
    number: string;
    line: string;
    unblocked: string[];
  } | null>(null);
  const [tab, setTab] = useState<"tickets" | "docs">("tickets");
  const [layout, setLayout] = useState<"list" | "board">("list");
  // A ticket chosen before this view mounted (the terminals outlive it) opens its panel again.
  const [panel, setPanel] = useState<Panel>(() =>
    terminals?.state.selected ? { kind: "ticket" } : null,
  );
  const [panelTab, setPanelTab] = useState<PanelTab>(() => {
    const t = view?.tickets.find((x) => x.number === terminals?.state.selected);
    return t ? panelTabFor(t) : "details";
  });
  // The panel's ticket. Its terminal is made only when its Terminal tab shows, so reading tickets
  // on Details builds no terminal; a ticket whose terminal outlived this view opens again.
  const [picked, setPicked] = useState<string | null>(
    () => terminals?.state.selected ?? null,
  );
  const [panelWidth, setPanelWidth] = useState(PANEL_WIDTH.initial);
  const [docsAsked, setDocsAsked] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const guideRef = useRef<HTMLDivElement>(null);
  const docs = useDocs(launch?.featureDir, docsAsked);

  // A live run counts its time on, and a died run counts the silence.
  const ticking = Boolean(view?.run && view.run.status !== "finished");
  const now = useNow(ticking || formOpen);

  const panelOpen = panel !== null;
  useEffect(() => {
    if (!panelOpen || !active) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape" || e.defaultPrevented) return;
      // A terminal, a field or an open question keeps its Esc.
      const el = e.target as Element | null;
      if (
        el?.closest?.(
          "[data-terminal-stack], input, textarea, select, [contenteditable], [role=alertdialog]",
        )
      )
        return;
      setPanel(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [panelOpen, active]);

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
        caffeinate: IS_LINUX || IS_WINDOWS ? "app" : "script",
        wsl: wslDistro()
          ? { distro: wslDistro() as string, linuxRoot: launch.repoRoot }
          : null,
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
    // On Windows the distro check runs before the Loop starts: a missing tool is named with its
    // install line, and nothing is started.
    const distro = wslDistro();
    const checked: Promise<void> = distro
      ? wslCheck(distro).then((out) => {
          const problem = loopStartProblem(distro, out);
          if (problem) throw problem;
        })
      : Promise.resolve();
    checked
      .then(() =>
        startLoop(
          launch.repoRoot,
          launchArgs(options, fresh),
          launchLine(options, fresh),
        ),
      )
      .then(
        () => {
          setStarting(false);
          setFormOpen(false);
          setClosed((c) => (c ? { ...c, unblocked: [] } : c));
          launch.onStarted();
        },
        (e) => {
          setStarting(false);
          setFailure(String(e));
        },
      );
  };
  const markDone = async (t: TicketRow) => {
    if (!launch) throw new Error("no feature folder");
    const line = await markTicketDone(launch.featureDir, t.number);
    setClosed({
      number: t.number,
      line,
      unblocked: unblockedBy(tickets, t.number),
    });
    launch.onTicketsChanged?.();
    return line;
  };
  // Offered while no run is live, for the tickets that are still waiting for the loop. The app only
  // offers: "Start the loop" opens the launch form, and a run starts only from that form.
  const unblockedIds =
    launch && closed && run?.status !== "live" && blocked === null
      ? closed.unblocked.filter((id) => {
          const t = tickets.find((x) => x.number === id);
          return t && !t.running && !isDoneStatus(t.status);
        })
      : [];
  const stopping =
    run?.status === "live" && (run.stop_requested || stopAsked === run.id);
  const stop = () => {
    if (!launch || !run) return;
    setStopAsked(run.id);
    setStopFailure(null);
    stopLoop(launch.repoRoot, run.id).catch((e) => {
      setStopAsked(null);
      setStopFailure(String(e));
    });
  };

  const ticket =
    panel?.kind === "ticket"
      ? tickets.find((t) => t.number === picked)
      : undefined;
  const showTab = (number: string, next: PanelTab) => {
    setPanelTab(next);
    if (next === "terminal") terminals?.select(number);
  };
  const openTicket = (number: string) => {
    const t = tickets.find((x) => x.number === number);
    if (!t) return;
    setPanel({ kind: "ticket" });
    setPicked(number);
    showTab(number, panelTabFor(t));
  };
  // Once a ticket's terminal exists, the area stays mounted for good.
  const terminalsMounted =
    terminals !== undefined && Object.keys(terminals.state.opened).length > 0;
  const terminalShown =
    ticket !== undefined &&
    panelTab === "terminal" &&
    terminals?.state.selected === ticket.number;
  const target: PanelTarget | null = launch
    ? {
        repoRoot: launch.repoRoot,
        featureDir: launch.featureDir,
        feature,
        featureRel: relativeTo(launch.repoRoot, launch.featureDir),
        onTicketsChanged: launch.onTicketsChanged,
      }
    : null;
  const panelPath =
    panel?.kind === "doc"
      ? `${target?.featureRel ?? ""}/${panel.path}`
      : ticket
        ? `${target?.featureRel ? `${target.featureRel}/` : ""}issues/${ticket.name}`
        : "";
  const showPanel = panel?.kind === "doc" || ticket !== undefined;

  // Dragging the panel's edge moves a guide line only; the panel (and its terminal) resizes once,
  // on release.
  const startResize = (e: React.PointerEvent<HTMLDivElement>) => {
    const root = rootRef.current;
    const guide = guideRef.current;
    if (!root || !guide || e.button !== 0) return;
    e.preventDefault();
    const handle = e.currentTarget;
    handle.setPointerCapture(e.pointerId);
    const rect = root.getBoundingClientRect();
    const shareAt = (x: number) =>
      Math.min(
        PANEL_WIDTH.max,
        Math.max(PANEL_WIDTH.min, (rect.right - x) / rect.width),
      );
    const place = (x: number) => {
      guide.style.left = `${(1 - shareAt(x)) * rect.width}px`;
    };
    guide.hidden = false;
    place(e.clientX);
    const move = (ev: PointerEvent) => place(ev.clientX);
    const up = (ev: PointerEvent) => {
      handle.removeEventListener("pointermove", move);
      handle.removeEventListener("pointerup", up);
      handle.removeEventListener("pointercancel", up);
      guide.hidden = true;
      if (ev.type === "pointerup") setPanelWidth(shareAt(ev.clientX));
    };
    handle.addEventListener("pointermove", move);
    handle.addEventListener("pointerup", up);
    handle.addEventListener("pointercancel", up);
  };
  const nudgeWidth = (e: React.KeyboardEvent) => {
    const step =
      e.key === "ArrowLeft" ? 0.05 : e.key === "ArrowRight" ? -0.05 : 0;
    if (!step) return;
    e.preventDefault();
    setPanelWidth((w) =>
      Math.min(PANEL_WIDTH.max, Math.max(PANEL_WIDTH.min, w + step)),
    );
  };

  return (
    <div
      ref={rootRef}
      className="relative flex h-full min-h-0"
      data-testid="loop-run"
    >
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <header className="shrink-0 px-6 pt-5">
          <div className="flex items-start gap-4">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="truncate text-xl font-semibold tracking-tight">
                  {feature || "Loop"}
                </h1>
                {feature && (
                  <span
                    className="border border-foreground/70 px-1.5 py-px font-mono text-[10px] uppercase tracking-[0.12em]"
                    aria-hidden="true"
                  >
                    {feature} / {tickets.length}{" "}
                    {tickets.length === 1 ? "ticket" : "tickets"}
                  </span>
                )}
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                {headCount(tickets)}
              </p>
              {tickets.length > 0 && (
                <Rail
                  tickets={tickets}
                  current={showPanel && ticket ? ticket.number : null}
                  onOpen={openTicket}
                />
              )}
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1.5 text-xs">
              {run ? (
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "rounded px-1.5 py-px text-[10px] leading-4",
                      RUN_TONE[run.status],
                    )}
                  >
                    {run.status}
                  </span>
                  {run.status === "live" && run.phase && (
                    <span className="text-muted-foreground">{run.phase}</span>
                  )}
                  <span
                    className="tabular-nums"
                    title="Elapsed time of this run"
                  >
                    {elapsed === null ? "—" : formatDuration(elapsed)}
                  </span>
                  <span
                    className="tabular-nums"
                    title={cost?.title ?? "Cost of this run"}
                  >
                    {cost?.text}
                  </span>
                </div>
              ) : (
                <span className="text-muted-foreground">
                  No run of this feature yet.
                </span>
              )}
              <div className="flex items-center gap-2">
                {launch && run?.status === "live" && !stopping && (
                  <Button size="sm" variant="outline" onClick={stop}>
                    Stop the run
                  </Button>
                )}
                {launch && label && (
                  <Button
                    size="sm"
                    disabled={blocked !== null}
                    title={blocked ?? undefined}
                    aria-expanded={formOpen}
                    onClick={() => setFormOpen((o) => !o)}
                  >
                    <HugeiconsIcon icon={PlayIcon} size={14} />
                    {label}
                  </Button>
                )}
              </div>
              {run && (
                <span
                  className="max-w-72 truncate font-mono text-[10px] text-muted-foreground"
                  title={run.dir}
                >
                  {run.id}
                </span>
              )}
            </div>
          </div>
          {run?.status === "died" && (
            <p className="mt-2 text-xs text-destructive">
              {diedNote(run, now)}
            </p>
          )}
          {stopping && run && (
            <p
              className="mt-2 text-xs text-muted-foreground"
              data-testid="stopping"
            >
              Stopping…{" "}
              <code className="font-mono text-[11px]" title={run.stop_file}>
                {run.stop_file}
              </code>
            </p>
          )}
          {stopFailure && (
            <p className="mt-2 text-xs text-destructive" role="alert">
              {stopFailure}
            </p>
          )}
          {launch && label && blocked && (
            <p
              className="mt-2 text-xs text-muted-foreground"
              data-testid="blocked"
            >
              {blocked}
            </p>
          )}
          {run?.launch_line && (
            <code
              className="mt-2 block truncate font-mono text-[11px] text-muted-foreground"
              title={run.launch_line}
              data-testid="run-launch-line"
            >
              {run.launch_line}
            </code>
          )}
          {unblockedIds.length > 0 && !formOpen && (
            <div
              className="mt-2 flex items-center gap-3 text-xs"
              data-testid="unblocked"
            >
              <span>{unblockedText(unblockedIds)}</span>
              <Button
                size="xs"
                variant="outline"
                onClick={() => setFormOpen(true)}
              >
                Start the loop
              </Button>
            </div>
          )}
          <div
            className="mt-5 flex gap-6 border-b border-border"
            role="tablist"
          >
            {(["tickets", "docs"] as const).map((k) => (
              <button
                key={k}
                type="button"
                role="tab"
                aria-selected={tab === k}
                onClick={() => {
                  setTab(k);
                  if (k === "docs") setDocsAsked((n) => n + 1);
                }}
                className={cn(
                  CAPS,
                  "-mb-px border-b-2 pb-2",
                  tab === k
                    ? "border-foreground text-foreground"
                    : "border-transparent hover:text-foreground",
                )}
              >
                {k}
                <span className="ml-2 opacity-70">
                  {k === "tickets" ? tickets.length : (docs?.length ?? 0)}
                </span>
              </button>
            ))}
          </div>
        </header>

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

        <div
          className={cn(
            "min-h-0 flex-1 flex-col overflow-y-auto px-6 pb-6",
            formOpen ? "hidden" : "flex",
          )}
          role="tabpanel"
        >
          {tab === "tickets" ? (
            <>
              <div className="flex items-center gap-2 py-3">
                <fieldset
                  className="m-0 flex rounded-md border border-border p-0.5"
                  aria-label="Show tickets as"
                >
                  {(
                    [
                      ["list", "List", LeftToRightListBulletIcon],
                      ["board", "Board", KanbanIcon],
                    ] as const
                  ).map(([k, text, icon]) => (
                    <button
                      key={k}
                      type="button"
                      aria-pressed={layout === k}
                      onClick={() => setLayout(k)}
                      className={cn(
                        "flex items-center gap-1.5 rounded px-2.5 py-1 text-xs",
                        layout === k
                          ? "bg-muted text-foreground"
                          : "text-muted-foreground hover:text-foreground",
                      )}
                    >
                      <HugeiconsIcon icon={icon} size={13} />
                      {text}
                    </button>
                  ))}
                </fieldset>
                <span className="flex-1" />
                {showPanel && (
                  <span className="text-xs text-muted-foreground">
                    <kbd className="rounded border border-border px-1 font-mono text-[10px]">
                      Esc
                    </kbd>{" "}
                    closes the panel
                  </span>
                )}
              </div>
              {tickets.length === 0 ? (
                <div className="py-12 text-center text-sm text-muted-foreground">
                  This feature has no build tickets.
                </div>
              ) : layout === "list" ? (
                <TicketList
                  tickets={tickets}
                  now={now}
                  current={ticket?.number ?? null}
                  onOpen={openTicket}
                />
              ) : (
                <TicketBoard
                  tickets={tickets}
                  current={ticket?.number ?? null}
                  onOpen={openTicket}
                />
              )}
            </>
          ) : (
            <DocList
              docs={docs}
              current={panel?.kind === "doc" ? panel.path : null}
              onOpen={(path) => setPanel({ kind: "doc", path })}
            />
          )}
        </div>
      </div>

      {/* The side panel. Hidden, not unmounted, while closed: the ticket terminals keep running. */}
      {(showPanel || terminalsMounted) && (
        <aside
          className={cn(
            "relative min-h-0 shrink-0 flex-col border-l border-border bg-background",
            showPanel ? "flex" : "hidden",
          )}
          style={{ width: `${panelWidth * 100}%` }}
          aria-label={
            ticket
              ? `Ticket ${ticket.number}`
              : panel?.kind === "doc"
                ? panel.path
                : undefined
          }
        >
          {/* biome-ignore lint/a11y/useSemanticElements: a focusable splitter; <hr> takes no pointer or key input */}
          <div
            role="separator"
            aria-orientation="vertical"
            aria-label="Resize the panel"
            aria-valuemin={PANEL_WIDTH.min * 100}
            aria-valuemax={PANEL_WIDTH.max * 100}
            aria-valuenow={Math.round(panelWidth * 100)}
            tabIndex={0}
            className="absolute inset-y-0 -left-1 z-30 w-2 cursor-col-resize touch-none hover:bg-primary/20 focus-visible:bg-primary/30 focus-visible:outline-none"
            onPointerDown={startResize}
            onKeyDown={nudgeWidth}
          />
          <PanelFrame
            path={panelPath}
            onClose={() => setPanel(null)}
            ticket={ticket}
            tab={panelTab}
            onTab={(k) => ticket && showTab(ticket.number, k)}
            hasTerminal={terminals !== undefined}
          >
            {/* Laid out under Details and kept, so a tab switch never resizes or restarts a terminal. */}
            {terminals && terminalsMounted && (
              <div
                className={cn(
                  "absolute inset-0 flex flex-col pt-1",
                  !terminalShown && "invisible",
                )}
              >
                <TicketTerminalArea
                  api={terminals}
                  tickets={tickets}
                  run={run}
                  feature={feature}
                  active={active && terminalShown}
                  human={
                    launch
                      ? {
                          live: launch.live,
                          featureDir: launch.featureDir,
                          closed: closed && {
                            number: closed.number,
                            line: closed.line,
                          },
                          markDone,
                        }
                      : undefined
                  }
                />
              </div>
            )}
            {ticket && !terminalShown && (
              <div className="absolute inset-0 z-10 overflow-y-auto bg-background px-5 py-4">
                {target ? (
                  <TicketDetails
                    key={ticket.number}
                    t={ticket}
                    tickets={tickets}
                    run={run}
                    target={target}
                    stop={launch ? { onStop: stop, stopping } : undefined}
                  />
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Open the feature to see this ticket's details.
                  </p>
                )}
              </div>
            )}
            {panel?.kind === "doc" && launch && (
              <div className="absolute inset-0 z-10 bg-background">
                <DocText path={`${launch.featureDir}/${panel.path}`} />
              </div>
            )}
          </PanelFrame>
        </aside>
      )}
      <div
        ref={guideRef}
        hidden
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 z-40 w-px bg-primary"
      />
    </div>
  );
}
