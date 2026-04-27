import { describe, expect, it } from "vitest";
import { applyDirection, buildGameBundleSeeded, posKey } from "../maze/gameState";
import type { Dir, GameBundle } from "../maze/types";
import { MAX_LEVEL_ID } from "./constants";
import { getLevelSpec } from "./levelSpec";

const dirs: Dir[] = ["up", "down", "left", "right"];

function solve(g: GameBundle): { won: boolean; explored: number } {
  const startKey = stateKey(g);
  const q: GameBundle[] = [g];
  const seen = new Set([startKey]);
  let explored = 0;

  while (q.length) {
    const cur = q.shift()!;
    explored += 1;
    for (const d of dirs) {
      const r = applyDirection(cur, d);
      if (!r.moved) continue;
      if (r.won) return { won: true, explored };
      const k = stateKey(r.game);
      if (seen.has(k)) continue;
      seen.add(k);
      q.push(r.game);
    }
  }

  return { won: false, explored };
}

function stateKey(g: GameBundle): string {
  return [
    posKey(g.player),
    [...g.treatsRemaining].sort().join(","),
    [...g.relicsRemaining].sort().join(","),
    [...g.keyCells].sort().join(","),
    [...g.lockCells].sort().join(","),
    [...g.memoryRuneCells].sort().join(","),
    [...g.memoryGateCells].sort().join(","),
    g.status.keysHeld,
    g.status.memoryRunes,
    g.status.switchesActivated,
    g.status.phaseOpen ? "phase1" : "phase0"
  ].join("|");
}

describe("campaign solvability", () => {
  it("1 到 1000 关都存在通关路径", () => {
    const failures: Array<{ levelId: number; explored: number }> = [];

    for (let levelId = 1; levelId <= MAX_LEVEL_ID; levelId += 1) {
      const spec = getLevelSpec(levelId);
      const g = buildGameBundleSeeded(spec.sceneId, spec.difficulty, spec.layoutSeed, spec);
      const result = solve(g);
      if (!result.won) failures.push({ levelId, explored: result.explored });
    }

    expect(failures).toEqual([]);
  }, 30_000);
});
