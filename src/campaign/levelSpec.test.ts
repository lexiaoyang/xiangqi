import { describe, expect, it } from "vitest";
import { applyDirection, buildGameBundleSeeded, equalPos, posKey } from "../maze/gameState";
import { isWall } from "../maze/generate";
import type { Dir, GameBundle, Pos } from "../maze/types";
import { CAMPAIGN_PACK_VERSION } from "./constants";
import { getLevelSpec, layoutSeedForLevel } from "./levelSpec";

const dirs: Dir[] = ["up", "down", "left", "right"];
const delta: Record<Dir, { dr: number; dc: number }> = {
  up: { dr: -1, dc: 0 },
  down: { dr: 1, dc: 0 },
  left: { dr: 0, dc: -1 },
  right: { dr: 0, dc: 1 }
};

function pathTo(g: GameBundle, target: Pos, allowGoal: boolean): Dir[] {
  const q: Array<{ p: Pos; path: Dir[] }> = [{ p: g.player, path: [] }];
  const seen = new Set([posKey(g.player)]);

  while (q.length) {
    const cur = q.shift()!;
    if (equalPos(cur.p, target)) return cur.path;
    for (const d of dirs) {
      const { dr, dc } = delta[d];
      const next = { row: cur.p.row + dr, col: cur.p.col + dc };
      if (isWall(g.maze, next.row, next.col)) continue;
      if (!allowGoal && equalPos(next, g.goal)) continue;
      const k = posKey(next);
      if (seen.has(k)) continue;
      seen.add(k);
      q.push({ p: next, path: [...cur.path, d] });
    }
  }

  return [];
}

function runPath(g: GameBundle, path: Dir[]): GameBundle {
  return path.reduce((cur, d) => {
    const r = applyDirection(cur, d);
    expect(r.moved).toBe(true);
    return r.game;
  }, g);
}

describe("campaign levelSpec", () => {
  it("同 levelId 同 pack 下 layoutSeed 稳定", () => {
    expect(layoutSeedForLevel(42)).toBe(layoutSeedForLevel(42));
    expect(getLevelSpec(42).packVersion).toBe(CAMPAIGN_PACK_VERSION);
  });

  it("高关卡使用更高难度档", () => {
    expect(getLevelSpec(1).difficulty).toBe("easy");
    expect(getLevelSpec(12).difficulty).toBe("medium");
    expect(getLevelSpec(100).difficulty).toBe("hard");
    expect(getLevelSpec(900).difficulty).toBe("expert");
  });

  it("第 2 关收集物可达且收齐后能进终点", () => {
    const spec = getLevelSpec(2);
    let g = buildGameBundleSeeded(spec.sceneId, spec.difficulty, spec.layoutSeed);

    expect(g.mechanic).toBe("collect");
    expect(g.treatsRemaining.size).toBeGreaterThan(0);

    while (g.treatsRemaining.size > 0) {
      const targetKey = [...g.treatsRemaining][0]!;
      const [row, col] = targetKey.split("-").map(Number);
      const path = pathTo(g, { row: row!, col: col! }, false);
      expect(path.length).toBeGreaterThan(0);
      g = runPath(g, path);
    }

    const goalPath = pathTo(g, g.goal, true);
    expect(goalPath.length).toBeGreaterThan(0);
    const end = goalPath.reduce(
      (state, d) => applyDirection(state.game, d),
      { game: g, moved: false, won: false }
    );
    expect(end.won).toBe(true);
  });
});
