// Sending the run-end notice and, when the developer comes back to the app after it, opening the
// feature's Loop. Pure over what it is given: the sender and the window's focus come in as
// arguments, so a test needs neither an OS nor a window.

import type { Notice } from "./runEnd";

/** How long after a notice a return to the app counts as clicking it. */
export const CLICK_WINDOW_MS = 60_000;

export type NoticeEnv = {
  /** Sends the OS notice; resolves "requested" when the OS took it. */
  send: (notice: Notice) => Promise<"requested" | "denied" | "failed">;
  /** The app's window has focus now. */
  hasFocus: () => boolean;
  /** Calls `cb` when the window gains focus; returns the way to stop listening. */
  onFocus: (cb: () => void) => () => void;
  after: (ms: number, cb: () => void) => () => void;
};

/**
 * Sends the notice. `tauri-plugin-notification` reports no click on a desktop, so a click is read
 * from the app coming forward: the OS brings the window up when its notice is clicked. Only a
 * notice sent while the window was in the background arms this, and only for a minute, so working
 * in the app never opens the Loop by itself.
 */
export async function announce(
  env: NoticeEnv,
  notice: Notice,
  openLoop: () => void,
): Promise<void> {
  const backgrounded = !env.hasFocus();
  const result = await env.send(notice);
  if (result !== "requested" || !backgrounded) return;
  let stopFocus = () => {};
  let stopTimer = () => {};
  stopFocus = env.onFocus(() => {
    stopFocus();
    stopTimer();
    openLoop();
  });
  stopTimer = env.after(CLICK_WINDOW_MS, stopFocus);
}

/** The environment in the app: the OS notification, the window's focus and the timer. */
export function browserNoticeEnv(send: NoticeEnv["send"]): NoticeEnv {
  return {
    send,
    hasFocus: () => document.hasFocus(),
    onFocus: (cb) => {
      window.addEventListener("focus", cb);
      return () => window.removeEventListener("focus", cb);
    },
    after: (ms, cb) => {
      const t = setTimeout(cb, ms);
      return () => clearTimeout(t);
    },
  };
}
