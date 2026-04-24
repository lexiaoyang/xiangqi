import { describe, expect, it } from "vitest";
import { applyDirection, buildGameBundle, equalPos } from "./gameState";

describe("gameState", () => {
  it("森林标准局可走一步", () => {
    const g = buildGameBundle("forest", "easy");
    const r = applyDirection(g, "down");
    expect(r.moved).toBe(true);
    expect(equalPos(r.game.player, { row: g.player.row + 1, col: g.player.col })).toBe(true);
  });

  it("糖果关为收集机制并放置收集物", () => {
    const g = buildGameBundle("candy", "easy");
    expect(g.mechanic).toBe("collect");
    expect(g.treatsRemaining.size).toBeGreaterThanOrEqual(3);
  });
});
