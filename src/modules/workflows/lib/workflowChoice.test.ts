import { describe, expect, it } from "vitest";
import type { Catalog, CatalogEntry } from "./api";
import { resolveEntry } from "./workflowChoice";

const entry = (id: string): CatalogEntry => ({
  id,
  source: "user",
  path: `/u/${id}.yaml`,
  dir: "/u",
  workflow: { id, title: id, description: "", stages: [] },
  shadows: [],
});

const catalog = (...ids: string[]): Catalog => ({
  entries: ids.map(entry),
  errors: [],
  user_dir: "/u",
});

describe("resolveEntry", () => {
  it("uses the saved id when its workflow exists", () => {
    expect(resolveEntry(catalog("matt-pocock", "mine"), "mine")?.id).toBe(
      "mine",
    );
  });

  it("falls back to the shipped default when the saved file is gone", () => {
    expect(resolveEntry(catalog("matt-pocock", "mine"), "gone")?.id).toBe(
      "matt-pocock",
    );
    expect(resolveEntry(catalog("matt-pocock"), undefined)?.id).toBe(
      "matt-pocock",
    );
  });

  it("takes the first entry when even the default is shadowed by a broken file", () => {
    expect(resolveEntry(catalog("mine"), undefined)?.id).toBe("mine");
    expect(resolveEntry(catalog(), undefined)).toBeUndefined();
  });
});
