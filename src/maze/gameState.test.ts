import { describe, expect, it } from "vitest";
import { applyDirection, buildGameBundle, equalPos } from "./gameState";
import type { Dir } from "./types";

describe("gameState", () => {
  it("森林标准局至少一个方向可走一步", () => {
    const g = buildGameBundle("forest", "easy");
    const dirs: Dir[] = ["down", "right", "up", "left"];
    let moved = false;
    for (const d of dirs) {
      const r = applyDirection(g, d);
      if (r.moved) {
        moved = true;
        expect(equalPos(r.game.player, g.player)).toBe(false);
        break;
      }
    }
    expect(moved).toBe(true);
  });

  it("糖果关为收集机制并放置收集物", () => {
    const g = buildGameBundle("candy", "easy");
    expect(g.mechanic).toBe("collect");
    expect(g.treatsRemaining.size).toBeGreaterThanOrEqual(3);
  });
});
