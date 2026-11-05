import { describe, expect, it } from "vitest";
import type { Catalog, CatalogEntry } from "./api";
import { resolveWorkflow } from "./workflowChoice";

const entry = (id: string): CatalogEntry => ({
  id,
  source: "user",
  path: `/u/${id}.yaml`,
  dir: "/u",
  workflow: { id, title: id, description: "", stages: [] },
  shadows: [],
});

const catalog = (ids: string[], errors: Catalog["errors"] = []): Catalog => ({
  entries: ids.map(entry),
  errors,
  user_dir: "/u",
});

const P = "/r/.scratch/login/progress.yaml";

describe("resolveWorkflow", () => {
  it("uses the id the progress file names", () => {
    const r = resolveWorkflow(catalog(["matt-pocock", "mine"]), "mine", P);
    expect("entry" in r && r.entry.id).toBe("mine");
  });

  it("assumes the shipped default with no progress file", () => {
    const r = resolveWorkflow(catalog(["mine", "matt-pocock"]), undefined, P);
    expect("entry" in r && r.entry.id).toBe("matt-pocock");
  });

  it("takes the first entry when even the default is shadowed by a broken file", () => {
    const r = resolveWorkflow(catalog(["mine"]), null, P);
    expect("entry" in r && r.entry.id).toBe("mine");
  });

  it("shows an error with the progress file's path for a workflow that does not load", () => {
    const r = resolveWorkflow(
      catalog(
        ["matt-pocock"],
        [
          { file: "/u/gone.yaml", line: 3, message: "unknown key" },
          { file: "/u/other.yaml", line: 1, message: "bad" },
        ],
      ),
      "gone",
      P,
    );
    expect("error" in r && r.error).toContain(P);
    expect("error" in r && r.error).toContain("/u/gone.yaml:3: unknown key");
    expect("error" in r && r.error).not.toContain("other.yaml");
  });

  it("is an error when nothing loads at all", () => {
    const r = resolveWorkflow(catalog([]), undefined, P);
    expect("error" in r).toBe(true);
  });
});
