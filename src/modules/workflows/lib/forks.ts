// Which stage forks which, which forks are out of date and which are behind. Pure.

import type { TerminalEntries } from "./stageTerminals";

export type ForkStage = {
  /** The stage's plain name. */
  key: string;
  /** The stage's `session:` with its route's overrides applied. */
  session?: "continue" | "fresh" | null;
};

/**
 * The stage a `continue` stage at `index` forks: the last stage before it whose claude ran in
 * the app. A skipped stage never ran, so it has no entry and is passed over. An unattended
 * stage's `claude -p` leaves nothing to resume.
 */
export function forkParent(
  stages: ForkStage[],
  entries: TerminalEntries,
  index: number,
): string | null {
  for (let i = index - 1; i >= 0; i--) {
    const e = entries[stages[i].key];
    if (e && !e.unattended) return stages[i].key;
  }
  return null;
}

/** The session id a stage at `index` forks, or null when it starts fresh. */
export function forkFromId(
  stages: ForkStage[],
  entries: TerminalEntries,
  index: number,
): string | null {
  if (stages[index]?.session !== "continue") return null;
  const parent = forkParent(stages, entries, index);
  return parent === null ? null : entries[parent].sessionId;
}

/**
 * The forked stages that are out of date: some earlier stage's claude session was started after
 * their own. Maps the stage's key to the earlier stage's key. Nothing is flagged when a start
 * time is unknown.
 */
export function outOfDate(
  stages: ForkStage[],
  entries: TerminalEntries,
): Record<string, string> {
  const flagged: Record<string, string> = {};
  stages.forEach((stage, i) => {
    const own = entries[stage.key]?.startedAt;
    if (stage.session !== "continue" || own == null) return;
    for (let j = 0; j < i; j++) {
      const earlier = entries[stages[j].key]?.startedAt;
      if (earlier != null && earlier > own) {
        flagged[stage.key] = stages[j].key;
        return;
      }
    }
  });
  return flagged;
}

/** The earlier session a forked stage may be behind, and the moment to count turns from. */
export function behindTarget(
  stages: ForkStage[],
  entries: TerminalEntries,
  index: number,
): { parentKey: string; sessionId: string; since: string } | null {
  const own = entries[stages[index]?.key];
  if (stages[index]?.session !== "continue" || !own || own.startedAt == null)
    return null;
  const parentKey = forkParent(stages, entries, index);
  if (parentKey === null) return null;
  return {
    parentKey,
    sessionId: entries[parentKey].sessionId,
    since: new Date(own.startedAt).toISOString(),
  };
}

/** "Grill has 3 more turns since Spec forked"; null when there are none. */
export function behindNote(
  parent: string,
  child: string,
  turns: number | null,
): string | null {
  if (!turns || turns < 1) return null;
  return `${parent} has ${turns} more ${turns === 1 ? "turn" : "turns"} since ${child} forked`;
}

/** Re-running a stage clears its own `confirmed` mark, so it must be confirmed again. */
export const rerunClearsConfirmed = (stage: {
  gate: string;
  markedAt: string | null;
}) => stage.gate === "confirm" && stage.markedAt !== null;
