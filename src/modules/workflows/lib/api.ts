import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import { native } from "@/modules/ai/lib/native";
import { featureDirOf, scratchDir } from "./featurePaths";

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
export const fetchCatalog = (repoRoot: string) =>
  invoke<Catalog>("workflows_catalog", { repoRoot });

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
