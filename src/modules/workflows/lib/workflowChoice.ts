// Which workflow a feature folder uses: the id in its progress.yaml, or the shipped default
// when there is none.

import type { Catalog, CatalogEntry } from "./api";

const DEFAULT_WORKFLOW_ID = "matt-pocock";

export type Resolved = { entry: CatalogEntry } | { error: string };

const stem = (file: string) =>
  (file.split(/[\\/]/).pop() ?? file).replace(/\.ya?ml$/i, "");

/**
 * The entry for the id a progress.yaml names. A named id that does not load is an error that
 * carries the progress file's path and the load errors of the file by that name; nothing guesses.
 * With no id the shipped default, then the first entry.
 */
export function resolveWorkflow(
  catalog: Catalog,
  savedId: string | null | undefined,
  progressPath: string,
): Resolved {
  const byId = (id: string) => catalog.entries.find((e) => e.id === id);
  if (savedId) {
    const entry = byId(savedId);
    if (entry) return { entry };
    const why = catalog.errors
      .filter((e) => stem(e.file) === savedId)
      .map((e) => `${e.file}:${e.line}: ${e.message}`);
    return {
      error: [
        `${progressPath}: the workflow "${savedId}" does not load.`,
        ...why,
      ].join("\n"),
    };
  }
  const entry = byId(DEFAULT_WORKFLOW_ID) ?? catalog.entries[0];
  return entry
    ? { entry }
    : {
        error: [
          "No workflow loaded.",
          ...catalog.errors.map((e) => `${e.file}:${e.line}: ${e.message}`),
        ].join("\n"),
      };
}
