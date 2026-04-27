import { isWall } from "../maze/generate";
import type { GameBundle, WallGrid } from "../maze/types";
import type { Pos } from "../maze/types";
import { applyDirection, equalPos, posKey } from "../maze/gameState";
import type { Dir } from "../maze/types";

const DIRS: Dir[] = ["up", "down", "left", "right"];

/** 返回从 start 走向 goal 的下一步（BFS），无路则 null */
export function nextStepTowardGoal(maze: WallGrid, start: Pos, goal: Pos): Pos | null {
  if (equalPos(start, goal)) return null;
  const prev = new Map<string, { from: Pos; dir: Dir }>();
  const q: Pos[] = [start];
  const seen = new Set<string>([posKey(start)]);
  while (q.length) {
    const cur = q.shift()!;
    if (equalPos(cur, goal)) {
      let p = goal;
      let last: Pos | null = null;
      while (!equalPos(p, start)) {
        last = p;
        const pk = posKey(p);
        const pr = prev.get(pk);
        if (!pr) break;
        p = pr.from;
      }
      return last;
    }
    for (const d of DIRS) {
      const dr = d === "up" ? -1 : d === "down" ? 1 : 0;
      const dc = d === "left" ? -1 : d === "right" ? 1 : 0;
      const nr = cur.row + dr;
      const nc = cur.col + dc;
      if (isWall(maze, nr, nc)) continue;
      const np = { row: nr, col: nc };
      const nk = posKey(np);
      if (seen.has(nk)) continue;
      seen.add(nk);
      prev.set(nk, { from: cur, dir: d });
      q.push(np);
    }
  }
  return null;
}

function strategicStateKey(g: GameBundle): string {
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
    g.status.switchesActivated
  ].join("|");
}

export function nextStepTowardStrategicGoal(game: GameBundle): Pos | null {
  const q: Array<{ game: GameBundle; first: Pos | null }> = [{ game, first: null }];
  const seen = new Set([strategicStateKey(game)]);
  while (q.length) {
    const cur = q.shift()!;
    for (const d of DIRS) {
      const result = applyDirection(cur.game, d);
      if (!result.moved) continue;
      const first = cur.first ?? result.game.player;
      if (result.won) return first;
      const key = strategicStateKey(result.game);
      if (seen.has(key)) continue;
      seen.add(key);
      q.push({ game: result.game, first });
    }
  }
  return nextStepTowardGoal(game.maze, game.player, game.goal);
}
