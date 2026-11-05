export {
  subscribeAgentSignals,
  useAgentActivityStore,
} from "./lib/agentActivity";
export {
  findLeafCwd,
  hasLeaf,
  leafIds,
  type PaneBounds,
  type PaneNode,
} from "./lib/panes";
export {
  clearFocusedTerminal,
  disposeSession,
  displayInSession, // fork
  markDisplayLeaf, // fork
  leafHasForegroundProcess,
  leafIdForPty,
  navigateFocusedBlocks,
  ptyIdForLeaf,
  whenDisplayReady, // fork
  whenSessionReady,
  writeToSession,
} from "./lib/terminalSessionApi";
export { isTerminalSurfaceTarget } from "./lib/terminalSurfaceTarget";
export {
  type TerminalPathDropTarget,
  useTerminalFileDrop,
} from "./lib/useTerminalFileDrop";
export type { TerminalPaneHandle } from "./TerminalPane";
export { TerminalStack } from "./TerminalStack";
