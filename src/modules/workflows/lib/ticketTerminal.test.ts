import { describe, expect, it } from "vitest";
import type { RunView, TicketRow } from "./loopRun";
import {
  claudeLine,
  headText,
  LEFT_NOTE,
  modelOfLaunch,
  ReplayWriter,
  renderChunk,
  tailText,
  type TicketRead,
  ticketPhase,
} from "./ticketTerminal";

const ticket = (over: Partial<TicketRow> = {}): TicketRow => ({
  number: "03",
  name: "03-x.md",
  title: "X",
  status: "ready-for-agent",
  human: false,
  running: false,
  blockers: [],
  blockers_met: true,
  spent: {
    seconds: null,
    seconds_partial: null,
    cost: null,
    cost_partial: null,
    running_since_ms: null,
  },
  ...over,
});
const run = (status: RunView["status"]): RunView =>
  ({ status, launch_line: null }) as RunView;
const read = (over: Partial<TicketRead> = {}): TicketRead => ({
  has_stream: true,
  prompt: "/implement\n\nDo `it`",
  chunk: "",
  offset: 0,
  reset: false,
  outcome: null,
  ...over,
});
// eslint-disable-next-line no-control-regex
const plain = (s: string) => s.replace(/\u001b\[[0-9;]*[A-Za-z]/g, "");

describe("ticketPhase", () => {
  it("is waiting on a live run and blocked by the unmet blockers", () => {
    expect(ticketPhase(ticket(), run("live"), false)).toEqual({
      kind: "waiting",
    });
    expect(
      ticketPhase(
        ticket({ blockers: ["01", "02"], blockers_met: false }),
        run("live"),
        false,
      ),
    ).toEqual({ kind: "blocked", by: ["01", "02"] });
  });
  it("leaves a blocked ticket marked once the run has finished or died", () => {
    const t = ticket({ blockers: ["01"], blockers_met: false });
    expect(ticketPhase(t, run("finished"), false).kind).toBe("left");
    expect(ticketPhase(t, run("died"), false).kind).toBe("left");
  });
  it("has taken a ticket whose stream exists, and never a human one", () => {
    expect(ticketPhase(ticket(), run("finished"), true).kind).toBe("ran");
    expect(ticketPhase(ticket({ human: true }), run("live"), true).kind).toBe(
      "human",
    );
  });
  it("says so for a ticket already done and for no run at all", () => {
    expect(
      ticketPhase(ticket({ status: "completed" }), run("live"), false).kind,
    ).toBe("done-before");
    expect(ticketPhase(ticket(), null, false).kind).toBe("no-run");
  });
});

describe("head and tail", () => {
  it("shows the finished-run note for a blocked ticket", () => {
    const t = ticket({ blockers: ["01"], blockers_met: false });
    const h = headText(ticketPhase(t, run("finished"), false), t, null, null);
    expect(plain(h)).toContain(LEFT_NOTE);
  });
  it("shows blocked by ids", () => {
    const t = ticket({ blockers: ["01", "02"], blockers_met: false });
    const h = headText(ticketPhase(t, run("live"), false), t, null, null);
    expect(plain(h)).toContain("Blocked by 01, 02.");
  });
  it("shows the exact claude line with the prompt and the launch line's model", () => {
    const t = ticket();
    const h = plain(
      headText(
        { kind: "ran" },
        t,
        read(),
        "setsid ralph/run-ralph-tickets.sh --model opus feat",
      ),
    );
    expect(h).toContain(
      "$ claude --permission-mode bypassPermissions --output-format stream-json --verbose --model opus -p '/implement\r\n\r\nDo `it`'",
    );
    expect(modelOfLaunch(null)).toBeNull();
    expect(claudeLine("it's", null)).toContain(`-p 'it'\\''s'`);
  });
  it("shows the recorded result, or that none was recorded after the run ended", () => {
    const t = ticket();
    const done = read({
      outcome: { outcome: "completed", seconds: 65, cost: 2.5, reason: "" },
    });
    expect(plain(tailText(done, run("live"), t))).toContain(
      "● completed · 1m 05s · $2.50",
    );
    expect(tailText(read(), run("live"), t)).toBe("");
    expect(plain(tailText(read(), run("died"), t))).toContain(
      "No result recorded",
    );
    expect(tailText(null, run("live"), t)).toBe("");
  });
});

describe("renderChunk", () => {
  const ev = (o: unknown) => `${JSON.stringify(o)}\n`;
  it("renders init, text, tool calls and tool results, and skips the rest", () => {
    const chunk =
      ev({ type: "system", subtype: "init", session_id: "s1", model: "m" }) +
      ev({ type: "system", subtype: "hook_started" }) +
      ev({
        type: "assistant",
        message: {
          content: [
            { type: "text", text: "Hello\nthere" },
            { type: "tool_use", name: "Bash", input: { command: "ls  -la" } },
          ],
        },
      }) +
      ev({
        type: "user",
        message: {
          content: [
            { type: "tool_result", content: [{ text: "a\nb" }, { text: "c" }] },
          ],
        },
      }) +
      ev({ type: "result", result: "done" }) +
      "not json\n";
    expect(plain(renderChunk(chunk))).toBe(
      "● session s1 · m\r\n  Hello\r\n  there\r\n⏺ Bash (ls -la)\r\n  ⎿ a b c\r\n",
    );
  });
});

describe("ReplayWriter", () => {
  const make = () => {
    const out: string[] = [];
    return { out, w: new ReplayWriter((t) => out.push(t)) };
  };
  it("writes only what the body grew by", () => {
    const { out, w } = make();
    w.set({ head: "H", body: "a", tail: "" });
    w.set({ head: "H", body: "ab", tail: "" });
    w.set({ head: "H", body: "ab", tail: "" });
    expect(out).toHaveLength(2);
    expect(out[0]).toContain("Ha");
    expect(out[1]).toBe("b");
  });
  it("redraws when the head changes or a result was already shown", () => {
    const { out, w } = make();
    w.set({ head: "wait", body: "", tail: "" });
    w.set({ head: "line", body: "x", tail: "T" });
    w.set({ head: "line", body: "xy", tail: "T" });
    expect(out).toHaveLength(3);
    expect(out[1]).toContain("linexT");
    expect(out[2]).toContain("linexyT");
  });
  it("draws everything again after forget", () => {
    const { out, w } = make();
    w.set({ head: "H", body: "a", tail: "" });
    w.forget();
    w.set({ head: "H", body: "a", tail: "" });
    expect(out).toHaveLength(2);
  });
});
