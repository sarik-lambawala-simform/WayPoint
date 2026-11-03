// Which feature tabs were open, so the module can reopen them on launch. Terax's own tab saving
// skips feature tabs (`isSerializableTab` is false for them); this store is the module's own.

import { LazyStore } from "@tauri-apps/plugin-store";
import type { Tab } from "@/modules/tabs";

export type SavedFeature = {
  spaceId: string;
  repoRoot: string;
  feature: string;
};

const store = new LazyStore("waypoint-features.json", {
  defaults: {},
  autoSave: 500,
});
const KEY = "features";

export function featureEntries(tabs: Tab[]): SavedFeature[] {
  const out: SavedFeature[] = [];
  for (const t of tabs) {
    if (t.kind === "feature") {
      out.push({
        spaceId: t.spaceId,
        repoRoot: t.repoRoot,
        feature: t.feature,
      });
    }
  }
  return out;
}

/** Entries to reopen: known space, and the feature folder still exists. */
export function planRestore(
  saved: unknown,
  spaceIds: Set<string>,
  existing: (repoRoot: string) => Set<string> | undefined,
): SavedFeature[] {
  if (!Array.isArray(saved)) return [];
  const out: SavedFeature[] = [];
  for (const e of saved) {
    if (
      !e ||
      typeof e.spaceId !== "string" ||
      typeof e.repoRoot !== "string" ||
      typeof e.feature !== "string"
    ) {
      continue;
    }
    if (!spaceIds.has(e.spaceId)) continue;
    if (!existing(e.repoRoot)?.has(e.feature)) continue;
    out.push({ spaceId: e.spaceId, repoRoot: e.repoRoot, feature: e.feature });
  }
  return out;
}

export async function loadSavedFeatures(): Promise<unknown> {
  return (await store.get<unknown>(KEY)) ?? [];
}

export async function saveFeatures(entries: SavedFeature[]): Promise<void> {
  await store.set(KEY, entries);
}
