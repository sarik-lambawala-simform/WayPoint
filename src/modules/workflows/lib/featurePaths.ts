// Pure path and name helpers for repos and feature folders.

export function normalizeRoot(path: string): string {
  const slashed = path.replace(/\\/g, "/");
  const trimmed = slashed.replace(/\/+$/, "");
  return trimmed === "" && slashed.startsWith("/") ? "/" : trimmed;
}

export function joinPath(parent: string, name: string): string {
  const base = normalizeRoot(parent);
  return base === "/" ? `/${name}` : `${base}/${name}`;
}

export function basename(path: string): string {
  const parts = normalizeRoot(path).split("/").filter(Boolean);
  return parts.length ? parts[parts.length - 1] : path;
}

const SCRATCH_DIR = ".scratch";

export function scratchDir(repoRoot: string): string {
  return joinPath(repoRoot, SCRATCH_DIR);
}

export function featureDirOf(repoRoot: string, feature: string): string {
  return joinPath(scratchDir(repoRoot), feature);
}

/** Why `name` cannot be a feature folder name, or null when it can. */
export function featureNameError(name: string): string | null {
  const n = name.trim();
  if (!n) return "Name is required";
  if (n === "." || n === "..") return "Not a valid folder name";
  if (/[\\/]/.test(n)) return "A feature name cannot contain a slash";
  if (n.startsWith(".")) return "A feature name cannot start with a dot";
  if (/[<>:"|?*\u0000-\u001f]/.test(n))
    return "Contains a character not allowed in a folder name";
  return null;
}

export type SpaceRef = { id: string; root: string | null };

/** The space rooted at `root`, if any: one space per repo. */
export function findSpaceByRoot<T extends SpaceRef>(
  spaces: T[],
  root: string,
): T | undefined {
  const want = normalizeRoot(root);
  return spaces.find((s) => s.root !== null && normalizeRoot(s.root) === want);
}
