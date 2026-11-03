import { useEffect, useState } from "react";
import { fetchShippedWorkflow, type Workflow } from "./lib/api";
import { StageBar } from "./StageBar";

let shipped: Promise<Workflow> | null = null;
function loadShipped(): Promise<Workflow> {
  shipped ??= fetchShippedWorkflow().catch((e) => {
    shipped = null;
    throw e;
  });
  return shipped;
}

export function FeaturePane({ featureDir }: { featureDir: string }) {
  const [workflow, setWorkflow] = useState<Workflow | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState(0);

  useEffect(() => {
    let live = true;
    loadShipped().then(
      (w) => live && setWorkflow(w),
      (e) => live && setError(String(e)),
    );
    return () => {
      live = false;
    };
  }, []);

  if (error) {
    return (
      <div className="p-4 text-sm text-destructive">
        Could not load the workflow: {error}
      </div>
    );
  }
  if (!workflow) return null;

  const stage = workflow.stages[selected];
  return (
    <div className="flex h-full min-h-0 flex-col">
      <StageBar
        workflow={workflow}
        featureDir={featureDir}
        selected={selected}
        onSelect={setSelected}
      />
      <div className="flex min-h-0 flex-1 items-center justify-center text-sm text-muted-foreground">
        {stage ? `${stage.name} has not started yet.` : null}
      </div>
    </div>
  );
}
