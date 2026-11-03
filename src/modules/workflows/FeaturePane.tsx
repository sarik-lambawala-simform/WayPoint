import { useCallback, useEffect, useState } from "react";
import { type Catalog, fetchCatalog } from "./lib/api";
import {
  loadWorkflowChoice,
  resolveEntry,
  saveWorkflowChoice,
} from "./lib/workflowChoice";
import { StageBar } from "./StageBar";
import { WorkflowPicker } from "./WorkflowPicker";

type Props = { featureDir: string; repoRoot: string };

export function FeaturePane({ featureDir, repoRoot }: Props) {
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [choice, setChoice] = useState<string | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState(0);

  useEffect(() => {
    let live = true;
    Promise.all([fetchCatalog(repoRoot), loadWorkflowChoice(featureDir)]).then(
      ([c, saved]) => {
        if (!live) return;
        setCatalog(c);
        setChoice(saved);
      },
      (e) => live && setError(String(e)),
    );
    return () => {
      live = false;
    };
  }, [repoRoot, featureDir]);

  const pick = useCallback(
    (id: string) => {
      setChoice(id);
      setSelected(0);
      saveWorkflowChoice(featureDir, id).catch((e) =>
        console.error("could not save the workflow choice", e),
      );
    },
    [featureDir],
  );

  if (error) {
    return (
      <div className="p-4 text-sm text-destructive">
        Could not load the workflows: {error}
      </div>
    );
  }
  if (!catalog) return null;

  const entry = resolveEntry(catalog, choice);
  if (!entry) {
    return (
      <div className="flex flex-col gap-1 p-4 text-sm text-destructive">
        <span>No workflow loaded.</span>
        {catalog.errors.map((e) => (
          <span key={`${e.file}:${e.line}`}>
            {e.file}:{e.line}: {e.message}
          </span>
        ))}
      </div>
    );
  }

  const workflow = entry.workflow;
  const stage = workflow.stages[selected];
  return (
    <div className="flex h-full min-h-0 flex-col">
      <StageBar
        workflow={workflow}
        featureDir={featureDir}
        selected={selected}
        onSelect={setSelected}
        picker={
          <WorkflowPicker
            title={workflow.title}
            catalog={catalog}
            selectedId={entry.id}
            onPick={pick}
          />
        }
      />
      {catalog.errors.length > 0 && (
        <div className="shrink-0 border-b border-border/60 px-3 py-1 text-[11px] text-destructive">
          {catalog.errors.length === 1
            ? `${catalog.errors[0].file}:${catalog.errors[0].line}: ${catalog.errors[0].message}`
            : `${catalog.errors.length} workflow files did not load. Open the workflow picker for the errors.`}
        </div>
      )}
      <div className="flex min-h-0 flex-1 items-center justify-center text-sm text-muted-foreground">
        {stage ? `${stage.name} has not started yet.` : null}
      </div>
    </div>
  );
}
