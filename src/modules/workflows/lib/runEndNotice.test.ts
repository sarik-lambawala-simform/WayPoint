import { describe, expect, it } from "vitest";
import { announce, CLICK_WINDOW_MS, type NoticeEnv } from "./runEndNotice";

const notice = { title: "Memark · p10", body: "Done. 1 ticket, 5 min, $1.00" };

function fake(opts: {
  focused: boolean;
  result?: "requested" | "denied" | "failed";
}) {
  const sent: unknown[] = [];
  let focusCb: (() => void) | null = null;
  let timerCb: (() => void) | null = null;
  let timerMs = 0;
  const env: NoticeEnv = {
    send: async (n) => {
      sent.push(n);
      return opts.result ?? "requested";
    },
    hasFocus: () => opts.focused,
    onFocus: (cb) => {
      focusCb = cb;
      return () => {
        focusCb = null;
      };
    },
    after: (ms, cb) => {
      timerMs = ms;
      timerCb = cb;
      return () => {
        timerCb = null;
      };
    },
  };
  return {
    env,
    sent,
    focus: () => focusCb?.(),
    expire: () => timerCb?.(),
    armed: () => focusCb !== null,
    timerMs: () => timerMs,
  };
}

describe("announcing a run's end", () => {
  it("sends the notice, and opens the Loop when the app comes forward after it", async () => {
    const f = fake({ focused: false });
    let opened = 0;
    await announce(f.env, notice, () => opened++);
    expect(f.sent).toEqual([notice]);
    expect(f.timerMs()).toBe(CLICK_WINDOW_MS);
    f.focus();
    expect(opened).toBe(1);
    // Once: the next focus opens nothing.
    f.focus();
    expect(opened).toBe(1);
  });

  it("opens nothing when the app comes forward after the minute is up", async () => {
    const f = fake({ focused: false });
    let opened = 0;
    await announce(f.env, notice, () => opened++);
    f.expire();
    f.focus();
    expect(opened).toBe(0);
  });

  it("does not arm a click for a notice sent while the window had focus", async () => {
    const f = fake({ focused: true });
    await announce(f.env, notice, () => {});
    expect(f.sent).toEqual([notice]);
    expect(f.armed()).toBe(false);
  });

  it("does not arm a click for a notice the OS refused", async () => {
    const f = fake({ focused: false, result: "denied" });
    await announce(f.env, notice, () => {});
    expect(f.armed()).toBe(false);
  });
});
