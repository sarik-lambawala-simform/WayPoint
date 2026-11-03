import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { IS_WINDOWS } from "@/lib/platform";
import { useWorkspaceEnvStore, type WorkspaceEnv } from "@/modules/workspace";
import { repoLocationWarning } from "./lib/wsl";
import type { WslGate } from "./lib/wslGate";

type SwitchProps = { onSwitchEnv: (env: WorkspaceEnv) => void };

/**
 * A space on the Windows env: WSL is required, the exact switch, and an offer to make it. The
 * switch resets the space's tabs, so it is only ever made on a second click.
 */
function WindowsEnvOffer({ onSwitchEnv }: SwitchProps) {
  const distros = useWorkspaceEnvStore((s) => s.distros);
  const refreshDistros = useWorkspaceEnvStore((s) => s.refreshDistros);
  const [asking, setAsking] = useState(false);
  useEffect(() => {
    if (distros.length === 0) void refreshDistros();
  }, [distros.length, refreshDistros]);
  const distro = distros.find((d) => d.default) ?? distros[0];
  return (
    <div className="flex flex-col gap-2 text-xs">
      <span>
        Workflows run in WSL on Windows, so stage forks and the Loop see the
        same claude. This space is on the Windows environment.
      </span>
      <span className="text-muted-foreground">
        The switch: status bar, environment menu, WSL:{" "}
        {distro?.name ?? "a distro"}. Switching resets this space's tabs.
      </span>
      {distro ? (
        asking ? (
          <div className="flex items-center gap-2">
            <Button
              size="xs"
              onClick={() => onSwitchEnv({ kind: "wsl", distro: distro.name })}
            >
              Switch to WSL: {distro.name}
            </Button>
            <Button
              size="xs"
              variant="outline"
              onClick={() => setAsking(false)}
            >
              Not now
            </Button>
          </div>
        ) : (
          <div>
            <Button size="xs" variant="outline" onClick={() => setAsking(true)}>
              Switch this space to WSL: {distro.name}…
            </Button>
          </div>
        )
      ) : (
        <span className="text-muted-foreground">
          No WSL distro was found. In a Windows terminal, run{" "}
          <code>wsl --install</code>.
        </span>
      )}
    </div>
  );
}

/** The one-line warning for a repo under `/mnt/<drive>/`, and the offer on the Windows env. */
export function WslStrip({
  repoRoot,
  onSwitchEnv,
}: SwitchProps & { repoRoot: string }) {
  const env = useWorkspaceEnvStore((s) => s.env);
  if (!IS_WINDOWS) return null;
  if (env.kind === "local") {
    return (
      <div className="shrink-0 border-b border-border/60 px-3 py-1.5">
        <WindowsEnvOffer onSwitchEnv={onSwitchEnv} />
      </div>
    );
  }
  const warning = repoLocationWarning(repoRoot);
  return warning ? (
    <div className="shrink-0 border-b border-border/60 px-3 py-1 text-[11px] text-muted-foreground">
      {warning}
    </div>
  ) : null;
}

/** Over the stage area when the stage cannot start: the Windows env, missing tools, a failed check. */
export function WslGatePanel({
  gate,
  onRecheck,
  onDismiss,
  onSwitchEnv,
}: SwitchProps & {
  gate: WslGate;
  onRecheck: () => void;
  onDismiss: () => void;
}) {
  if (gate.kind === "needs-wsl") {
    return (
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3 px-6 text-center text-sm">
        <WindowsEnvOffer onSwitchEnv={onSwitchEnv} />
        <Button size="sm" variant="outline" onClick={onDismiss}>
          Close
        </Button>
      </div>
    );
  }
  if (gate.kind === "missing") {
    return (
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3 px-6 text-sm">
        <span>
          The WSL distro is missing {gate.missing.map((m) => m.tool).join(", ")}
          . Install {gate.missing.length === 1 ? "it" : "them"} in the distro,
          then check again. Nothing is installed for you.
        </span>
        <pre className="max-w-full select-text overflow-x-auto rounded border border-border/60 bg-muted/40 px-3 py-2 text-xs">
          {gate.missing.map((m) => m.install).join("\n")}
        </pre>
        <div className="flex gap-2">
          <Button size="sm" onClick={onRecheck}>
            Check again
          </Button>
          <Button size="sm" variant="outline" onClick={onDismiss}>
            Close
          </Button>
        </div>
      </div>
    );
  }
  if (gate.kind === "error") {
    return (
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3 px-6 text-center text-sm">
        <span>WSL could not be checked: {gate.message}</span>
        <div className="flex gap-2">
          <Button size="sm" onClick={onRecheck}>
            Check again
          </Button>
          <Button size="sm" variant="outline" onClick={onDismiss}>
            Close
          </Button>
        </div>
      </div>
    );
  }
  return null;
}
