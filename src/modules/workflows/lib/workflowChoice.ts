// Which workflow a feature folder uses. Kept in the module's own store, keyed by the feature
// folder path; a feature with no choice uses the shipped default.

import { LazyStore } from "@tauri-apps/plugin-store";
import type { Catalog, CatalogEntry } from "./api";

export const DEFAULT_WORKFLOW_ID = "matt-pocock";

/** The entry for a saved id; the shipped default, then the first entry, when it is gone. */
export function resolveEntry(
  catalog: Catalog,
  savedId: string | undefined,
): CatalogEntry | undefined {
  const byId = (id: string | undefined) =>
    id === undefined ? undefined : catalog.entries.find((e) => e.id === id);
  return byId(savedId) ?? byId(DEFAULT_WORKFLOW_ID) ?? catalog.entries[0];
}

const store = new LazyStore("waypoint-workflow-choice.json", {
  defaults: {},
  autoSave: 200,
});

export async function loadWorkflowChoice(
  featureDir: string,
): Promise<string | undefined> {
  const all = await store.get<Record<string, unknown>>("choices");
  const id = all?.[featureDir];
  return typeof id === "string" ? id : undefined;
}

export async function saveWorkflowChoice(
  featureDir: string,
  id: string,
): Promise<void> {
  const all = (await store.get<Record<string, string>>("choices")) ?? {};
  await store.set("choices", { ...all, [featureDir]: id });
}
