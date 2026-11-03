import { invoke } from "@tauri-apps/api/core";
import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { native } from "@/modules/ai/lib/native";
import type { GitCommitFileChange } from "@/modules/ai/lib/native";
import { revealInFinder } from "@/modules/explorer/lib/contextActions";
import {
  disposeSession,
  displayInSession,
  markDisplayLeaf,
  whenDisplayReady,
} from "@/modules/terminal";
import { TerminalPane } from "@/modules/terminal/TerminalPane";
import { launchClaude } from "./launchClaude";
import { isDoneStatus, workBlockedBy } from "./lib/humanTicket";
import type { LiveRun } from "./lib/loopLaunch";
import type { RunView, TicketRow } from "./lib/loopRun";
import { freshLine, ticketPathOf, workOnThisInput } from "./lib/stageCommand";
import { allocateStageLeaf } from "./lib/stageTerminals";
import {
  type LogEntry,
  replayedRun,
  runOptionLabel,
  ticketCommits,
  type TicketWindow,
} from "./lib/ticketCommits";
import {
  headText,
  ReplayWriter,
  renderChunk,
  type TicketRead,
  tailText,
  ticketPhase,
} from "./lib/ticketTerminal";
import {
  allLeaves,
  NO_TICKET_TERMINALS,
  reduceTicketTerminals,
  shownLeaf,
} from "./lib/ticketTerminals";

/** Opens one file of a commit in Terax's commit-file diff tab. */
export type OpenCommitFile = (input: {
  repoRoot: string;
  sha: string;
  shortSha: string;
  subject: string;
  path: string;
  originalPath: string | null;
}) => void;

/** The most reads one catch-up makes, so a huge stream cannot hold the page. */
const MAX_READS = 64;

/**
 * The Loop's ticket terminals. A ticket's terminal is made when it is first chosen and then stays
 * mounted and keeps replaying while another is shown. Leaves are display leaves: they show the run
 * folder and never host the run. Returns what the list and the terminal area need.
 */
export function useTicketTerminals(
  repoRoot: string,
  onOpenCommitFile: OpenCommitFile,
) {
  const [state, dispatchRaw] = useReducer(
    reduceTicketTerminals,
    NO_TICKET_TERMINALS,
  );
  const ref = useRef(state);
  const dispatch = useCallback(
    (action: Parameters<typeof reduceTicketTerminals>[1]) => {
      ref.current = reduceTicketTerminals(ref.current, action);
      dispatchRaw(action);
    },
    [],
  );
  useEffect(
    () => () => {
      for (const leaf of allLeaves(ref.current)) disposeSession(leaf);
    },
    [],
  );
  const select = useCallback(
    (number: string) => {
      let replayLeaf = -1;
      if (!ref.current.opened[number]) {
        replayLeaf = allocateStageLeaf();
        markDisplayLeaf(replayLeaf);
      }
      dispatch({ type: "select", number, replayLeaf });
    },
    [dispatch],
  );
  const openShell = useCallback(
    (number: string) => {
      // A ticket has one shell: the reducer keeps it and only brings it back.
      const has = ref.current.opened[number]?.shell != null;
      dispatch({
        type: "open-shell",
        number,
        leaf: has ? -1 : allocateStageLeaf(),
      });
    },
    [dispatch],
  );
  // "Work on this": a terminal of its own with an interactive claude typing `/implement <path>`.
  // A ticket has one; asking again only brings it back and types nothing.
  const work = useCallback(
    (number: string, ticketPath: string) => {
      const has = ref.current.opened[number]?.work != null;
      const leaf = has ? -1 : allocateStageLeaf();
      dispatch({ type: "work", number, leaf });
      if (has) return;
      void launchClaude(
        repoRoot,
        leaf,
        freshLine(crypto.randomUUID()),
        workOnThisInput(ticketPath),
      );
    },
    [dispatch, repoRoot],
  );
  const showRun = useCallback(
    (number: string) => dispatch({ type: "show-run", number }),
    [dispatch],
  );
  const pickRun = useCallback(
    (number: string, run: RunView | null) =>
      dispatch({ type: "pick-run", number, run }),
    [dispatch],
  );
  const onShellExit = useCallback(
    (leaf: number) => {
      disposeSession(leaf);
      dispatch({ type: "shell-exited", leaf });
    },
    [dispatch],
  );
  return {
    state,
    select,
    openShell,
    work,
    showRun,
    pickRun,
    onShellExit,
    repoRoot,
    onOpenCommitFile,
  };
}

