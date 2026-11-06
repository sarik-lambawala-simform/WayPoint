import {
  Alert02Icon,
  Cancel01Icon,
  LockIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { memo, type ReactNode, useEffect, useState } from "react";
import { Streamdown } from "streamdown";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { native } from "@/modules/ai/lib/native";
import {
  MarkdownLink,
  type MarkdownLinkProps,
} from "@/modules/markdown/MarkdownLink";
import { editTicket, type TicketChange } from "./lib/api";
import {
  blockerChoices,
  boardKey,
  EDIT_STATUSES,
  editLock,
  isRequeue,
  isWebLink,
  needsYou,
  sameBlockers,
  ticketFacts,
  utcStamp,
} from "./lib/loopBoard";
import type { RunView, TicketRow } from "./lib/loopRun";
import { ticketCostText, ticketTimeText } from "./lib/loopRun";
import { CAPS, NeedsYou, StatusTag, Title } from "./LoopTickets";

export type PanelTab = "details" | "terminal";

/** Where the panel's ticket lives and how an edit reaches it. */
export type PanelTarget = {
  repoRoot: string;
  featureDir: string;
  feature: string;
  /** The feature folder from the repo root, for the path line. */
  featureRel: string;
  onTicketsChanged?: () => void;
};

/** The panel's frame: the file path and close, a ticket's title and tabs, then the body. */
export function PanelFrame({
  path,
  onClose,
  ticket,
  tab,
  onTab,
  hasTerminal,
  children,
}: {
  path: string;
  onClose: () => void;
  ticket?: TicketRow;
  tab: PanelTab;
  onTab: (tab: PanelTab) => void;
  /** The Loop has ticket terminals; without them there is no Terminal tab. */
  hasTerminal: boolean;
  children: ReactNode;
}) {
  return (
    <>
      <div className="flex shrink-0 items-center gap-2 border-b border-border/60 py-2.5 pr-3 pl-5">
        <span
          className="min-w-0 flex-1 truncate font-mono text-xs text-muted-foreground"
          title={path}
        >
          {path}
        </span>
        <Button
          size="icon-xs"
          variant="ghost"
          aria-label="Close the panel"
          onClick={onClose}
        >
          <HugeiconsIcon icon={Cancel01Icon} size={14} />
        </Button>
      </div>
      {ticket && (
        <div className="shrink-0 px-5 pt-4">
          <h2 className="text-lg font-semibold leading-snug">
            <span className="mr-2 font-mono">{ticket.number}</span>
            <Title text={ticket.title || ticket.name} />
          </h2>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <StatusTag status={boardKey(ticket)} />
            {needsYou(ticket) && <NeedsYou />}
            <span>{ticket.human ? "Human ticket" : "Build ticket"}</span>
          </div>
          <div
            className="mt-4 flex gap-6 border-b border-border"
            role="tablist"
          >
            {(hasTerminal
              ? (["details", "terminal"] as const)
              : (["details"] as const)
            ).map((k) => (
              <button
                key={k}
                type="button"
                role="tab"
                aria-selected={tab === k}
                onClick={() => onTab(k)}
                className={cn(
                  CAPS,
                  "-mb-px flex items-center gap-1.5 border-b-2 pb-2",
                  tab === k
                    ? "border-foreground text-foreground"
                    : "border-transparent hover:text-foreground",
                )}
              >
                {k}
                {k === "terminal" && ticket.running && (
                  <span
                    className="size-1.5 rounded-full bg-emerald-500 motion-safe:animate-pulse"
                    role="img"
                    aria-label="live"
                  />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
      <div className="relative min-h-0 flex-1">{children}</div>
    </>
  );
}

/** A file's text, read again whenever `version` changes; null while it loads. */
function useFileText(path: string, version: string) {
  const [state, setState] = useState<{
    text: string | null;
    error: string | null;
  }>({ text: null, error: null });
  // biome-ignore lint/correctness/useExhaustiveDependencies: version stands for a change on disk
  useEffect(() => {
    let live = true;
    native.readFile(path).then(
      (r) => {
        if (!live) return;
        setState(
          r.kind === "text"
            ? { text: r.content, error: null }
            : {
                text: null,
                error:
                  r.kind === "binary"
                    ? "This is not a text file."
                    : "This file is too large to show.",
              },
        );
      },
      (e) => live && setState({ text: null, error: String(e) }),
    );
    return () => {
      live = false;
    };
  }, [path, version]);
  return state;
}

/** Only a web link leaves the app; a link to a file beside this one has no page here. */
const MD_PARTS = {
  a: (props: MarkdownLinkProps) =>
    isWebLink(props.href) ? (
      <MarkdownLink {...props} />
    ) : (
      <span title={props.href} className="underline decoration-dotted">
        {props.children}
      </span>
    ),
};

/** Drawn once per text: the Loop re-renders every second while a run is live. */
const Markdown = memo(function Markdown({ text }: { text: string }) {
  return (
    <div className="text-sm [&_h1]:text-base [&_h2]:text-base [&_h3]:text-sm">
      <Streamdown
        className="select-text [&>*:first-child]:mt-0 [&>*:last-child]:mb-0"
        components={MD_PARTS}
        mode="static"
        parseIncompleteMarkdown={false}
      >
        {text}
      </Streamdown>
    </div>
  );
});

function FileBody({
  text,
  error,
}: {
  text: string | null;
  error: string | null;
}) {
  if (error) {
    return (
      <p
        className="flex items-center gap-2 text-xs text-destructive"
        role="alert"
      >
        <HugeiconsIcon icon={Alert02Icon} size={13} />
        {error}
      </p>
    );
  }
  if (text === null) {
    return (
      <div
        role="status"
        aria-busy="true"
        aria-label="Loading the file"
        className="space-y-2"
      >
        <div className="h-3 w-[90%] animate-pulse rounded bg-muted" />
        <div className="h-3 w-3/4 animate-pulse rounded bg-muted" />
      </div>
    );
  }
  return <Markdown text={text} />;
}

/** A doc of the feature folder, read only. */
export function DocText({ path }: { path: string }) {
  const { text, error } = useFileText(path, "");
  return (
    <div className="absolute inset-0 overflow-y-auto px-5 py-4">
      <FileBody text={text} error={error} />
    </div>
  );
}

/** The Details tab: the status and Blocked by edits (or why there are none), facts, the ticket's text. */
export function TicketDetails({
  t,
  tickets,
  run,
  target,
  stop,
}: {
  t: TicketRow;
  tickets: TicketRow[];
  run: RunView | null;
  target: PanelTarget;
  /** Stops the live run; offered on the ticket it runs. */
  stop?: { onStop: () => void; stopping: boolean };
}) {
  const path = `${target.featureDir}/issues/${t.name}`;
  const [saves, setSaves] = useState(0);
  // The file is read again after a save here and whenever the loop's view of the ticket moves.
  const version = `${t.status}|${t.blockers.join()}|${saves}`;
  const { text, error } = useFileText(path, version);
  const facts = text === null ? null : ticketFacts(text);
  const lock =
    editLock(t, run) ??
    (facts && !facts.hasStatusLine
      ? "This ticket has no **Status:** line, the only one the loop reads, so the panel does not edit it."
      : null);
  const time = ticketTimeText(t.spent, Date.now());
  const usd = ticketCostText(t.spent);

  return (
    <div className="flex flex-col gap-5">
      {facts?.note && (
        <p className="text-sm text-muted-foreground">{facts.note}</p>
      )}
      {lock ? (
        <div className="flex flex-col gap-2 rounded-md border border-border bg-muted/30 p-3 text-xs">
          <span className="flex items-center gap-2">
            <HugeiconsIcon icon={LockIcon} size={13} className="shrink-0" />
            {lock}
          </span>
          {stop && t.running && run?.status === "live" && (
            <div>
              <Button
                size="xs"
                variant="outline"
                disabled={stop.stopping}
                onClick={stop.onStop}
              >
                {stop.stopping ? "Stopping…" : "Stop the run"}
              </Button>
            </div>
          )}
        </div>
      ) : (
        facts && (
          <EditForm
            // A new form per state on disk, so a save or a change by the loop starts it fresh.
            key={version}
            t={t}
            tickets={tickets}
            target={target}
            onSaved={() => {
              setSaves((n) => n + 1);
              target.onTicketsChanged?.();
            }}
          />
        )
      )}

      <dl className="grid grid-cols-[7.5rem_1fr] items-baseline gap-x-4 gap-y-2 text-sm">
        <dt className={CAPS}>Time</dt>
        <dd className="tabular-nums" title={time.title ?? undefined}>
          {t.spent.seconds === null && t.spent.running_since_ms === null
            ? "Not run yet"
            : time.text}
        </dd>
        <dt className={CAPS}>Cost</dt>
        <dd className="font-mono" title={usd.title ?? undefined}>
          {t.spent.cost === null ? "None" : usd.text}
        </dd>
        <dt className={CAPS}>Blocked by</dt>
        <dd className="font-mono">{t.blockers.join(", ") || "None"}</dd>
        {facts?.type && (
          <>
            <dt className={CAPS}>Type</dt>
            <dd>{facts.type}</dd>
          </>
        )}
        {facts?.completedAt && (
          <>
            <dt className={CAPS}>Completed at</dt>
            <dd className="font-mono">{facts.completedAt}</dd>
          </>
        )}
      </dl>

      <div className="border-t border-border/60 pt-4">
        <FileBody text={text} error={error} />
      </div>
    </div>
  );
}

function EditForm({
  t,
  tickets,
  target,
  onSaved,
}: {
  t: TicketRow;
  tickets: TicketRow[];
  target: PanelTarget;
  onSaved: () => void;
}) {
  const known = (EDIT_STATUSES as readonly string[]).includes(t.status);
  const [status, setStatus] = useState(t.status);
  const [blockers, setBlockers] = useState(t.blockers);
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const statusChanged = status !== t.status;
  const blockersChanged = !sameBlockers(blockers, t.blockers);
  const changed = statusChanged || blockersChanged;
  const choices = blockerChoices(tickets, t.number, blockers);
  const numbers = new Set(tickets.map((x) => x.number));

  const write = (change: TicketChange) =>
    editTicket(
      target.repoRoot,
      target.featureDir,
      target.feature,
      t.number,
      change,
    );

  const save = async (confirmed: boolean) => {
    if (statusChanged && isRequeue(t.status, status) && !confirmed) {
      setConfirm(true);
      return;
    }
    setConfirm(false);
    setBusy(true);
    setError(null);
    let wrote = false;
    try {
      if (blockersChanged) {
        await write({ blockers });
        wrote = true;
      }
      if (statusChanged) {
        await write({ status, completedAt: utcStamp(new Date()) });
        wrote = true;
      }
    } catch (e) {
      setError(String(e));
    }
    setBusy(false);
    // A Blocked by write that went through still shows after a failed status write.
    if (wrote) onSaved();
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor={`status-${t.number}`} className={CAPS}>
          Status
        </label>
        <select
          id={`status-${t.number}`}
          className="h-8 w-60 rounded-md border border-border bg-background px-2 text-sm"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          {!known && (
            <option value={t.status} disabled>
              {t.status || "no status"} (set by hand)
            </option>
          )}
          {EDIT_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <span className="text-xs text-muted-foreground">
          Setting completed stamps Completed at. Any other status removes it.
        </span>
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor={`blocker-${t.number}`} className={CAPS}>
          Blocked by
        </label>
        <div className="flex flex-wrap items-center gap-1.5">
          {blockers.map((n) => (
            <span
              key={n}
              className={cn(
                "inline-flex items-center gap-1 rounded border py-0.5 pr-1 pl-2 font-mono text-xs",
                numbers.has(n)
                  ? "border-border bg-muted/40"
                  : "border-amber-500/50 bg-amber-500/10",
              )}
              title={
                numbers.has(n)
                  ? undefined
                  : "Not a build ticket of this feature"
              }
            >
              {n}
              <button
                type="button"
                aria-label={`Remove ${n}`}
                className="rounded p-0.5 hover:bg-muted"
                onClick={() => setBlockers(blockers.filter((b) => b !== n))}
              >
                <HugeiconsIcon icon={Cancel01Icon} size={11} />
              </button>
            </span>
          ))}
          <select
            id={`blocker-${t.number}`}
            className="h-8 w-44 rounded-md border border-border bg-background px-2 text-xs"
            value=""
            disabled={choices.length === 0}
            onChange={(e) => setBlockers([...blockers, e.target.value].sort())}
          >
            <option value="">Add a ticket</option>
            {choices.map((b) => (
              <option key={b.number} value={b.number}>
                {b.number}. {b.title || b.name}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="flex gap-2">
        <Button
          size="xs"
          disabled={busy || !changed}
          onClick={() => void save(false)}
        >
          {busy ? "Saving…" : "Save"}
        </Button>
        <Button
          size="xs"
          variant="outline"
          disabled={busy || !changed}
          onClick={() => {
            setStatus(t.status);
            setBlockers(t.blockers);
            setConfirm(false);
            setError(null);
          }}
        >
          Undo
        </Button>
      </div>
      {confirm && (
        <div
          role="alertdialog"
          aria-labelledby={`requeue-${t.number}`}
          className="rounded-md border border-amber-500/50 bg-amber-500/5 p-3 text-sm"
          onKeyDown={(e) => {
            // Esc closes this question, not the panel.
            if (e.key !== "Escape") return;
            e.stopPropagation();
            setConfirm(false);
          }}
        >
          <p id={`requeue-${t.number}`} className="font-medium">
            Re-queue ticket {t.number}?
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            This ticket is completed and its code is already on the branch. The
            loop will run <code>/implement</code> on it again.
          </p>
          <div className="mt-2 flex gap-2">
            <Button
              size="xs"
              variant="outline"
              autoFocus
              onClick={() => setConfirm(false)}
            >
              Cancel
            </Button>
            <Button size="xs" onClick={() => void save(true)}>
              Re-queue
            </Button>
          </div>
        </div>
      )}
      {error && (
        <p
          className="flex items-center gap-2 text-xs text-destructive"
          role="alert"
        >
          <HugeiconsIcon icon={Alert02Icon} size={13} className="shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
}
