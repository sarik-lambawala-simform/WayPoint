import type { CheckResult } from "./lib/api";

/** What a failed check printed, with its exit code. A passing check shows nothing here. */
export function CheckOutput({ result }: { result: CheckResult }) {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto p-3 text-xs">
      <div className="text-destructive">
        Check failed
        {result.exit_code === null ? "" : ` with exit code ${result.exit_code}`}
        . Next stays blocked until it passes.
      </div>
      <code className="font-mono text-[11px] text-muted-foreground">
        $ {result.command}
      </code>
      <pre className="whitespace-pre-wrap break-all rounded bg-muted p-2 font-mono text-[11px]">
        {result.output || "(no output)"}
      </pre>
    </div>
  );
}