export type TicketTerminalsApi = ReturnType<typeof useTicketTerminals>;

/** Reads one ticket's run files and writes them into its display leaf. Renders nothing. */
function TicketReplay({
  leaf,
  ticket,
  run,
  repoRoot,
  feature,
}: {
  leaf: number;
  ticket: TicketRow;
  run: RunView | null;
  repoRoot: string;
  feature: string;
}) {
  const latest = useRef({ ticket, run });
  latest.current = { ticket, run };
  const acc = useRef({
    runId: null as string | null,
    read: null as TicketRead | null,
    body: "",
    offset: 0,
  });
  const ready = useRef(false);
  const writer = useRef<ReplayWriter | null>(null);

  const apply = useCallback(() => {
    if (!ready.current || !writer.current) return;
    const { ticket: t, run: r } = latest.current;
    const read = acc.current.read;
    const phase = ticketPhase(t, r, Boolean(read?.has_stream));
    writer.current.set({
      head: headText(phase, t, read, r?.launch_line ?? null),
      body: acc.current.body,
      tail: tailText(read, r, t),
    });
  }, []);

  useEffect(() => {
    let live = true;
    writer.current = new ReplayWriter((text) => displayInSession(leaf, text));
    void whenDisplayReady(leaf).then((ok) => {
      if (!live || !ok) return;
      ready.current = true;
      apply();
    });
    return () => {
      live = false;
      ready.current = false;
    };
  }, [leaf, apply]);

  const runId = run?.id ?? null;
  const number = ticket.number;
  // Everything that can change what the files say: the run, which ticket it is on, how many it
  // has ended, and this ticket's own state.
  const refreshKey = [
    run?.status,
    run?.ticket,
    run?.tickets_ended,
    ticket.running,
    ticket.status,
    ticket.blockers_met,
  ].join("|");
  const ticking = run?.status === "live" && ticket.running;

  // biome-ignore lint/correctness/useExhaustiveDependencies: refreshKey stands for the run and ticket state it is built from
  useEffect(() => {
    let live = true;
    const a = acc.current;
    if (a.runId !== runId) {
      acc.current = { runId, read: null, body: "", offset: 0 };
    }
    let busy = false;
    const tick = async () => {
      // A read still in flight owns the offset; the next interval waits for it.
      if (busy) return;
      busy = true;
      try {
        await read();
      } finally {
        busy = false;
      }
    };
    const read = async () => {
      if (!runId) {
        acc.current.read = null;
        apply();
        return;
      }
      let latestRead: TicketRead | null = null;
      for (let i = 0; i < MAX_READS && live; i++) {
        const next = await invoke<TicketRead | null>("workflows_ticket_read", {
          repoRoot,
          runId,
          feature,
          number,
          offset: acc.current.offset,
        }).catch(() => null);
        if (!live || !next) return;
        const cur = acc.current;
        if (next.reset) cur.body = "";
        cur.body += renderChunk(next.chunk);
        cur.offset = next.offset;
        latestRead = next;
        if (next.chunk === "") break;
      }
      if (!live || !latestRead) return;
      acc.current.read = latestRead;
      apply();
    };
    void tick();
    if (!ticking) {
      return () => {
        live = false;
      };
    }
    const timer = setInterval(() => void tick(), 1000);
    return () => {
      live = false;
      clearInterval(timer);
    };
  }, [runId, repoRoot, feature, number, ticking, refreshKey, apply]);

  return null;
}

