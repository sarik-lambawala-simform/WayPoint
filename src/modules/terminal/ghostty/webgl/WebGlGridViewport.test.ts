import { afterEach, describe, expect, it, vi } from "vitest";
import type { GhosttyTerminalModelApi } from "@/modules/terminal/ghostty/GhosttyTerminalModel";
import {
  gridViewport,
  WebGlCellRenderer,
} from "@/modules/terminal/ghostty/webgl/WebGlCellRenderer";

afterEach(() => vi.unstubAllGlobals());

const CELL_W = 17;
const CELL_H = 34;

function fakeRenderer() {
  const methods = new Map<string, ReturnType<typeof vi.fn>>();
  const gl = new Proxy(
    {},
    {
      get: (_, key: string) => {
        if (/^[A-Z_0-9]+$/.test(key)) return 1;
        let method = methods.get(key);
        if (!method) {
          method = vi.fn(() => (key === "getExtension" ? null : {}));
          methods.set(key, method);
        }
        return method;
      },
    },
  );
  const canvas = Object.assign(new EventTarget(), {
    width: 1,
    height: 1,
    style: {},
    setAttribute() {},
    remove() {},
    getContext: (kind: string) => (kind === "webgl2" ? gl : {}),
  });
  vi.stubGlobal("document", { createElement: () => canvas });
  const renderer = new WebGlCellRenderer();
  renderer.configure(
    {
      metrics: {
        scale: 2,
        deviceCellWidth: CELL_W,
        deviceCellHeight: CELL_H,
        deviceBaseline: 26,
        cellWidth: CELL_W / 2,
        cellHeight: CELL_H / 2,
        baseline: 13,
        font: {
          family: "monospace",
          size: 14,
          weight: "400",
          lineHeight: 1.2,
          letterSpacing: 0,
        },
      },
      theme: {
        background: [0, 0, 0],
        foreground: [255, 255, 255],
        cursor: [255, 255, 255],
        selection: { color: [50, 50, 50], alpha: 0.5 },
        palette: [],
      },
      scale: 2,
    },
    () => {},
    () => {},
  );
  const grid = { cols: 0, rows: 0 };
  const model = {
    get cols() {
      return grid.cols;
    },
    get rows() {
      return grid.rows;
    },
    cursor: () => ({
      x: 0,
      y: 0,
      visible: true,
      blinking: false,
      style: "block",
    }),
    viewportOriginLine: () => 0,
    renderCells: () => ({
      length: grid.cols * grid.rows,
      width: () => 1,
      flags: () => 0,
      codepoint: () => 0,
      backgroundPacked: () => 0,
      foregroundPacked: () => 0xffffff,
      underlineColorPacked: () => 0,
      underlineStyle: () => 0,
      overline: () => false,
    }),
  } as unknown as GhosttyTerminalModelApi;
  const frame = {
    model,
    damage: { kind: "full" as const },
    cursorVisible: true,
    textBlinkVisible: true,
    selection: null,
    searchMatchAt: () => 0 as const,
  };
  const resizeAndRender = (cols: number, rows: number) => {
    grid.cols = cols;
    grid.rows = rows;
    renderer.resize(cols, rows);
    renderer.render(frame);
  };
  const last = (name: string) => {
    const calls = methods.get(name)?.mock.calls ?? [];
    return calls[calls.length - 1];
  };
  return { canvas, resizeAndRender, last };
}

describe("WebGL grid viewport", () => {
  it("anchors the grid at the top-left of a larger backing, in GL's bottom-left origin", () => {
    expect(gridViewport(3456, 1920, 3434, 1802)).toEqual({
      x: 0,
      y: 118,
      width: 3434,
      height: 1802,
    });
  });

  it("never asks for a viewport larger than the canvas", () => {
    expect(gridViewport(100, 50, 120, 80)).toEqual({
      x: 0,
      y: 0,
      width: 100,
      height: 50,
    });
  });

  // The bug: a grid that shrinks within the reuse slack kept the larger backing, and the renderer
  // stretched the grid over the whole canvas, pushing the bottom rows (claude's prompt) out of the pane.
  it("does not stretch a shrunk grid over a reused, larger backing", () => {
    const { canvas, resizeAndRender, last } = fakeRenderer();
    resizeAndRender(202, 56); // 1904 device px tall
    const backingH = canvas.height;
    expect(backingH).toBe(56 * CELL_H);

    resizeAndRender(202, 53); // 1802 needed: within the reuse slack, so the backing is kept
    expect(canvas.height).toBe(backingH);

    const gridW = 202 * CELL_W;
    const gridH = 53 * CELL_H;
    expect(last("viewport")).toEqual([0, backingH - gridH, gridW, gridH]);
    const resolution = last("uniform2f");
    expect(resolution?.slice(1)).toEqual([gridW, gridH]);
  });
});
