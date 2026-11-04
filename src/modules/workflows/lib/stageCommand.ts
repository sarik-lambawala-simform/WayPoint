// The command lines a stage terminal runs and the first message a stage sends claude. Pure.

import type { Stage } from "./api";
import { normalizeRoot } from "./featurePaths";

const SESSION_ID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const isSessionId = (id: string) => SESSION_ID.test(id);

function checkedId(id: string): string {
  if (!SESSION_ID.test(id)) throw new Error(`not a claude session id: ${id}`);
  return id;
}

/**
 * `text` after `--` (so a leading dash is never an option), as one single-quoted shell word:
 * nothing inside is expanded, `!` included, which bash and zsh expand even inside double quotes.
 * A carriage return would submit the typed line early, so it becomes a newline.
 */
const withPrompt = (line: string, text?: string) =>
  text
    ? `${line} -- '${text.replace(/\r\n?/g, "\n").replace(/'/g, "'\\''")}'`
    : line;

/**
 * A fresh claude session of the app's own choosing. `input` (the stage's command) goes on the
 * command line as the first message, so nothing the user types first can land ahead of it.
 */
export const freshLine = (id: string, input?: string) =>
  withPrompt(`claude --session-id ${checkedId(id)}`, input);

/** The stage's own session again; nothing is typed afterwards. */
export const resumeLine = (id: string) => `claude --resume ${checkedId(id)}`;

/** A forked session: the previous stage's session, branched under a new id of the app's choosing. */
export const forkLine = (fromId: string, newId: string, input?: string) =>
  withPrompt(
    `claude --resume ${checkedId(fromId)} --fork-session --session-id ${checkedId(newId)}`,
    input,
  );

/** Typed into the shell before a re-run: the replaced session is kept, not deleted. It avoids the word the agent detector arms on. */
export const rerunNote = (oldId: string) =>
  `echo "Re-running: the previous session ${checkedId(oldId)} stays on disk."`;

/** An unattended stage: one `claude -p` run whose exit ends the stage's turn. */
export const unattendedLine = (command: string) =>
  withPrompt("claude -p", command);

/** Typed before a stage that started fresh for want of a session to fork. Avoids the word the agent detector arms on. */
export const FRESH_WHY =
  "Started fresh: there was no earlier session to continue.";
export const freshNote = () => `echo "${FRESH_WHY}"`;

/** Several notes in one shell line. */
export const joinNotes = (notes: (string | undefined)[]) =>
  notes.filter(Boolean).join("; ") || undefined;

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
 * The stage's first message to claude: `/<skill> <args>`, or its prompt as written. Null for a
 * stage with nothing to send (the Loop). Takes the stage with its route's overrides applied.
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

/**
 * What Tickets sends when there is no session to continue: the spec's path instead of the
 * conversation. Null for any other stage, which stops and asks.
 */
export function missingSessionInput(
  stage: Pick<Stage, "skill">,
  vars: Vars,
): string | null {
  return stage.skill === "to-tickets"
    ? `/to-tickets ${vars.feature}/spec.md`
    : null;
}

/**
 * What "Work on this" sends an interactive `claude` (its `freshLine` input): the
 * `/implement` skill and the ticket's path, relative to the repo root. A path that is not a single
 * plain line is refused, so nothing but the path can reach the prompt.
 */
export function workOnThisInput(ticketPath: string): string {
  if (!ticketPath || /[\r\n\0]/.test(ticketPath))
    throw new Error("not a ticket path");
  return `/implement ${ticketPath}`;
}

/** A ticket's path from the repo root: `<feature folder>/issues/<file name>`. */
export const ticketPathOf = (
  repoRoot: string,
  featureDir: string,
  ticketName: string,
) => `${featureRel(repoRoot, featureDir)}/issues/${ticketName}`;
