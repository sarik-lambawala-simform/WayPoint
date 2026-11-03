import { describe, expect, it } from "vitest";
import { blocksStart, gateFromCheck } from "./wslGate";

describe("wsl gate", () => {
  it("lets a stage start when every tool is there", () => {
    expect(
      gateFromCheck("/usr/bin/jq\n/usr/bin/git\n/usr/bin/curl\n/x/claude\n"),
    ).toBeNull();
  });
  it("stops a stage and lists what is missing with its install line", () => {
    const gate = gateFromCheck("/usr/bin/git\n/usr/bin/curl\n/x/claude\n");
    expect(gate).toEqual({
      kind: "missing",
      missing: [{ tool: "jq", install: "sudo apt-get install -y jq" }],
    });
    expect(gate && blocksStart(gate)).toBe(true);
  });
  it("blocks on the Windows env and on a failed check, not while checking", () => {
    expect(blocksStart({ kind: "needs-wsl" })).toBe(true);
    expect(blocksStart({ kind: "error", message: "x" })).toBe(true);
    expect(blocksStart({ kind: "checking" })).toBe(false);
    expect(blocksStart({ kind: "idle" })).toBe(false);
  });
});
