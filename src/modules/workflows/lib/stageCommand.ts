// The command lines a stage terminal runs and the text a stage types into claude. Pure.

import type { Stage } from "./api";
import { normalizeRoot } from "./featurePaths";

const SESSION_ID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const isSessionId = (id: string) => SESSION_ID.test(id);

function checkedId(id: string): string {
  if (!SESSION_ID.test(id)) throw new Error(`not a claude session id: ${id}`);
  return id;
}

/** A fresh claude session of the app's own choosing. */
export const freshLine = (id: string) => `claude --session-id ${checkedId(id)}`;

/** The stage's own session again; nothing is typed afterwards. */
export const resumeLine = (id: string) => `claude --resume ${checkedId(id)}`;

/** A forked session: the previous stage's session, branched under a new id of the app's choosing. */
export const forkLine = (fromId: string, newId: string) =>
  `claude --resume ${checkedId(fromId)} --fork-session --session-id ${checkedId(newId)}`;

/** Typed into the shell before a re-run: the replaced session is kept, not deleted. It avoids the word the agent detector arms on. */
export const rerunNote = (oldId: string) =>
  `echo "Re-running: the previous session ${checkedId(oldId)} stays on disk."`;

/** An unattended stage: one `claude -p` run whose exit ends the stage's turn. */
export const unattendedLine = (command: string) =>
  `claude -p "${command.replace(/[\\"$`]/g, "\\$&")}"`;

export type Vars = { feature: string; workflowDir: string };

/** `{{ feature }}` and `{{ workflow_dir }}`; any other name stays as written. */
export function substituteVars(text: string, vars: Vars): string {
  let out = "";
  let rest = text;
  for (;;) {
    const start = rest.indexOf("{{");
    if (start < 0) break;
    const end = rest.indexOf("}}", start + 2);
    if (end < 0) break;
    out += rest.slice(0, start);
    const name = rest.slice(start + 2, end).trim();
    out +=
      name === "feature"
        ? vars.feature
        : name === "workflow_dir"
          ? vars.workflowDir
          : rest.slice(start, end + 2);
    rest = rest.slice(end + 2);
  }
  return out + rest;
}

/** The feature folder relative to the repo root, forward slashes. */
export function featureRel(repoRoot: string, featureDir: string): string {
  const root = normalizeRoot(repoRoot);
  const dir = normalizeRoot(featureDir);
  return dir.startsWith(`${root}/`) ? dir.slice(root.length + 1) : dir;
}

/**
 * What the stage types into claude: `/<skill> <args>`, or its prompt as written. Null for a stage
 * with nothing to type (the Loop). Takes the stage with its route's overrides applied.
 */
export function stageInput(
  stage: Pick<Stage, "name" | "skill" | "args" | "prompt" | "run">,
  vars: Vars,
): string | null {
  if (stage.skill) {
    const args = stage.args ? substituteVars(stage.args, vars).trim() : "";
    return args ? `/${stage.skill} ${args}` : `/${stage.skill}`;
  }
  if (stage.prompt) return substituteVars(stage.prompt, vars);
  return null;
}
