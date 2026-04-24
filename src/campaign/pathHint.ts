import { isWall } from "../maze/generate";
import type { WallGrid } from "../maze/types";
import type { Pos } from "../maze/types";
import { equalPos, posKey } from "../maze/gameState";
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
