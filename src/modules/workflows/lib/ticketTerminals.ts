// Which ticket terminals exist in the Loop, and which one is shown. A ticket's terminal is made the
// first time the ticket is chosen and then stays mounted. Pure; leaf ids come from the caller.

export type OpenedTicket = {
  /** The display leaf that replays the run folder. No shell runs behind it. */
  replay: number;
  /** The shell the user opened in the repo root; the app never types into it. */
  shell: number | null;
  /** The shell fills the area instead of the replay. */
  showShell: boolean;
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
  | { type: "show-run"; number: string }
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
          },
        },
      };
    }
    case "show-run": {
      const t = state.opened[action.number];
      if (!t?.showShell) return state;
      return {
        ...state,
        opened: {
          ...state.opened,
          [action.number]: { ...t, showShell: false },
        },
      };
    }
    case "shell-exited": {
      const entry = Object.entries(state.opened).find(
        ([, t]) => t.shell === action.leaf,
      );
      if (!entry) return state;
      return {
        ...state,
        opened: {
          ...state.opened,
          [entry[0]]: { ...entry[1], shell: null, showShell: false },
        },
      };
    }
  }
}

/** Every leaf the state holds, for disposal. */
export function allLeaves(state: TicketTerminals): number[] {
  return Object.values(state.opened).flatMap((t) =>
    t.shell === null ? [t.replay] : [t.replay, t.shell],
  );
}

/** The leaf that fills the area for the selected ticket; null when none is chosen. */
export function shownLeaf(state: TicketTerminals): number | null {
  const t = state.selected ? state.opened[state.selected] : undefined;
  if (!t) return null;
  return t.showShell && t.shell !== null ? t.shell : t.replay;
}
