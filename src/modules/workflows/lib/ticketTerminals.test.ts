import { describe, expect, it } from "vitest";
import type { RunView } from "./loopRun";
import {
  allLeaves,
  NO_TICKET_TERMINALS,
  reduceTicketTerminals as reduce,
  shownLeaf,
} from "./ticketTerminals";

describe("ticket terminals", () => {
  it("makes a ticket's terminal when it is first chosen and keeps every earlier one", () => {
    let s = reduce(NO_TICKET_TERMINALS, {
      type: "select",
      number: "01",
      replayLeaf: 10,
    });
    s = reduce(s, { type: "select", number: "02", replayLeaf: 11 });
    s = reduce(s, { type: "select", number: "01", replayLeaf: 99 });
    expect(s.selected).toBe("01");
    expect(Object.keys(s.opened)).toEqual(["01", "02"]);
    expect(s.opened["01"].replay).toBe(10);
    expect(shownLeaf(s)).toBe(10);
    expect(allLeaves(s)).toEqual([10, 11]);
  });

  it("opens a shell beside the replay and goes back to the run", () => {
    let s = reduce(NO_TICKET_TERMINALS, {
      type: "select",
      number: "01",
      replayLeaf: 10,
    });
    s = reduce(s, { type: "open-shell", number: "01", leaf: 20 });
    expect(shownLeaf(s)).toBe(20);
    expect(allLeaves(s)).toEqual([10, 20]);
    s = reduce(s, { type: "show-run", number: "01" });
    expect(shownLeaf(s)).toBe(10);
    expect(s.opened["01"].shell).toBe(20);
  });

  it("opens one shell per ticket, and a shell that exits leaves the replay", () => {
    let s = reduce(NO_TICKET_TERMINALS, {
      type: "select",
      number: "01",
      replayLeaf: 10,
    });
    s = reduce(s, { type: "open-shell", number: "01", leaf: 20 });
    s = reduce(s, { type: "show-run", number: "01" });
    s = reduce(s, { type: "open-shell", number: "01", leaf: 21 });
    expect(s.opened["01"]).toEqual({
      replay: 10,
      shell: 20,
      showShell: true,
      pickedRun: null,
    });
    s = reduce(s, { type: "shell-exited", leaf: 20 });
    expect(s.opened["01"].shell).toBeNull();
    expect(shownLeaf(s)).toBe(10);
  });

  it("shows nothing before a ticket is chosen", () => {
    expect(shownLeaf(NO_TICKET_TERMINALS)).toBeNull();
  });

  it("keeps a picked older run per ticket and brings the replay back to show it", () => {
    const old = { id: "r1" } as RunView;
    let s = reduce(NO_TICKET_TERMINALS, {
      type: "select",
      number: "01",
      replayLeaf: 10,
    });
    s = reduce(s, { type: "open-shell", number: "01", leaf: 20 });
    s = reduce(s, { type: "pick-run", number: "01", run: old });
    expect(s.opened["01"].pickedRun).toBe(old);
    expect(shownLeaf(s)).toBe(10);
    s = reduce(s, { type: "pick-run", number: "01", run: null });
    expect(s.opened["01"].pickedRun).toBeNull();
    expect(reduce(s, { type: "pick-run", number: "09", run: old })).toBe(s);
  });
});
