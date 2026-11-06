import { HandPointingRight01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { cn } from "@/lib/utils";
import {
  boardColumns,
  boardKey,
  needsYou,
  type Tone,
  titleParts,
  toneOf,
} from "./lib/loopBoard";
import {
  type TicketRow,
  ticketCostText,
  ticketStatusText,
  ticketTimeText,
} from "./lib/loopRun";

const TONE_CLASS: Record<Tone, string> = {
  green:
    "border-emerald-500/50 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  violet:
    "border-violet-500/50 bg-violet-500/10 text-violet-700 dark:text-violet-300",
  yellow:
    "border-amber-500/50 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  red: "border-red-500/50 bg-red-500/10 text-red-700 dark:text-red-400",
  grey: "border-border bg-muted/40 text-muted-foreground",
};

const RAIL_CLASS: Record<Tone, string> = {
  green: "bg-emerald-500/80 dark:bg-emerald-400/80",
  violet: "bg-violet-500/80 dark:bg-violet-400/80",
  yellow: "bg-amber-500/90 dark:bg-amber-400/90",
  red: "bg-red-500/80 dark:bg-red-400/80",
  grey: "bg-muted-foreground/30",
};

/** The small uppercase mono label the board uses for headings and fact names. */
export const CAPS =
  "font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground";

/** A status as a coloured tag; `toneKey` colours it when the text is not a key (`running`). */
export function StatusTag({
  status,
  toneKey = status,
}: {
  status: string;
  toneKey?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-sm border px-1.5 py-px font-mono text-[10px] uppercase leading-4 tracking-wide",
        TONE_CLASS[toneOf(toneKey)],
      )}
    >
      {status || "no status"}
    </span>
  );
}

export function NeedsYou() {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1 rounded-sm border px-1.5 py-px font-mono text-[10px] uppercase leading-4 tracking-wide",
        TONE_CLASS.yellow,
      )}
    >
      <HugeiconsIcon icon={HandPointingRight01Icon} size={11} />
      needs you
    </span>
  );
}

/** A title as its author wrote it: text between backticks is inline code. */
export function Title({ text }: { text: string }) {
  return (
    <>
      {titleParts(text).map((p, i) =>
        p.code ? (
          <code
            // biome-ignore lint/suspicious/noArrayIndexKey: the parts of one fixed string
            key={i}
            className="rounded bg-muted px-1 font-mono text-[0.9em]"
          >
            {p.text}
          </code>
        ) : (
          p.text
        ),
      )}
    </>
  );
}

/** One bar per build ticket in run order, coloured by status; each opens its ticket. */
export function Rail({
  tickets,
  current,
  onOpen,
}: {
  tickets: TicketRow[];
  current: string | null;
  onOpen: (number: string) => void;
}) {
  return (
    <ul
      className="mt-3 flex flex-wrap gap-[3px]"
      aria-label="Build tickets in run order"
    >
      {tickets.map((t) => {
        const key = boardKey(t);
        return (
          <li key={t.name}>
            <button
              type="button"
              title={`${t.number} (${key || "no status"})`}
              aria-label={`${t.number}, ${key || "no status"}${t.running ? ", running" : ""}`}
              aria-current={current === t.number}
              onClick={() => onOpen(t.number)}
              className={cn(
                "block h-2.5 w-4 rounded-[2px] transition-transform hover:scale-y-150 focus-visible:outline-2 focus-visible:outline-ring",
                RAIL_CLASS[toneOf(key)],
                t.running && "motion-safe:animate-pulse",
                current === t.number &&
                  "outline outline-2 outline-offset-2 outline-foreground",
              )}
            />
          </li>
        );
      })}
    </ul>
  );
}

const LIST_GRID =
  "grid grid-cols-[2.25rem_minmax(0,1fr)_minmax(6.5rem,auto)_4.5rem_4.5rem_4.5rem] items-center gap-x-3";

