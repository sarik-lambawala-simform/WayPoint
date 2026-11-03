// The progress model: a pure function from a workflow, a route, the files of the feature folder
// and of the repo, and the two progress.yaml files to each stage's state and the current stage.

import type { Stage, Workflow } from "./api";

export type Marks = {
  confirmed?: string | null;
  skipped?: string | null;
  /** When a `check` gate last passed. */
  "check passed"?: string | null;
};

/** What `progress.yaml` holds: the workflow, the route and per stage a mark, keyed by plain name. */
export type ProgressFile = {
  workflow?: string | null;
  route?: string | null;
  stages?: Record<string, Marks>;
};

export type StageState =
  | "current"
  | "done"
  | "skipped"
  | "not-recorded"
  | "pending";

export type GateKind =
  | "produces"
  | "confirm"
  | "tickets"
  | "map"
  | "check"
  | "none";

export type StageProgress = {
  /** The name shown: a route may rename the stage. */
  name: string;
  /** The stage's plain name, the key of its marks. */
  key: string;
  state: StageState;
  gate: GateKind;
  gatePasses: boolean;
  optional: boolean;
  repoScoped: boolean;
  produces: string[];
  /** Files the `produces` entries matched, relative to the stage's own folder. */
  produced: string[];
  /** When the stage was confirmed or skipped, or its check passed. */
  markedAt: string | null;
  /** The shell command of a `check` gate, placeholders unfilled; null on any other gate. */
  check: string | null;
};

export type Progress = {
  stages: StageProgress[];
  /** Index of the current stage; null once every stage up to the end is passed. */
  current: number | null;
  /** The last stage that passed, the one "Next" moves on from. */
  lastPassed: number | null;
  /** True once the whole workflow is passed (for the matt-pocock one: the Loop and Retro). */
  done: boolean;
};

/** What the `map` gate looks at, from `workflows_map_facts`. */
export type MapFacts = {
  /** `map.md` exists in the feature folder. */
  exists: boolean;
  /** Wayfinder tickets in `issues/` that are not completed, resolved or done. */
  open_wayfinder: string[];
  /** `## Not yet specified` holds nothing but comments. */
  unspecified_clear: boolean;
};

export type ProgressInput = {
  workflow: Workflow;
  route: string | null;
  /** Paths relative to the feature folder. */
  featureFiles: string[];
  /** Paths relative to the repo root, for the `scope: repo` stages. */
  repoFiles: string[];
  repoProgress: ProgressFile | null;
  featureProgress: ProgressFile | null;
  /** Names of the build tickets in `issues/`, by the Rust reader's rule (`workflows_build_tickets`). */
  buildTickets?: string[];
  /** For the `map` gate; without it that gate does not pass. */
  mapFacts?: MapFacts;
};

/** The route a workflow's stages override on, in first-seen order. */
export function routesOf(workflow: Workflow): string[] {
  const names = new Set<string>();
  for (const stage of workflow.stages)
    for (const r of Object.keys(stage.routes ?? {})) names.add(r);
  return [...names];
}

/** True for a stage that has an override on at least one route. */
export const hasRouteOverride = (stage: Stage) =>
  Object.keys(stage.routes ?? {}).length > 0;

/** The route name `progress.yaml` holds for a deliberate pick of the plain route. */
export const PLAIN_ROUTE = "";

/**
 * The route in force. A recorded route wins (the empty one is the plain route). With none
 * recorded and a `map.md` in the folder, the Wayfinder route is inferred, when the workflow has
 * one; `inferred` says it was not written.
 */
export function chosenRoute(
  workflow: Workflow,
  recorded: string | null | undefined,
  featureFiles: string[],
): { route: string | null; inferred: boolean } {
  if (recorded !== null && recorded !== undefined)
    return {
      route: recorded === PLAIN_ROUTE ? null : recorded,
      inferred: false,
    };
  if (
    featureFiles.includes("map.md") &&
    routesOf(workflow).includes("wayfinder")
  )
    return { route: "wayfinder", inferred: true };
  return { route: null, inferred: false };
}

