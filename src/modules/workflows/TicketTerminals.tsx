import { invoke } from "@tauri-apps/api/core";
import { useCallback, useEffect, useReducer, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  disposeSession,
  displayInSession,
  markDisplayLeaf,
  whenDisplayReady,
} from "@/modules/terminal";
import { TerminalPane } from "@/modules/terminal/TerminalPane";
import type { RunView, TicketRow } from "./lib/loopRun";
import { allocateStageLeaf } from "./lib/stageTerminals";
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

/** The most reads one catch-up makes, so a huge stream cannot hold the page. */
const MAX_READS = 64;

/**
 * The Loop's ticket terminals. A ticket's terminal is made when it is first chosen and then stays
 * mounted and keeps replaying while another is shown. Leaves are display leaves: they show the run
 * folder and never host the run. Returns what the list and the terminal area need.
 */
export function useTicketTerminals(repoRoot: string) {
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
  const showRun = useCallback(
    (number: string) => dispatch({ type: "show-run", number }),
    [dispatch],
  );
  const onShellExit = useCallback(
    (leaf: number) => {
      disposeSession(leaf);
      dispatch({ type: "shell-exited", leaf });
    },
    [dispatch],
  );
  return { state, select, openShell, showRun, onShellExit, repoRoot };
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
    const tick = async () => {
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
}: {
  api: TicketTerminalsApi;
  tickets: TicketRow[];
  run: RunView | null;
  feature: string;
  active: boolean;
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
          {opened.showShell ? (
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
            const leaves: [number, "replay" | "shell"][] = [
              [t.replay, "replay"],
            ];
            if (t.shell !== null) leaves.push([t.shell, "shell"]);
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
                    run={run}
                    repoRoot={repoRoot}
                    feature={feature}
                  />
                )}
                <TerminalPane
                  leafId={leaf}
                  visible={active && leaf === shown}
                  focused={active && leaf === shown && kind === "shell"}
                  initialCwd={repoRoot}
                  onExit={kind === "shell" ? api.onShellExit : undefined}
                />
              </div>
            ));
          })}
        </div>
      </div>
    </div>
  );
}
