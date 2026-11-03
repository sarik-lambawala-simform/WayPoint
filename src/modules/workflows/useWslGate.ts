import { useCallback, useState } from "react";
import { IS_WINDOWS } from "@/lib/platform";
import { currentWorkspaceEnv } from "@/modules/workspace";
import { wslCheck } from "./lib/api";
import { gateFromCheck, type WslGate } from "./lib/wslGate";

/**
 * The check before a stage starts on Windows: the space must be on a WSL distro, and that distro
 * must have jq, git, curl and claude (one `wsl.exe -d <distro> -- command -v ...`). Elsewhere it
 * lets every stage start. Nothing is installed or switched for the user.
 */
export function useWslGate() {
  const [gate, setGate] = useState<WslGate>({ kind: "idle" });
  /** Resolves true when the stage may start. */
  const check = useCallback(async (): Promise<boolean> => {
    if (!IS_WINDOWS) return true;
    const env = currentWorkspaceEnv();
    if (env.kind !== "wsl") {
      setGate({ kind: "needs-wsl" });
      return false;
    }
    setGate({ kind: "checking" });
    try {
      const blocked = gateFromCheck(await wslCheck(env.distro));
      setGate(blocked ?? { kind: "idle" });
      return blocked === null;
    } catch (e) {
      setGate({ kind: "error", message: String(e) });
      return false;
    }
  }, []);
  const dismiss = useCallback(() => setGate({ kind: "idle" }), []);
  return { gate, check, dismiss };
}