/** The `map` gate: `map.md` exists, no wayfinder ticket is open, nothing under Not yet specified. */
export function mapCleared(facts: MapFacts | undefined): boolean {
  return Boolean(
    facts &&
      facts.exists &&
      facts.open_wayfinder.length === 0 &&
      facts.unspecified_clear,
  );
}

/** A stage with the chosen route's overrides applied. */
export function effectiveStage(stage: Stage, route: string | null): Stage {
  const over = route ? stage.routes?.[route] : undefined;
  if (!over || typeof over !== "object") return stage;
  const patch = Object.fromEntries(
    Object.entries(over).filter(([, v]) => v !== null && v !== undefined),
  );
  return { ...stage, ...patch, routes: stage.routes } as Stage;
}

function globToRegExp(pattern: string): RegExp {
  const segments = pattern.split("/").filter((s) => s !== "" && s !== ".");
  let source = "^";
  segments.forEach((seg, i) => {
    const last = i === segments.length - 1;
    if (seg === "**") {
      source += last ? ".*" : "(?:[^/]+/)*";
      return;
    }
    source += seg
      .split("")
      .map((c) =>
        c === "*"
          ? "[^/]*"
          : c === "?"
            ? "[^/]"
            : c.replace(/[.+^${}()|[\]\\]/g, "\\$&"),
      )
      .join("");
    if (!last) source += "/";
  });
  return new RegExp(`${source}$`);
}

/** Files matching one `produces` entry (`*` and `?` stay inside a folder, `**` crosses them). */
export function matchProduces(entry: string, files: string[]): string[] {
  const re = globToRegExp(entry);
  return files.filter((f) => re.test(f));
}

/**
 * A stage with no gate and no `produces` stays unmet.
 */
function gateKind(stage: Stage): GateKind {
  const w = stage.done_when;
  if (w === "confirm" || w === "tickets" || w === "map") return w;
  if (w && typeof w === "object") return "check";
  return stage.produces && stage.produces.length > 0 ? "produces" : "none";
}

function evaluate(stage: Stage & { key: string }, input: ProgressInput) {
  const repoScoped = stage.scope === "repo";
  const files = repoScoped ? input.repoFiles : input.featureFiles;
  const marksFile = repoScoped ? input.repoProgress : input.featureProgress;
  const marks = marksFile?.stages?.[stage.key] ?? {};
  const produces = stage.produces ?? [];
  const produced = [
    ...new Set(produces.flatMap((p) => matchProduces(p, files))),
  ];
  const everyMatches =
    produces.length > 0 &&
    produces.every((p) => matchProduces(p, files).length > 0);
  const kind = gateKind(stage);

  let gatePasses = false;
  if (kind === "confirm") gatePasses = Boolean(marks.confirmed);
  else if (kind === "check") gatePasses = Boolean(marks["check passed"]);
  else if (kind === "tickets")
    gatePasses = (input.buildTickets ?? []).length > 0;
  else if (kind === "map") gatePasses = mapCleared(input.mapFacts);
  else if (kind === "produces") gatePasses = everyMatches;

  const skipped = stage.optional && Boolean(marks.skipped) && !gatePasses;
  return {
    repoScoped,
    kind,
    produces,
    produced,
    gatePasses,
    skipped,
    check:
      kind === "check" && typeof stage.done_when === "object"
        ? (stage.done_when as { check: string }).check
        : null,
    markedAt:
      (skipped ? marks.skipped : (marks.confirmed ?? marks["check passed"])) ??
      null,
  };
}

