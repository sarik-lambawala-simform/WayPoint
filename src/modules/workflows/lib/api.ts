import { native } from "@/modules/ai/lib/native";
import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import { IS_WINDOWS } from "@/lib/platform";
import { currentWorkspaceEnv, getWslHome } from "@/modules/workspace";
import { featureDirOf, scratchDir } from "./featurePaths";
import type { LiveRun } from "./loopLaunch";
import type { MapFacts, ProgressFile } from "./progress";
import { linuxPathOfHost, wslHostPath } from "./wsl";

/**
 * The WSL distro of the space this workflow is open in, on Windows; null elsewhere. Paths in the
 * app are Linux paths there (a repo's identity); only the calls that read files on this side turn
 * them into `\\wsl.localhost\<distro>\...` through `hostOf`.
 */
export function wslDistro(): string | null {
  const env = currentWorkspaceEnv();
  return IS_WINDOWS && env.kind === "wsl" ? env.distro : null;
}

const hostOf = (path: string): string => {
  const distro = wslDistro();
  return distro ? wslHostPath(distro, path) : path;
};

const homes = new Map<string, Promise<string>>();

/** Where claude keeps its sessions for a WSL space: the distro's home as this side reads it. */
async function claudeHome(): Promise<string | null> {
  const distro = wslDistro();
  if (!distro) return null;
  let home = homes.get(distro);
  if (!home) {
    home = getWslHome(distro).then((h) => wslHostPath(distro, h));
    homes.set(distro, home);
    home.catch(() => homes.delete(distro));
  }
  return home;
}

export type DoneWhen = "confirm" | "tickets" | "map" | { check: string };

export type Stage = {
  name: string;
  skill?: string | null;
  prompt?: string | null;
  run?: string | null;
  args?: string | null;
  mode?: "interactive" | "unattended";
  session?: "continue" | "fresh" | null;
  produces?: string[];
  done_when?: DoneWhen | null;
  optional: boolean;
  scope?: "repo" | null;
  routes?: Record<string, unknown>;
};

export type Workflow = {
  id: string;
  title: string;
  description: string;
  stages: Stage[];
};

export type WorkflowSource = "repo" | "user" | "shipped";

export type FileRef = { source: WorkflowSource; path: string };

/** A workflow the picker offers: the file in use and the files it shadows. */
export type CatalogEntry = {
  id: string;
  source: WorkflowSource;
  path: string;
  dir: string;
  workflow: Workflow;
  shadows: FileRef[];
};

export type LoadError = { file: string; line: number; message: string };

export type Catalog = {
  entries: CatalogEntry[];
  errors: LoadError[];
  /** The real path of the user workflows folder. */
  user_dir: string;
};

/** Every workflow visible from a repo: shipped, `~/.config/waypoint/workflows/`, `.workflows/`. */
export async function fetchCatalog(repoRoot: string): Promise<Catalog> {
  const catalog = await invoke<Catalog>("workflows_catalog", {
    repoRoot: hostOf(repoRoot),
  });
  const distro = wslDistro();
  if (!distro) return catalog;
  // A workflow found in the repo is named by its Linux path: `{{ workflow_dir }}` is typed into a
  // terminal that runs in the distro.
  const linux = (p: string) => linuxPathOfHost(distro, p) ?? p;
  const ref = <T extends { path: string }>(r: T): T => ({
    ...r,
    path: linux(r.path),
  });
  return {
    ...catalog,
    entries: catalog.entries.map((e) =>
      e.source === "repo"
        ? { ...ref(e), dir: linux(e.dir), shadows: e.shadows.map(ref) }
        : { ...e, shadows: e.shadows.map(ref) },
    ),
  };
}

export async function pickFolder(): Promise<string | null> {
  const picked = await open({ directory: true, multiple: false });
  return typeof picked === "string" ? picked : null;
}

/** The git top folder containing `dir`, or null when it is not in a repo. */
export async function resolveRepoRoot(dir: string): Promise<string | null> {
  await native.workspaceAuthorize(dir);
  const info = await native.gitResolveRepo(dir);
  return info?.repoRoot ?? null;
}

