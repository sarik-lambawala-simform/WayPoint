import { basename, findSpaceByRoot, type SpaceRef } from "./featurePaths";

export type OpenRepoPlan =
  | { kind: "switch"; spaceId: string }
  | { kind: "create"; name: string; root: string };

/** A repo is one space, rooted at its git top folder: switch to it, or create it. */
export function planOpenRepo(
  spaces: SpaceRef[],
  repoRoot: string,
): OpenRepoPlan {
  const existing = findSpaceByRoot(spaces, repoRoot);
  if (existing) return { kind: "switch", spaceId: existing.id };
  return { kind: "create", name: basename(repoRoot), root: repoRoot };
}
