import { useCallback, useEffect, useRef, useState } from "react";
import {
  buildTickets,
  type Catalog,
  listFiles,
  mapFacts,
  type ProgressRead,
  type ProgressUpdate,
  readProgress,
  recordProgress,
} from "./lib/api";
import { joinPath } from "./lib/featurePaths";
import {
  chosenRoute,
  computeProgress,
  type Progress,
  type ProgressFile,
  repoListDirs,
} from "./lib/progress";
import { type Resolved, resolveWorkflow } from "./lib/workflowChoice";

export const PROGRESS_FILE = "progress.yaml";

export type FeatureState = {
  resolved: Resolved;
  progress: Progress | null;
  route: string | null;
  /** True when the route was inferred from a `map.md` and is not in progress.yaml. */
  routeInferred: boolean;
  /** Files that could not be read: a progress.yaml that does not load. */
  problems: string[];
};

const problemOf = (r: ProgressRead) =>
  r.error ? `${r.error.file}: ${r.error.message}` : null;

/**
 * Reads the folder's progress.yaml, the repo's, and the files the gates look at, then computes
 * the progress. Gates only look at files; nothing runs. It reloads on mount, on window focus
 * and after every record, never on a timer.
 */
export function useFeatureProgress(
  featureDir: string,
  repoRoot: string,
  catalog: Catalog,
) {
  const [state, setState] = useState<FeatureState | null>(null);
  const catalogRef = useRef(catalog);
  catalogRef.current = catalog;
  const seq = useRef(0);
  const stateRef = useRef<FeatureState | null>(null);
  stateRef.current = state;

  const refresh = useCallback(async () => {
    const mine = ++seq.current;
    const [feature, repo] = await Promise.all([
      readProgress(featureDir),
      readProgress(repoRoot),
    ]);
    const resolved = resolveWorkflow(
      catalogRef.current,
      feature.file?.workflow,
      joinPath(featureDir, PROGRESS_FILE),
    );
    let progress: Progress | null = null;
    let route: string | null = feature.file?.route ?? null;
    let routeInferred = false;
    if ("entry" in resolved) {
      const workflow = resolved.entry.workflow;
      const [featureFiles, repoFiles, tickets, facts] = await Promise.all([
        listFiles(featureDir, [""]),
        listFiles(repoRoot, repoListDirs(workflow)),
        buildTickets(featureDir),
        mapFacts(featureDir),
      ]);
      ({ route, inferred: routeInferred } = chosenRoute(
        workflow,
        feature.file?.route,
        featureFiles,
      ));
      progress = computeProgress({
        workflow,
        route,
        featureFiles,
        repoFiles,
        buildTickets: tickets.map((t) => t.name),
        ticketStatuses: Object.fromEntries(
          tickets.map((t) => [t.name, t.status_key]),
        ),
        mapFacts: facts,
        repoProgress: repo.file,
        featureProgress: feature.file,
      });
    }
    if (mine !== seq.current) return;
    setState({
      resolved,
      progress,
      route,
      routeInferred,
      problems: [problemOf(feature), problemOf(repo)].filter(
        (p): p is string => p !== null,
      ),
    });
  }, [featureDir, repoRoot]);

  useEffect(() => {
    const run = () =>
      refresh().catch((e) => console.error("could not read the progress", e));
    run();
    window.addEventListener("focus", run);
    return () => window.removeEventListener("focus", run);
  }, [refresh, catalog]);

  /** `dir` is the feature folder, or the repo root for a `scope: repo` stage. */
  const record = useCallback(
    async (update: ProgressUpdate, dir: string = featureDir) => {
      try {
        // Acting in the feature folder on an inferred route writes it first, so the record never falls back to the plain one.
        const current = stateRef.current;
        if (
          current?.routeInferred &&
          update.kind !== "route" &&
          dir === featureDir
        )
          await recordProgress(featureDir, {
            kind: "route",
            route: current.route,
          });
        await recordProgress(dir, update);
      } catch (e) {
        console.error("could not record the progress", e);
      }
      await refresh().catch((e) =>
        console.error("could not read the progress", e),
      );
    },
    [featureDir, refresh],
  );

  return { state, record, refresh };
}

export type { ProgressFile };
