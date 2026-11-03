import { useEffect, useRef, useState } from "react";
import { CheckOutput } from "./CheckOutput";
import {
  type Catalog,
  type CheckResult,
  fetchCatalog,
  runCheck,
} from "./lib/api";
import { joinPath } from "./lib/featurePaths";
import {
  effectiveStage,
  featureTabTitle,
  hasRouteOverride,
  headerActions,
  PLAIN_ROUTE,
  routesOf,
  type StageProgress,
} from "./lib/progress";
import {
  behindNote,
  behindTarget,
  forkPlan,
  type ForkStage,
  noSessionHere,
  outOfDate as outOfDateOf,
  rerunClearsConfirmed,
} from "./lib/forks";
import {
  featureRel,
  freshNote,
  missingSessionInput,
  stageInput,
} from "./lib/stageCommand";
import { Button } from "@/components/ui/button";
import { RoutePicker } from "./RoutePicker";
import { StageBar } from "./StageBar";
import { StageHeader } from "./StageHeader";
import { StageTerminalHost } from "./StageTerminalHost";
import { useBehindTurns } from "./useBehind";
import { useFeatureProgress } from "./useFeatureProgress";
import { useSessionsPresent } from "./useSessionsPresent";
import {
  useLiveStages,
  useStageTerminals,
  useWorkingStages,
} from "./useStageTerminals";
import { WorkflowList, WorkflowPicker } from "./WorkflowPicker";

/** Why the shown stage did not start: it waits on the user's choice. */
type Blocked =
  | { key: string; kind: "missing"; goBack: number | null }
  | { key: string; kind: "mid-turn"; parentKey: string; waiting: boolean };

type Props = {
  featureDir: string;
  repoRoot: string;
  feature: string;
  /** The feature tab is the active tab. */
  active: boolean;
  /** Called with the tab's title: `<feature> · <current stage>`. */
  onTitle: (title: string) => void;
  /** Opens a produced file: `.md` in a markdown tab, anything else in an editor tab. */
  onOpenPath: (path: string) => void;
};

