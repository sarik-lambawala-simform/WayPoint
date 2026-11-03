import { invoke } from "@tauri-apps/api/core";
import { native } from "@/modules/ai/lib/native";
import {
  ptyIdForLeaf,
  subscribeAgentSignals,
  whenSessionReady,
  writeToSession,
} from "@/modules/terminal";

/** claude has been started; its TUI needs this long before typed text lands in its prompt. */
const CLAUDE_READY_MS = 3000;
const SUBMIT_GAP_MS = 150;
const START_TIMEOUT_MS = 15_000;

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/** Resolves true on the first `started` signal of `pty`, false after the timeout. */
function whenClaudeStarted(pty: number): {
  done: Promise<boolean>;
  stop: () => void;
} {
  let stop = () => {};
  const done = new Promise<boolean>((resolve) => {
    const timer = setTimeout(() => resolve(false), START_TIMEOUT_MS);
    const off = subscribeAgentSignals((s) => {
      if (s.id === pty && (s.kind === "started" || s.kind === "working")) {
        resolve(true);
      }
    });
    stop = () => {
      clearTimeout(timer);
      off();
    };
  }).finally(() => stop());
  return { done, stop };
}

/**
 * Types `line` into the terminal `leaf` once its shell is ready, then `input` once claude is up
 * (a `null` input types nothing more). `note` is a shell line typed before `line`.
 */
export async function launchClaude(
  repoRoot: string,
  leaf: number,
  line: string,
  input: string | null,
  note?: string,
): Promise<void> {
  await native.workspaceAuthorize(repoRoot).catch(() => {});
  await invoke("agent_enable_hooks", { agent: "claude" }).catch((e) =>
    console.warn("[waypoint] could not enable claude notifications:", e),
  );
  await whenSessionReady(leaf);
  const pty = ptyIdForLeaf(leaf);
  const started =
    input !== null && pty !== null ? whenClaudeStarted(pty) : null;
  if (
    (note && !writeToSession(leaf, `${note}\r`)) ||
    !writeToSession(leaf, `${line}\r`)
  ) {
    started?.stop();
    console.error(`[waypoint] terminal ${leaf} closed before launch`);
    return;
  }
  if (!started || input === null) return;
  if (!(await started.done)) {
    console.error(`[waypoint] claude did not start in terminal ${leaf}`);
    return;
  }
  await sleep(CLAUDE_READY_MS);
  if (!writeToSession(leaf, input)) return;
  await sleep(SUBMIT_GAP_MS);
  writeToSession(leaf, "\r");
}