export function computeProgress(input: ProgressInput): Progress {
  const raw = input.workflow.stages;
  const rows = raw.map((s) => {
    const stage = {
      ...effectiveStage(s, input.route),
      key: s.name,
    } as Stage & {
      key: string;
    };
    return { stage, ...evaluate(stage, input) };
  });
  const passes = rows.map((r) => r.gatePasses || r.skipped);

  // An optional last stage (Retro) offers its skip on itself: it never pulls the current
  // stage past an unfinished Loop, and the feature is done only when it is confirmed or skipped.
  const n = rows.length;
  const trailing = n > 0 && rows[n - 1].stage.optional ? n - 1 : null;
  const main = trailing ?? n;

  let lastMain: number | null = null;
  for (let i = 0; i < main; i++) if (passes[i]) lastMain = i;
  let current: number | null = (lastMain ?? -1) + 1;
  let done = false;
  if (current >= main) {
    if (trailing !== null && !passes[trailing]) current = trailing;
    else {
      current = null;
      done = true;
    }
  }
  let lastPassed: number | null = null;
  for (let i = 0; i < (current ?? n); i++) if (passes[i]) lastPassed = i;

  const stages: StageProgress[] = rows.map((r, i) => {
    let state: StageState;
    if (passes[i]) state = r.skipped ? "skipped" : "done";
    else if (i === current) state = "current";
    else if (current === null || i < current) state = "not-recorded";
    else state = "pending";
    return {
      name: r.stage.name,
      key: r.stage.key,
      state,
      gate: r.kind,
      gatePasses: r.gatePasses,
      optional: r.stage.optional,
      repoScoped: r.repoScoped,
      produces: r.produces,
      produced: r.produced,
      markedAt: passes[i] ? r.markedAt : null,
      check: r.check,
    };
  });
  return { stages, current, lastPassed, done };
}

/** The directories to list so the `scope: repo` stages' `produces` entries can be matched. */
export function repoListDirs(workflow: Workflow): string[] {
  const dirs = new Set<string>();
  for (const stage of workflow.stages) {
    const variants = [
      stage,
      ...Object.keys(stage.routes ?? {}).map((r) => effectiveStage(stage, r)),
    ];
    for (const s of variants) {
      if (s.scope !== "repo") continue;
      for (const p of s.produces ?? []) {
        const parts = p.split("/");
        const literal: string[] = [];
        for (const part of parts.slice(0, -1)) {
          if (/[*?]/.test(part)) break;
          literal.push(part);
        }
        dirs.add(literal.join("/"));
      }
    }
  }
  return [...dirs];
}

/** The title of a feature tab: `<feature> · <current stage>`, or just the feature once done; a dot while a claude in it runs. */
export function featureTabTitle(
  feature: string,
  progress: Progress | null,
  live = false,
): string {
  const base = !progress
    ? feature
    : progress.current === null
      ? `${feature} · done`
      : `${feature} · ${progress.stages[progress.current].name}`;
  return live ? `${base} ●` : base;
}

/** What the stage header offers for the stage at `index`. */
export type HeaderActions = {
  /** Name of the stage "Next" moves to; null when the stage offers no Next. */
  next: string | null;
  nextEnabled: boolean;
  done: boolean;
  skip: boolean;
  /** A `check` stage offers "Recheck" once it has come up. */
  recheck: boolean;
};

export function headerActions(
  progress: Progress,
  index: number,
): HeaderActions {
  const stage = progress.stages[index];
  const following = progress.stages[index + 1];
  const offersNext =
    following !== undefined &&
    (index === progress.current || index === progress.lastPassed);
  const pending = stage.state === "pending";
  const passed = stage.state === "done" || stage.state === "skipped";
  return {
    next: offersNext ? following.name : null,
    // On a `check` stage "Next" is what runs the check, so it stays pressable.
    nextEnabled: offersNext && (passed || (stage.gate === "check" && !pending)),
    done: stage.gate === "confirm" && !passed && !pending,
    skip: stage.optional && !passed && !pending,
    recheck: stage.gate === "check" && !pending,
  };
}

/** How long ago `iso` was, as the header shows a check's pass: "just now", "5 min ago". */
export function ageOf(iso: string, now: Date): string {
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return iso;
  const s = Math.max(0, Math.round((now.getTime() - t) / 1000));
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} h ago`;
  return `${Math.floor(h / 24)} d ago`;
}