export function FeaturePane({
  featureDir,
  repoRoot,
  feature,
  active,
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
      active={active}
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
  active,
  onTitle,
  onOpenPath,
}: Props & { catalog: Catalog }) {
  const { state, record, refresh } = useFeatureProgress(
    featureDir,
    repoRoot,
    catalog,
  );
  const unattendedExit = useRef<(key: string) => void>(() => {});
  const terminals = useStageTerminals(featureDir, repoRoot, (key) =>
    unattendedExit.current(key),
  );
  const live = useLiveStages(terminals.entries);
  const working = useWorkingStages(terminals.entries);
  const presence = useSessionsPresent(repoRoot, terminals.entries);
  const [blocked, setBlocked] = useState<Blocked | null>(null);
  /** Stages that started fresh for want of a session to continue, and what to say about it. */
  const [freshNotes, setFreshNotes] = useState<Record<string, string>>({});
  const startAgain = useRef<() => void>(() => {});
  const anyLive = Object.values(live).some(Boolean);
  const [selected, setSelected] = useState<number | null>(null);
  const [failed, setFailed] = useState<{
    key: string;
    result: CheckResult;
  } | null>(null);
  const [checking, setChecking] = useState(false);
  const progress = state?.progress ?? null;
  const title = featureTabTitle(feature, progress, anyLive);
  const resolvedEntry =
    state && !("error" in state.resolved) ? state.resolved.entry : null;
  const forkStages: ForkStage[] = (resolvedEntry?.workflow.stages ?? []).map(
    (s) => ({
      key: s.name,
      session: effectiveStage(s, state?.route ?? null).session,
    }),
  );
  const stale = outOfDateOf(forkStages, terminals.entries);
  const shownIndex = Math.min(
    selected ?? progress?.current ?? progress?.lastPassed ?? 0,
    Math.max(forkStages.length - 1, 0),
  );
  const behindOf = behindTarget(forkStages, terminals.entries, shownIndex);
  const behindTurns = useBehindTurns(repoRoot, behindOf);

  // A choice made for one stage does not follow the user to another.
  const blockedStage = useRef(shownIndex);
  if (blockedStage.current !== shownIndex) {
    blockedStage.current = shownIndex;
    if (blocked) setBlocked(null);
  }
  // Waiting for a mid-turn claude: fork as soon as its turn ends.
  const waitingOn =
    blocked?.kind === "mid-turn" && blocked.waiting ? blocked.parentKey : null;
  const waitedOnWorking = waitingOn !== null && Boolean(working[waitingOn]);
  useEffect(() => {
    if (waitingOn !== null && !waitedOnWorking) startAgain.current();
  }, [waitingOn, waitedOnWorking]);

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

  const routes = routesOf(workflow);
  const pickRoute = (route: string | null) =>
    void record({ kind: "route", route: route ?? PLAIN_ROUTE });
  const now = () => new Date().toISOString();
  const markDir = shown?.repoScoped ? repoRoot : featureDir;
  const mark = (m: "confirmed" | "skipped") => {
    setSelected(null);
    return (
      shown &&
      record({ kind: "mark", stage: shown.key, mark: m, at: now() }, markDir)
    );
  };

  /** Runs a stage's check; only Next, Recheck and an unattended stage's exit call it. Returns whether it passed. */
  const checkStage = async (stage: StageProgress) => {
    if (!stage.check || checking) return false;
    setChecking(true);
    const dir = stage.repoScoped ? repoRoot : featureDir;
    try {
      const result = await runCheck(
        repoRoot,
        featureDir,
        entry.dir,
        stage.check,
      );
      if (result.passed) {
        setFailed(null);
        await record(
          { kind: "mark", stage: stage.key, mark: "passed", at: now() },
          dir,
        );
      } else {
        setFailed({ key: stage.key, result });
        // A failing recheck withdraws an older pass.
        if (stage.markedAt)
          await record(
            { kind: "mark", stage: stage.key, mark: "clear", at: now() },
            dir,
          );
      }
      return result.passed;
    } catch (e) {
      console.error("could not run the check", e);
      setFailed({
        key: stage.key,
        result: {
          passed: false,
          exit_code: null,
          output: String(e),
          command: stage.check,
        },
      });
      return false;
    } finally {
      setChecking(false);
    }
  };
  const check = () => (shown ? checkStage(shown) : Promise.resolve(false));

  // An unattended stage's gate is checked when its claude exits: files by a refresh, a check by running it.
  unattendedExit.current = (key) => {
    const stage = progress?.stages.find((s) => s.key === key);
    if (stage?.gate === "check") void checkStage(stage);
    else
      void refresh().catch((e) =>
        console.error("could not read the progress", e),
      );
  };

  const onNext = async () => {
    // "Next" on a check stage that has not passed runs the check first.
    if (shown?.gate === "check" && shown.state !== "done") {
      if (!(await check())) return;
    }
    setFailed(null);
    setSelected(index + 1);
  };

  const stageDef = effectiveStage(workflow.stages[index], state.route);
  const input = stageInput(stageDef, {
    feature: featureRel(repoRoot, featureDir),
    workflowDir: entry.dir,
  });
  const entryOfShown = shown ? terminals.entries[shown.key] : undefined;
  const unattendedStage = stageDef.mode === "unattended";
  const stageName = (i: number) =>
    effectiveStage(workflow.stages[i], state.route).name;
  /**
   * Starts the shown stage; a re-run first clears the stage's own confirmed mark. A forking stage
   * with nothing to fork stops (or, for Tickets, starts from the spec); one whose earlier claude is
   * mid-turn asks first.
   */
  const startShown = (opts: { fresh?: boolean; forkAnyway?: boolean } = {}) => {
    if (!shown || input === null) return;
    if (entryOfShown?.status === "running") return;
    let typed = input;
    let forkFrom: string | null = null;
    let freshWhy: string | null = null;
    if (opts.fresh) {
      freshWhy = "Started fresh: there was no earlier session to continue.";
    } else if (!unattendedStage) {
      const plan = forkPlan(
        forkStages,
        terminals.entries,
        index,
        presence,
        working,
      );
      if (plan.kind === "missing") {
        const fallback = missingSessionInput(stageDef, {
          feature: featureRel(repoRoot, featureDir),
          workflowDir: entry.dir,
        });
        if (fallback === null) {
          setBlocked({ key: shown.key, kind: "missing", goBack: plan.goBack });
          return;
        }
        typed = fallback;
        freshWhy = "No session to continue: started from the spec instead.";
      } else if (plan.kind === "fork") {
        if (plan.midTurn && !opts.forkAnyway) {
          setBlocked({
            key: shown.key,
            kind: "mid-turn",
            parentKey: plan.parentKey,
            waiting: false,
          });
          return;
        }
        forkFrom = plan.from;
      }
    }
    setBlocked(null);
    const key = shown.key;
    setFreshNotes((prev) => {
      const { [key]: _drop, ...rest } = prev;
      return freshWhy ? { ...rest, [key]: freshWhy } : rest;
    });
    if (entryOfShown && rerunClearsConfirmed(shown))
      void record(
        { kind: "mark", stage: shown.key, mark: "clear", at: now() },
        markDir,
      );
    terminals.start({
      key,
      input: typed,
      unattended: unattendedStage,
      forkFrom,
      note: freshWhy ? freshNote() : undefined,
    });
  };
  startAgain.current = () => startShown();
  const rerun = () => startShown();
  const noSession = noSessionHere(entryOfShown, presence);
  const blockedHere = Boolean(blocked && shown && blocked.key === shown.key);
  const rerunnable = Boolean(
    entryOfShown && entryOfShown.status !== "running" && input !== null,
  );
  const terminalShown = Boolean(entryOfShown && entryOfShown.leaf !== null);
  const failedHere = Boolean(failed && shown && failed.key === shown.key);
  const notStartedNote = entryOfShown
    ? noSession
      ? `${shown?.name}'s session is not on this machine. It can be run again, not resumed.`
      : `${shown?.name}'s claude is not running. Its conversation is saved.`
    : `${shown?.name} has not started yet.`;
  const endedBar =
    entryOfShown && entryOfShown.status === "ended" && shown ? (
      <div className="flex shrink-0 items-center gap-2 border-b border-border/60 px-3 py-1 text-xs text-muted-foreground">
        <span>claude has exited.</span>
        {!entryOfShown.unattended && !noSession && (
          <Button
            size="xs"
            variant="outline"
            onClick={() => terminals.resume(shown.key)}
          >
            Resume
          </Button>
        )}
        {rerunnable && (
          <Button size="xs" variant="outline" onClick={rerun}>
            Re-run {shown.name}
          </Button>
        )}
      </div>
    ) : null;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <StageBar
        workflow={workflow}
        featureDir={featureDir}
        selected={index}
        onSelect={setSelected}
        progress={progress}
        live={live}
        outOfDate={stale}
        routePicker={
          <RoutePicker routes={routes} route={state.route} onPick={pickRoute} />
        }
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
          onNext={() => void onNext()}
          onRecheck={() => void check()}
          checking={checking}
          outOfDate={
            stale[shown.key]
              ? {
                  earlier: stale[shown.key],
                  canRerun: rerunnable,
                  onRerun: rerun,
                }
              : undefined
          }
          behind={
            behindOf && !stale[shown.key]
              ? behindNote(behindOf.parentKey, shown.name, behindTurns)
              : null
          }
          noSession={noSession}
          note={freshNotes[shown.key] ?? null}
          onDone={() => void mark("confirmed")}
          onSkip={() => void mark("skipped")}
        />
      )}
      <div className="relative min-h-0 flex-1">
        <div className="absolute inset-0">
          <StageTerminalHost
            entries={terminals.entries}
            shownKey={
              terminalShown && !failedHere && !blockedHere
                ? (shown?.key ?? null)
                : null
            }
            active={active}
            repoRoot={repoRoot}
            onShellExit={terminals.onShellExit}
            bar={endedBar}
          />
        </div>
        {(failedHere || blockedHere || !terminalShown) && (
          <div className="absolute inset-0 z-10 flex flex-col bg-background">
            {failedHere && failed ? (
              <CheckOutput result={failed.result} />
            ) : blockedHere && blocked && shown ? (
              <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3 px-6 text-center text-sm text-muted-foreground">
                {blocked.kind === "missing" ? (
                  <>
                    <span>
                      {blocked.goBack !== null
                        ? `${stageName(blocked.goBack)}'s session is not on this machine, so ${shown.name} has nothing to continue.`
                        : `There is no session on this machine for ${shown.name} to continue.`}
                    </span>
                    <div className="flex gap-2">
                      {blocked.goBack !== null && (
                        <Button
                          size="sm"
                          onClick={() => {
                            setBlocked(null);
                            setSelected(blocked.goBack);
                          }}
                        >
                          Go back to {stageName(blocked.goBack)}
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => startShown({ fresh: true })}
                      >
                        Start {shown.name} fresh anyway
                      </Button>
                    </div>
                  </>
                ) : blocked.waiting ? (
                  <>
                    <span>
                      Waiting for {blocked.parentKey} to finish its turn, then{" "}
                      {shown.name} forks it.
                    </span>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => startShown({ forkAnyway: true })}
                      >
                        Fork now
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setBlocked(null)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    <span>
                      {blocked.parentKey}'s claude is mid-turn. Forking it now
                      copies the session as saved, without the answer still
                      being written.
                    </span>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() =>
                          setBlocked({ ...blocked, waiting: true })
                        }
                      >
                        Wait for {blocked.parentKey}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => startShown({ forkAnyway: true })}
                      >
                        Fork anyway
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setBlocked(null)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3 text-sm text-muted-foreground">
                {shown ? notStartedNote : null}
                {entryOfShown &&
                  shown &&
                  !entryOfShown.unattended &&
                  !noSession && (
                    <Button
                      size="sm"
                      onClick={() => terminals.resume(shown.key)}
                    >
                      Resume {shown.name}
                    </Button>
                  )}
                {rerunnable && shown && (
                  <Button size="sm" variant="outline" onClick={rerun}>
                    Re-run {shown.name}
                  </Button>
                )}
                {!entryOfShown && input !== null && shown && (
                  <Button size="sm" onClick={rerun}>
                    {unattendedStage ? "Run" : "Start"} {shown.name}
                  </Button>
                )}
                {hasRouteOverride(workflow.stages[index]) && (
                  <RoutePicker
                    routes={routes}
                    route={state.route}
                    onPick={pickRoute}
                  />
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