/** The tickets as a table: number, title, status, what they come after, time and cost. */
export function TicketList({
  tickets,
  now,
  current,
  onOpen,
}: {
  tickets: TicketRow[];
  now: number;
  current: string | null;
  onOpen: (number: string) => void;
}) {
  return (
    <div>
      <div className={cn(LIST_GRID, CAPS, "px-3 pb-2")} aria-hidden="true">
        <span>#</span>
        <span>Build tickets</span>
        <span>Status</span>
        <span>After</span>
        <span className="text-right">Time</span>
        <span className="text-right">Cost</span>
      </div>
      <ul aria-label="Tickets" className="border-t border-border/60">
        {tickets.map((t) => {
          const time = ticketTimeText(t.spent, now);
          const usd = ticketCostText(t.spent);
          const chosen = current === t.number;
          return (
            <li key={t.name} className="border-b border-border/60">
              <button
                type="button"
                aria-current={chosen}
                onClick={() => onOpen(t.number)}
                className={cn(
                  LIST_GRID,
                  "w-full px-3 py-2 text-left text-sm hover:bg-muted/40",
                  chosen &&
                    "bg-muted/60 outline outline-1 -outline-offset-1 outline-foreground/40",
                )}
              >
                <span className="font-mono text-xs tabular-nums text-muted-foreground">
                  {t.number}
                </span>
                <span className="flex min-w-0 items-center gap-2">
                  <span className="truncate" title={t.name}>
                    <Title text={t.title || t.name} />
                  </span>
                  {needsYou(t) && <NeedsYou />}
                </span>
                <span>
                  <StatusTag
                    status={ticketStatusText(t)}
                    toneKey={boardKey(t)}
                  />
                </span>
                <span
                  className="truncate font-mono text-xs text-muted-foreground"
                  title={t.blockers.join(", ") || undefined}
                >
                  {t.blockers.join(", ")}
                </span>
                <span
                  className="text-right text-xs tabular-nums text-muted-foreground"
                  title={time.title ?? undefined}
                >
                  {time.text}
                </span>
                <span
                  className="text-right font-mono text-xs tabular-nums text-muted-foreground"
                  title={usd.title ?? undefined}
                >
                  {usd.text}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/** The tickets as columns by status, in the order work moves. */
export function TicketBoard({
  tickets,
  current,
  onOpen,
}: {
  tickets: TicketRow[];
  current: string | null;
  onOpen: (number: string) => void;
}) {
  return (
    <div className="flex min-h-0 gap-3 overflow-x-auto pb-2">
      {boardColumns(tickets).map((col) => {
        const inCol = tickets.filter((t) => boardKey(t) === col);
        return (
          <section
            key={col}
            aria-label={col || "no status"}
            className="flex w-60 shrink-0 flex-col gap-2 rounded-md bg-muted/20 p-2"
          >
            <div className="flex items-center gap-2 px-1">
              <StatusTag status={col} />
              <span className="font-mono text-xs text-muted-foreground">
                {inCol.length}
              </span>
            </div>
            {inCol.length === 0 ? (
              <div className="rounded border border-dashed border-border/60 py-4 text-center text-xs text-muted-foreground">
                Empty
              </div>
            ) : (
              inCol.map((t) => (
                <button
                  key={t.name}
                  type="button"
                  aria-current={current === t.number}
                  onClick={() => onOpen(t.number)}
                  className={cn(
                    "flex flex-col gap-1.5 rounded-md border border-border bg-background p-2.5 text-left text-sm hover:border-foreground/40",
                    current === t.number && "border-foreground/70",
                  )}
                >
                  <span className="flex gap-2 font-mono text-[11px] text-muted-foreground">
                    <span>{t.number}</span>
                    {t.blockers.length > 0 && (
                      <span>after {t.blockers.join(", ")}</span>
                    )}
                  </span>
                  <span className="line-clamp-2">
                    <Title text={t.title || t.name} />
                  </span>
                  <span className="flex items-center gap-2">
                    {needsYou(t) && <NeedsYou />}
                    <span className="flex-1" />
                    <span className="font-mono text-[11px] text-muted-foreground">
                      {t.spent.cost === null
                        ? ""
                        : ticketCostText(t.spent).text}
                    </span>
                  </span>
                </button>
              ))
            )}
          </section>
        );
      })}
    </div>
  );
}

/** The feature folder's notes; each opens in the side panel. */
export function DocList({
  docs,
  current,
  onOpen,
}: {
  docs: string[] | null;
  current: string | null;
  onOpen: (path: string) => void;
}) {
  if (docs === null) return null;
  if (docs.length === 0) {
    return (
      <div className="py-12 text-center text-sm text-muted-foreground">
        This feature has no spec.md, map.md or other notes yet.
      </div>
    );
  }
  return (
    <ul aria-label="Docs" className="mt-3 border-t border-border/60">
      {docs.map((d) => (
        <li key={d} className="border-b border-border/60">
          <button
            type="button"
            aria-current={current === d}
            onClick={() => onOpen(d)}
            className={cn(
              "w-full px-3 py-2.5 text-left font-mono text-sm hover:bg-muted/40",
              current === d && "bg-muted/60",
            )}
          >
            {d}
          </button>
        </li>
      ))}
    </ul>
  );
}
