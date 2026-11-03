// Which ticket terminals exist in the Loop, and which one is shown. A ticket's terminal is made the
// first time the ticket is chosen and then stays mounted. Pure; leaf ids come from the caller.

import type { RunView } from "./loopRun";

export type OpenedTicket = {
  /** The display leaf that replays the run folder. No shell runs behind it. */
  replay: number;
  /** The shell the user opened in the repo root; the app never types into it. */
  shell: number | null;
  /** The shell fills the area instead of the replay. */
  showShell: boolean;
  /** A human ticket's "Work on this" terminal: a shell that runs an interactive claude. */
  work: number | null;
  /** The work terminal fills the area. */
  showWork: boolean;
  /** An older run picked in the "Run:" picker; null replays the newest run. */
  pickedRun: RunView | null;
};

export type TicketTerminals = {
  selected: string | null;
  /** By ticket number. */
  opened: Record<string, OpenedTicket>;
};

export const NO_TICKET_TERMINALS: TicketTerminals = {
  selected: null,
  opened: {},
};

export type TicketTerminalAction =
  | { type: "select"; number: string; replayLeaf: number }
  | { type: "open-shell"; number: string; leaf: number }
  | { type: "work"; number: string; leaf: number }
  | { type: "show-run"; number: string }
  | { type: "pick-run"; number: string; run: RunView | null }
  | { type: "shell-exited"; leaf: number };

export function reduceTicketTerminals(
  state: TicketTerminals,
  action: TicketTerminalAction,
): TicketTerminals {
  switch (action.type) {
    case "select":
      return {
        selected: action.number,
        opened: state.opened[action.number]
          ? state.opened
          : {
              ...state.opened,
              [action.number]: {
                replay: action.replayLeaf,
                shell: null,
                showShell: false,
                work: null,
                showWork: false,
                pickedRun: null,
              },
            },
      };
    case "open-shell": {
      const t = state.opened[action.number];
      if (!t) return state;
      // A ticket has one shell: asking again brings it back.
      return {
        ...state,
        opened: {
          ...state.opened,
          [action.number]: {
            ...t,
            shell: t.shell ?? action.leaf,
            showShell: true,
            showWork: false,
          },
        },
      };
    }
    case "work": {
      const t = state.opened[action.number];
      if (!t) return state;
      // A ticket has one work terminal: asking again brings it back, and types nothing.
      return {
        ...state,
        opened: {
          ...state.opened,
          [action.number]: {
            ...t,
            work: t.work ?? action.leaf,
            showWork: true,
            showShell: false,
          },
        },
      };
    }
    case "show-run": {
      const t = state.opened[action.number];
      if (!t?.showShell && !t?.showWork) return state;
      return {
        ...state,
        opened: {
          ...state.opened,
          [action.number]: { ...t, showShell: false, showWork: false },
        },
      };
    }
    case "pick-run": {
      const t = state.opened[action.number];
      if (!t) return state;
      return {
        ...state,
        opened: {
          ...state.opened,
          [action.number]: {
            ...t,
            pickedRun: action.run,
            showShell: false,
            showWork: false,
          },
        },
      };
    }
    case "shell-exited": {
      const entry = Object.entries(state.opened).find(
        ([, t]) => t.shell === action.leaf || t.work === action.leaf,
      );
      if (!entry) return state;
      const [number, t] = entry;
      return {
        ...state,
        opened: {
          ...state.opened,
          [number]:
            t.work === action.leaf
              ? { ...t, work: null, showWork: false }
              : { ...t, shell: null, showShell: false },
        },
      };
    }
  }
}

/** Every leaf the state holds, for disposal. */
export function allLeaves(state: TicketTerminals): number[] {
  return Object.values(state.opened).flatMap((t) =>
    [t.replay, t.shell, t.work].filter((l): l is number => l !== null),
  );
}

/** The leaf that fills the area for the selected ticket; null when none is chosen. */
export function shownLeaf(state: TicketTerminals): number | null {
  const t = state.selected ? state.opened[state.selected] : undefined;
  if (!t) return null;
  if (t.showWork && t.work !== null) return t.work;
  return t.showShell && t.shell !== null ? t.shell : t.replay;
}
