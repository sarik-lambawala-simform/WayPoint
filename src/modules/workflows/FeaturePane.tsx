import { useEffect, useRef, useState } from "react";
import { type Catalog, fetchCatalog } from "./lib/api";
import { joinPath } from "./lib/featurePaths";
import { featureTabTitle, headerActions } from "./lib/progress";
import { StageBar } from "./StageBar";
import { StageHeader } from "./StageHeader";
import { useFeatureProgress } from "./useFeatureProgress";
import { WorkflowList, WorkflowPicker } from "./WorkflowPicker";

type Props = {
  featureDir: string;
  repoRoot: string;
  feature: string;
  /** Called with the tab's title: `<feature> · <current stage>`. */
  onTitle: (title: string) => void;
  /** Opens a produced file: `.md` in a markdown tab, anything else in an editor tab. */
  onOpenPath: (path: string) => void;
};

export function FeaturePane({
  featureDir,
  repoRoot,
  feature,
  onTitle,
  onOpenPath,
}: Props) {
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    fetchCatalog(repoRoot).then(
      (c) => live && setCatalog(c),
      (e) => live && setError(String(e)),
    );
    return () => {
      live = false;
    };
  }, [repoRoot]);

  if (error) {
    return (
      <div className="p-4 text-sm text-destructive">
        Could not load the workflows: {error}
      </div>
    );
  }
  if (!catalog) return null;
  return (
    <LoadedPane
      catalog={catalog}
      featureDir={featureDir}
      repoRoot={repoRoot}
      feature={feature}
      onTitle={onTitle}
      onOpenPath={onOpenPath}
    />
  );
}

function LoadedPane({
  catalog,
  featureDir,
  repoRoot,
  feature,
  onTitle,
  onOpenPath,
}: Props & { catalog: Catalog }) {
  const { state, record } = useFeatureProgress(featureDir, repoRoot, catalog);
  const [selected, setSelected] = useState<number | null>(null);
  const progress = state?.progress ?? null;
  const title = featureTabTitle(feature, progress);

  const onTitleRef = useRef(onTitle);
  onTitleRef.current = onTitle;
  useEffect(() => {
    onTitleRef.current(title);
  }, [title]);

  if (!state) return null;
  if ("error" in state.resolved) {
    return (
      <div className="flex flex-col gap-3 overflow-y-auto p-4 text-sm">
        <div className="whitespace-pre-wrap break-all text-destructive">
          {state.resolved.error}
        </div>
        <WorkflowList
          catalog={catalog}
          selectedId=""
          onPick={(id) => void record({ kind: "workflow", id })}
        />
      </div>
    );
  }

  const entry = state.resolved.entry;
  const workflow = entry.workflow;
  const index = Math.min(
    selected ?? progress?.current ?? progress?.lastPassed ?? 0,
    Math.max(workflow.stages.length - 1, 0),
  );
  const shown = progress?.stages[index];
  const problems = [
    ...state.problems,
    ...(catalog.errors.length === 1
      ? [
          `${catalog.errors[0].file}:${catalog.errors[0].line}: ${catalog.errors[0].message}`,
        ]
      : catalog.errors.length > 1
        ? [
            `${catalog.errors.length} workflow files did not load. Open the workflow picker for the errors.`,
          ]
        : []),
  ];

  const now = () => new Date().toISOString();
  const markDir = shown?.repoScoped ? repoRoot : featureDir;
  const mark = (m: "confirmed" | "skipped") => {
    setSelected(null);
    return (
      shown &&
      record({ kind: "mark", stage: shown.key, mark: m, at: now() }, markDir)
    );
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <StageBar
        workflow={workflow}
        featureDir={featureDir}
        selected={index}
        onSelect={setSelected}
        progress={progress}
        picker={
          <WorkflowPicker
            title={workflow.title}
            catalog={catalog}
            selectedId={entry.id}
            onPick={(id) => {
              setSelected(null);
              void record({ kind: "workflow", id });
            }}
          />
        }
      />
      {problems.map((p) => (
        <div
          key={p}
          className="shrink-0 break-all border-b border-border/60 px-3 py-1 text-[11px] text-destructive"
        >
          {p}
        </div>
      ))}
      {progress && shown && (
        <StageHeader
          stage={shown}
          actions={headerActions(progress, index)}
          pathOf={(rel) =>
            joinPath(shown.repoScoped ? repoRoot : featureDir, rel)
          }
          onOpen={onOpenPath}
          onNext={() => setSelected(index + 1)}
          onDone={() => void mark("confirmed")}
          onSkip={() => void mark("skipped")}
        />
      )}
      <div className="flex min-h-0 flex-1 items-center justify-center text-sm text-muted-foreground">
        {shown ? `${shown.name} has not started yet.` : null}
      </div>
    </div>
  );
}
