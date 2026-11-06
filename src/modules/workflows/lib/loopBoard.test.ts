import { describe, expect, it } from "vitest";
import {
  blockerChoices,
  boardColumns,
  boardKey,
  docsOf,
  editLock,
  headCount,
  isRequeue,
  isWebLink,
  needsYou,
  panelTabFor,
  sameBlockers,
  splitStatus,
  ticketFacts,
  titleParts,
  toneOf,
  utcStamp,
} from "./loopBoard";
import type { RunView, TicketRow } from "./loopRun";

const ticket = (over: Partial<TicketRow> = {}): TicketRow => ({
  number: "01",
  name: "01-a.md",
  title: "A",
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

const run = (over: Partial<RunView> = {}): RunView => ({
  id: "r",
  dir: "/r",
  status: "live",
  phase: "running",
  phase_since: "",
  ticket: "03",
  quota_resets_at: "",
  offline_since: "",
  exit_code: null,
  started_at_ms: null,
  ended_at_ms: null,
  heartbeat_at_ms: null,
  tickets_ended: 0,
  cost: { usd: 0, partial: null },
  launch_line: null,
  stop_file: "/r/stop",
  stop_requested: false,
  ...over,
});

describe("the board's statuses", () => {
  it("colours the known keys and greys any other", () => {
    expect(toneOf("completed")).toBe("green");
    expect(toneOf("done")).toBe("green");
    expect(toneOf("in-progress")).toBe("violet");
    expect(toneOf("ready-for-human")).toBe("yellow");
    expect(toneOf("blocked")).toBe("red");
    expect(toneOf("ready-for-agent")).toBe("grey");
    expect(toneOf("someday")).toBe("grey");
  });

  it("shows the ticket the run is on in progress, whatever its file says", () => {
    expect(boardKey(ticket({ running: true }))).toBe("in-progress");
    expect(boardKey(ticket())).toBe("ready-for-agent");
  });

  it("keeps the fixed columns and adds each other key once", () => {
    const cols = boardColumns([
      ticket({ status: "done" }),
      ticket({ status: "done" }),
      ticket(),
    ]);
    expect(cols).toEqual([
      "ready-for-agent",
      "in-progress",
      "ready-for-human",
      "blocked",
      "completed",
      "done",
    ]);
  });
});

describe("the header count", () => {
  it("counts done tickets and the human tickets still waiting", () => {
    expect(headCount([])).toBe("No build tickets");
    expect(
      headCount([
        ticket({ status: "completed" }),
        ticket({ human: true, status: "ready-for-human" }),
        ticket({ human: true, status: "done" }),
      ]),
    ).toBe("2 of 3 build tickets done, 1 needs you");
    expect(
      headCount([
        ticket({ human: true }),
        ticket({ human: true, status: "blocked" }),
      ]),
    ).toBe("0 of 2 build tickets done, 2 need you");
  });

  it("needs you only on a human ticket that is not done", () => {
    expect(needsYou(ticket({ human: true }))).toBe(true);
    expect(needsYou(ticket({ human: true, status: "done" }))).toBe(false);
    expect(needsYou(ticket())).toBe(false);
  });
});

describe("the side panel", () => {
  it("opens the running ticket on its terminal and any other on its details", () => {
    expect(panelTabFor(ticket({ running: true }))).toBe("terminal");
    expect(panelTabFor(ticket())).toBe("details");
  });

  it("splits a status into its key and a note", () => {
    expect(splitStatus("in-progress, parked by the stop")).toEqual({
      key: "in-progress",
      note: "parked by the stop",
    });
    expect(splitStatus("done — dropped 2026-11-04")).toEqual({
      key: "done",
      note: "dropped 2026-11-04",
    });
    expect(splitStatus("completed")).toEqual({ key: "completed", note: "" });
  });

  it("reads the note, Completed at and Type from the file", () => {
    const facts = ticketFacts(
      "# 01\r\n\r\n**Type:** task\r\n\r\n**Status:** completed, by hand\r\n\r\n**Completed at:** 2026-11-03T07:18:42Z\r\n",
    );
    expect(facts).toEqual({
      hasStatusLine: true,
      note: "by hand",
      completedAt: "2026-11-03T07:18:42Z",
      type: "task",
    });
    expect(ticketFacts("# 01\nStatus: open\n")).toEqual({
      hasStatusLine: false,
      note: "",
      completedAt: null,
      type: null,
    });
  });

  it("locks a ticket while the live run picks or runs it, and never after the run", () => {
    expect(editLock(ticket({ number: "03" }), run())).toContain(
      "running this ticket",
    );
    expect(editLock(ticket({ running: true }), run())).toContain(
      "running this ticket",
    );
    expect(editLock(ticket({ number: "04" }), run())).toBeNull();
    expect(editLock(ticket(), run({ phase: "picking" }))).toContain("picking");
    expect(editLock(ticket({ number: "03" }), run({ status: "died" }))).toBe(
      null,
    );
    expect(editLock(ticket(), null)).toBeNull();
  });

  it("offers every other ticket not already a blocker", () => {
    const all = [ticket(), ticket({ number: "02" }), ticket({ number: "03" })];
    expect(blockerChoices(all, "02", ["01"]).map((t) => t.number)).toEqual([
      "03",
    ]);
  });

  it("compares Blocked by lists as sets", () => {
    expect(sameBlockers(["02", "01"], ["01", "02", "01"])).toBe(true);
    expect(sameBlockers(["01"], [])).toBe(false);
  });

  it("stamps UTC to the second, as the loop does", () => {
    expect(utcStamp(new Date(Date.UTC(2026, 10, 5, 9, 4, 7, 123)))).toBe(
      "2026-11-05T09:04:07Z",
    );
  });

  it("asks before re-queuing a completed ticket only", () => {
    expect(isRequeue("completed", "ready-for-agent")).toBe(true);
    expect(isRequeue("blocked", "ready-for-agent")).toBe(false);
    expect(isRequeue("completed", "blocked")).toBe(false);
  });
});

describe("the Docs tab and the markdown", () => {
  it("lists the notes outside issues/, top level first", () => {
    expect(
      docsOf([
        "issues/01-a.md",
        "notes/z.md",
        "spec.md",
        "map.md",
        "progress.json",
      ]),
    ).toEqual(["map.md", "spec.md", "notes/z.md"]);
  });

  it("draws text between backticks as code and leaves an unclosed one as text", () => {
    expect(titleParts("Add `foo` here")).toEqual([
      { text: "Add ", code: false },
      { text: "foo", code: true },
      { text: " here", code: false },
    ]);
    expect(titleParts("a `b")).toEqual([{ text: "a `b", code: false }]);
  });

  it("lets only a web link leave the app", () => {
    expect(isWebLink("https://example.com")).toBe(true);
    expect(isWebLink("../../spec.md")).toBe(false);
    expect(isWebLink("javascript:alert(1)")).toBe(false);
    expect(isWebLink(undefined)).toBe(false);
  });
});
