import { describe, expect, it } from "vitest";
import { applyDirection, applyTacticalTool, buildGameBundle, equalPos } from "./gameState";
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

  it("策略层按种子生成钥匙、锁、危险和遗物", () => {
    const g = buildGameBundle("forest", "medium", () => 0.42, {
      modifierIds: ["keys", "traps", "sentries", "switches", "unstable", "memory", "phase", "relics"],
      complexity: 4,
      levelId: 90
    });
    expect(g.keyCells.size).toBeGreaterThan(0);
    expect(g.lockCells.size).toBeGreaterThan(0);
    expect(g.trapCells.size + g.sentryCells.size).toBeGreaterThan(0);
    expect(g.relicsRemaining.size).toBeGreaterThan(0);
  });

  it("战术工具能改变策略状态", () => {
    const g = buildGameBundle("forest", "medium", () => 0.42, {
      modifierIds: ["keys", "traps", "sentries", "unstable"],
      complexity: 3
    });
    const forged = applyTacticalTool(g, "key_forge");
    expect(forged.applied).toBe(true);
    expect(forged.game.status.keysHeld).toBe(1);
    const frozen = applyTacticalTool(forged.game, "freeze");
    expect(frozen.game.status.freezeMoves).toBeGreaterThan(0);
  });
});
