// The state of the "can a stage start here" check on Windows. Pure: the page feeds it what it saw.

import { missingWithInstall, type MissingTool } from "./wsl";

export type WslGate =
  | { kind: "idle" }
  | { kind: "checking" }
  /** The space is on the Windows env: stages need WSL. */
  | { kind: "needs-wsl" }
  /** The distro lacks tools; each comes with the line that installs it. */
  | { kind: "missing"; missing: MissingTool[] }
  /** wsl.exe could not run the check. */
  | { kind: "error"; message: string };

/** What a finished distro check means: every tool there, or the list of what is not. */
export function gateFromCheck(output: string): WslGate | null {
  const missing = missingWithInstall(output);
  return missing.length ? { kind: "missing", missing } : null;
}

/** A gate that stops the stage from starting (and shows a panel). */
export function blocksStart(gate: WslGate): boolean {
  return (
    gate.kind === "needs-wsl" ||
    gate.kind === "missing" ||
    gate.kind === "error"
  );
}