/** The terminal beside the list: the chosen ticket's replay, or its shell. Every opened one stays mounted. */
export function TicketTerminalArea({
  api,
  tickets,
  run,
  feature,
  active,
  human,
}: {
  api: TicketTerminalsApi;
  tickets: TicketRow[];
  run: RunView | null;
  feature: string;
  active: boolean;
  /** What a human ticket's header needs; without it the header offers no "Work on this". */
  human?: HumanTickets;
}) {
  const { state, repoRoot } = api;
  const selected = tickets.find((t) => t.number === state.selected);
  const opened = state.selected ? state.opened[state.selected] : undefined;
  const shown = shownLeaf(state);
  return (
    <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col">
      {selected && opened ? (
        <div className="flex shrink-0 items-center gap-2 border-b border-border/60 px-3 py-1.5 text-xs">
          <span className="min-w-0 flex-1 truncate" title={selected.name}>
            {selected.number} · {selected.title || selected.name}
          </span>
          {!selected.human && (
            <RunPicker
              api={api}
              number={selected.number}
              feature={feature}
              newest={run}
              picked={opened.pickedRun}
              shown={replayedRun(run, opened.pickedRun)}
            />
          )}
          {selected.human && human && (
            <HumanActions api={api} ticket={selected} human={human} />
          )}
          {opened.showShell || opened.showWork ? (
            <Button
              size="xs"
              variant="outline"
              onClick={() => api.showRun(selected.number)}
            >
              Show the run
            </Button>
          ) : (
            <Button
              size="xs"
              variant="outline"
              title="A shell in the repo root. The app never types into it."
              onClick={() => api.openShell(selected.number)}
            >
              Open a shell
            </Button>
          )}
        </div>
      ) : null}
      <div className="relative min-h-0 flex-1 px-3 py-2">
        {shown === null && (
          <div className="absolute inset-0 flex items-center justify-center text-xs text-muted-foreground">
            Choose a ticket to see its terminal.
          </div>
        )}
        <div data-terminal-stack="" className="relative h-full w-full">
          <div
            data-terminal-area=""
            aria-hidden="true"
            className="zoom-exempt pointer-events-none absolute inset-0 overflow-hidden"
          />
          {Object.entries(state.opened).flatMap(([number, t]) => {
            const ticket = tickets.find((x) => x.number === number);
            const leaves: [number, "replay" | "shell" | "work"][] = [
              [t.replay, "replay"],
            ];
            if (t.shell !== null) leaves.push([t.shell, "shell"]);
            if (t.work !== null) leaves.push([t.work, "work"]);
            return leaves.map(([leaf, kind]) => (
              <div
                key={leaf}
                className="absolute inset-0"
                aria-hidden={leaf !== shown}
              >
                {kind === "replay" && ticket && (
                  <TicketReplay
                    leaf={leaf}
                    ticket={ticket}
                    run={replayedRun(run, t.pickedRun)}
                    repoRoot={repoRoot}
                    feature={feature}
                  />
                )}
                <TerminalPane
                  leafId={leaf}
                  visible={active && leaf === shown}
                  focused={active && leaf === shown && kind !== "replay"}
                  initialCwd={repoRoot}
                  onExit={kind === "replay" ? undefined : api.onShellExit}
                />
              </div>
            ));
          })}
        </div>
      </div>
      {selected && !selected.human && (
        <TicketCommits
          api={api}
          ticket={selected}
          feature={feature}
          run={replayedRun(run, opened?.pickedRun ?? null)}
        />
      )}
    </div>
  );
}

