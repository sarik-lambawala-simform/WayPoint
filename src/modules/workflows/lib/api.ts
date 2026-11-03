import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import { native } from "@/modules/ai/lib/native";
import { featureDirOf, scratchDir } from "./featurePaths";

type Stage = {
  name: string;
  skill?: string | null;
  run?: string | null;
  optional: boolean;
  scope?: string | null;
};

export type Workflow = {
  id: string;
  title: string;
  description: string;
  stages: Stage[];
};

/** The shipped workflow, parsed by the Rust `workflows` module. */
export const fetchShippedWorkflow = () => invoke<Workflow>("workflows_shipped");

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
