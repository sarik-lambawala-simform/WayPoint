// The progress model: a pure function from a workflow, a route, the files of the feature folder
// and of the repo, and the two progress.yaml files to each stage's state and the current stage.

import type { Stage, Workflow } from "./api";

export type Marks = { confirmed?: string | null; skipped?: string | null };

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
  /** When the stage was confirmed or skipped. */
  markedAt: string | null;
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

export type ProgressInput = {
  workflow: Workflow;
  route: string | null;
  /** Paths relative to the feature folder. */
  featureFiles: string[];
  /** Paths relative to the repo root, for the `scope: repo` stages. */
  repoFiles: string[];
  repoProgress: ProgressFile | null;
  featureProgress: ProgressFile | null;
};

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
 * Gates not built yet fall back to what a plain file check can say: `tickets` and `map` use the
 * stage's `produces`, `check` and a stage with no gate at all stay unmet until their tickets land.
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
  else if (kind === "produces" || kind === "tickets" || kind === "map")
    gatePasses = everyMatches;

  const skipped = stage.optional && Boolean(marks.skipped) && !gatePasses;
  return {
    repoScoped,
    kind,
    produces,
    produced,
    gatePasses,
    skipped,
    markedAt: (skipped ? marks.skipped : marks.confirmed) ?? null,
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

/** The title of a feature tab: `<feature> · <current stage>`, or just the feature once done. */
export function featureTabTitle(
  feature: string,
  progress: Progress | null,
): string {
  if (!progress) return feature;
  if (progress.current === null) return `${feature} · done`;
  return `${feature} · ${progress.stages[progress.current].name}`;
}

/** What the stage header offers for the stage at `index`. */
export type HeaderActions = {
  /** Name of the stage "Next" moves to; null when the stage offers no Next. */
  next: string | null;
  nextEnabled: boolean;
  done: boolean;
  skip: boolean;
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
  const passed = stage.state === "done" || stage.state === "skipped";
  return {
    next: offersNext ? following.name : null,
    nextEnabled: offersNext && passed,
    done: stage.gate === "confirm" && !passed,
    skip: stage.optional && !passed,
  };
}
