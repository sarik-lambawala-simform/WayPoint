import { invoke } from "@tauri-apps/api/core";
import { native } from "@/modules/ai/lib/native";
import { whenSessionReady, writeToSession } from "@/modules/terminal";

/**
 * Types `line` into the terminal `leaf` once its shell is ready. A stage's command travels inside
 * `line` as claude's first message, so nothing is typed into claude afterwards. `note` is a shell
 * line typed before `line`.
 */
export async function launchClaude(
  repoRoot: string,
  leaf: number,
  line: string,
  note?: string,
): Promise<void> {
  await native.workspaceAuthorize(repoRoot).catch(() => {});
  await invoke("agent_enable_hooks", { agent: "claude" }).catch((e) =>
    console.warn("[waypoint] could not enable claude notifications:", e),
  );
  await whenSessionReady(leaf);
  if (
    (note && !writeToSession(leaf, `${note}\r`)) ||
    !writeToSession(leaf, `${line}\r`)
  )
    console.error(`[waypoint] terminal ${leaf} closed before launch`);
}