/** Names of the `.scratch/*` folders of a repo; empty when there is no `.scratch`. */
export async function listFeatures(repoRoot: string): Promise<string[]> {
  try {
    const entries = await native.readDir(scratchDir(repoRoot));
    return entries.filter((e) => e.kind === "dir").map((e) => e.name);
  } catch {
    return [];
  }
}

export async function createFeature(
  repoRoot: string,
  name: string,
): Promise<string> {
  const dir = featureDirOf(repoRoot, name);
  await native.createDir(dir);
  return dir;
}

export type ProgressRead = {
  file: ProgressFile | null;
  /** A `progress.yaml` that exists but does not load: which file, and why. */
  error: { file: string; message: string } | null;
};

export type ProgressUpdate =
  | { kind: "workflow"; id: string }
  | { kind: "route"; route: string | null }
  | {
      kind: "mark";
      stage: string;
      mark: "confirmed" | "skipped" | "passed" | "clear";
      at: string;
    };

/** The `progress.yaml` of a feature folder or of the repo root. */
export const readProgress = (dir: string) =>
  invoke<ProgressRead>("workflows_read_progress", { dir: hostOf(dir) });

/** Writes one record to `<dir>/progress.yaml`; the only thing that ever creates the file. */
export const recordProgress = (dir: string, update: ProgressUpdate) =>
  invoke<ProgressFile>("workflows_record_progress", {
    dir: hostOf(dir),
    update,
  });

/** Relative paths of the files under each of `dirs` ("" is `root` itself). */
export const listFiles = (root: string, dirs: string[]) =>
  invoke<string[]>("workflows_list_files", { root: hostOf(root), dirs });

/** Names of the build tickets in `<featureDir>/issues`: human tickets count, wayfinder ones don't. */
export const buildTickets = (featureDir: string) =>
  invoke<string[]>("workflows_build_tickets", {
    featureDir: hostOf(featureDir),
  });

/** Turns typed into a claude session after `since` (ISO time); null when its transcript is not on this machine. */
export const sessionTurns = async (
  repoRoot: string,
  sessionId: string,
  since: string,
) =>
  invoke<number | null>("workflows_session_turns", {
    repoRoot,
    sessionId,
    since,
    claudeHome: await claudeHome(),
  });

/** For each session id, whether claude's transcript for it is on this machine. */
export const sessionsPresent = async (repoRoot: string, sessionIds: string[]) =>
  invoke<boolean[]>("workflows_sessions_present", {
    repoRoot,
    sessionIds,
    claudeHome: await claudeHome(),
  });

export type CheckResult = {
  passed: boolean;
  /** Null when the command did not start, timed out or was killed. */
  exit_code: number | null;
  output: string;
  /** The command as run, placeholders filled in. */
  command: string;
};

/** Runs a `check` gate's command in the repo root. Only "Next", "Recheck" and the exit of an unattended stage call this. */
export const runCheck = (
  repoRoot: string,
  featureDir: string,
  workflowDir: string,
  command: string,
) =>
  invoke<CheckResult>("workflows_run_check", {
    repoRoot,
    featureDir,
    workflowDir,
    command,
    // The gate runs inside the distro, in the repo's Linux path.
    distro: wslDistro(),
  });

/** What the `map` gate looks at: `map.md`, the open wayfinder tickets and Not yet specified. */
export const mapFacts = (featureDir: string) =>
  invoke<MapFacts>("workflows_map_facts", {
    featureDir: hostOf(featureDir),
  });

/** What `command -v jq git curl claude` printed in the distro; rejects when wsl.exe cannot run it. */
export const wslCheck = (distro: string) =>
  invoke<string>("workflows_wsl_check", { distro });

/** The live runs of a repo, whatever feature each works on. */
export const loopLive = (repoRoot: string) =>
  invoke<LiveRun[]>("workflows_loop_live", { repoRoot });

/** Starts the script detached in the repo root; rejects with why it could not. */
export const startLoop = (repoRoot: string, args: string[], line: string) =>
  invoke<void>("workflows_loop_start", {
    repoRoot,
    args,
    launchLine: line,
  });