/** What the Loop hands a human ticket's header. */
export type HumanTickets = {
  /** Live runs of the repo, whatever feature they work on. */
  live: LiveRun[];
  /** The feature folder, for the ticket's path. */
  featureDir: string;
  /** The ticket closed here and the line written, so its header shows it. */
  closed: { number: string; line: string } | null;
  /** Writes `**Status:** done`; resolves with that line. */
  markDone: (ticket: TicketRow) => Promise<string>;
};

/** "Work on this" and "Mark done", in a human ticket's terminal header. */
function HumanActions({
  api,
  ticket,
  human,
}: {
  api: TicketTerminalsApi;
  ticket: TicketRow;
  human: HumanTickets;
}) {
  // The reason a pressed, dimmed "Work on this" gave, and a failed "Mark done".
  const [said, setSaid] = useState<string | null>(null);
  const [failure, setFailure] = useState<string | null>(null);
  const blocked = workBlockedBy(human.live);
  const number = ticket.number;
  // biome-ignore lint/correctness/useExhaustiveDependencies: a new ticket starts without the last one's messages
  useEffect(() => {
    setSaid(null);
    setFailure(null);
  }, [number]);
  const line = human.closed?.number === number ? human.closed.line : null;
  const done = line !== null || isDoneStatus(ticket.status);
  return (
    <>
      {said && blocked && (
        <span
          className="max-w-72 truncate text-muted-foreground"
          role="status"
          title={blocked}
        >
          {blocked}
        </span>
      )}
      {failure && (
        <span
          className="max-w-72 truncate text-destructive"
          role="alert"
          title={failure}
        >
          {failure}
        </span>
      )}
      {line && <code className="font-mono text-[11px]">{line}</code>}
      <Button
        size="xs"
        variant="outline"
        // Not `disabled`: a dimmed button still answers a press, with the reason.
        aria-disabled={blocked !== null}
        className={blocked !== null ? "opacity-50" : undefined}
        title={
          blocked ?? "Open claude here and type /implement for this ticket"
        }
        onClick={() => {
          if (blocked !== null) return setSaid(blocked);
          setSaid(null);
          api.work(
            number,
            ticketPathOf(api.repoRoot, human.featureDir, ticket.name),
          );
        }}
      >
        Work on this
      </Button>
      {!done && (
        <Button
          size="xs"
          variant="outline"
          title="Write **Status:** done in the ticket file"
          onClick={() => {
            setFailure(null);
            human.markDone(ticket).catch((e) => setFailure(String(e)));
          }}
        >
          Mark done
        </Button>
      )}
    </>
  );
}

const SELECT_CLASS =
  "h-6 max-w-56 min-w-0 rounded-md border border-border bg-background px-1.5 text-xs";

/** "Run:" picker and the run folder's link, in a ticket terminal's header. */
function RunPicker({
  api,
  number,
  feature,
  newest,
  picked,
  shown,
}: {
  api: TicketTerminalsApi;
  number: string;
  feature: string;
  newest: RunView | null;
  picked: RunView | null;
  shown: RunView | null;
}) {
  const { repoRoot } = api;
  const [runs, setRuns] = useState<RunView[]>([]);
  const refresh = [
    newest?.id,
    newest?.status,
    newest?.ticket,
    newest?.tickets_ended,
  ].join("|");
  // biome-ignore lint/correctness/useExhaustiveDependencies: refresh stands for the newest run's state it is built from
  useEffect(() => {
    let live = true;
    invoke<RunView[]>("workflows_ticket_runs", { repoRoot, feature, number })
      .then((r) => live && setRuns(r))
      .catch(() => live && setRuns([]));
    return () => {
      live = false;
    };
  }, [repoRoot, feature, number, refresh]);
  if (runs.length === 0 || !shown) return null;
  const newestId = runs[0].id;
  const value = picked?.id ?? newest?.id ?? newestId;
  // The newest run may not have taken this ticket; it is still what the terminal replays.
  const extra = newest && !runs.some((r) => r.id === newest.id) ? newest : null;
  return (
    <>
      <label className="flex items-center gap-1.5 text-muted-foreground">
        Run:
        <select
          className={SELECT_CLASS}
          value={value}
          onChange={(e) => {
            const id = e.target.value;
            api.pickRun(
              number,
              id === newest?.id
                ? null
                : (runs.find((r) => r.id === id) ?? null),
            );
          }}
        >
          {extra && (
            <option value={extra.id}>
              {runOptionLabel(extra, extra.id)} · not taken
            </option>
          )}
          {runs.map((r) => (
            <option key={r.id} value={r.id}>
              {runOptionLabel(r, newest?.id ?? newestId)}
            </option>
          ))}
        </select>
      </label>
      <button
        type="button"
        className="max-w-48 truncate text-xs text-primary underline-offset-2 hover:underline"
        title={`Open ${shown.dir} in the file manager`}
        onClick={() => void revealInFinder(shown.dir)}
      >
        {shown.id}
      </button>
    </>
  );
}

