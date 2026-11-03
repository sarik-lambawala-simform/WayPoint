import { describe, expect, it } from "vitest";
import { unblockedBy, unblockedText, workBlockedBy } from "./humanTicket";
import type { TicketRow } from "./loopRun";

const t = (number: string, over: Partial<TicketRow> = {}): TicketRow => ({
  number,
  name: `${number}-x.md`,
  title: "",
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

describe("workBlockedBy", () => {
  it("is open with no live run", () => {
    expect(workBlockedBy([])).toBeNull();
  });
  it("says which feature's run is live and why that matters", () => {
    const why = workBlockedBy([{ feature: "feat-a", run_id: "r" }]);
    expect(why).toContain("feat-a has a live run");
    expect(why).toContain("same working tree");
  });
});

describe("unblockedBy", () => {
  const human = t("02", { human: true, status: "ready-for-human" });
  it("lists the agent tickets whose only open blocker was the human ticket", () => {
    const rows = [
      t("01", { status: "completed" }),
      human,
      t("03", { blockers: ["02"], blockers_met: false }),
      t("04", { blockers: ["01", "02"], blockers_met: false }),
    ];
    expect(unblockedBy(rows, "02")).toEqual(["03", "04"]);
  });
  it("leaves out a ticket that another open blocker still holds", () => {
    const rows = [
      t("01"),
      human,
      t("03", { blockers: ["01", "02"], blockers_met: false }),
    ];
    expect(unblockedBy(rows, "02")).toEqual([]);
  });
  it("leaves out done, running and human tickets and ones that do not name it", () => {
    const rows = [
      human,
      t("03", { blockers: ["02"], status: "completed" }),
      t("04", { blockers: ["02"], running: true }),
      t("05", { blockers: ["02"], human: true }),
      t("06", { blockers: ["01"], blockers_met: false }),
    ];
    expect(unblockedBy(rows, "02")).toEqual([]);
  });
  it("treats a blocker that is not a ticket of this feature as still open", () => {
    const rows = [human, t("03", { blockers: ["02", "09"] })];
    expect(unblockedBy(rows, "02")).toEqual([]);
  });
});

it("words the notice", () => {
  expect(unblockedText(["03", "04"])).toBe(
    "Closing the human ticket unblocked 03, 04",
  );
});