type CommitView = { entry: LogEntry; files: GitCommitFileChange[] };

/**
 * A finished ticket's commits, the files each changed, and a click on a file to its diff in the
 * commit-file diff tab. No whole-commit tab. Renders nothing until the run holds a completed ticket.
 */
function TicketCommits({
  api,
  ticket,
  feature,
  run,
}: {
  api: TicketTerminalsApi;
  ticket: TicketRow;
  feature: string;
  run: RunView | null;
}) {
  const { repoRoot, onOpenCommitFile } = api;
  const [commits, setCommits] = useState<CommitView[]>([]);
  const runId = run?.id ?? null;
  const number = ticket.number;
  const key = [runId, run?.status, run?.tickets_ended, ticket.status].join("|");
  // biome-ignore lint/correctness/useExhaustiveDependencies: key stands for the run and ticket state it is built from
  useEffect(() => {
    let live = true;
    setCommits([]);
    if (!runId) return;
    (async () => {
      const window = await invoke<TicketWindow | null>(
        "workflows_ticket_window",
        { repoRoot, runId, feature, number },
      );
      if (!window?.completed || !window.base_sha) return;
      const log = await native.gitLog(repoRoot, { limit: 200 });
      const entries = ticketCommits(log, window);
      const views = await Promise.all(
        entries.map(async (entry) => ({
          entry: entry as LogEntry,
          files: await native.gitCommitFiles(repoRoot, entry.sha),
        })),
      );
      if (live) setCommits(views);
    })().catch(() => {});
    return () => {
      live = false;
    };
  }, [repoRoot, feature, number, runId, key]);
  if (commits.length === 0) return null;
  return (
    <div className="max-h-40 shrink-0 overflow-auto border-t border-border/60 px-3 py-1.5 text-xs">
      {commits.map(({ entry, files }) => (
        <div key={entry.sha} className="mb-1.5 last:mb-0">
          <div className="flex gap-2">
            <code className="shrink-0 text-muted-foreground">
              {entry.shortSha}
            </code>
            <span className="min-w-0 truncate" title={entry.subject}>
              {entry.subject}
            </span>
          </div>
          <ul className="ml-4">
            {files.map((f) => (
              <li key={f.path}>
                <button
                  type="button"
                  className="flex w-full items-center gap-2 text-left hover:underline"
                  title={`Open the diff of ${f.path} in ${entry.shortSha}`}
                  onClick={() =>
                    onOpenCommitFile({
                      repoRoot,
                      sha: entry.sha,
                      shortSha: entry.shortSha,
                      subject: entry.subject,
                      path: f.path,
                      originalPath: f.originalPath,
                    })
                  }
                >
                  <span className="w-12 shrink-0 text-muted-foreground">
                    {f.statusLabel}
                  </span>
                  <span className="min-w-0 flex-1 truncate">{f.path}</span>
                  {!f.isBinary && (
                    <span className="shrink-0 text-muted-foreground">
                      +{f.added} −{f.removed}
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
