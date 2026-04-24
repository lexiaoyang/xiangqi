import { defaultStartGoal, isWall, mazeForDifficulty } from "./generate";
import { sceneById, type SceneId } from "./scenes";
import type { Dir, GameBundle, MazeDifficulty, Pos, SceneMechanic } from "./types";

export function posKey(p: Pos): string {
  return `${p.row}-${p.col}`;
}

export function equalPos(a: Pos, b: Pos): boolean {
  return a.row === b.row && a.col === b.col;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function enumeratePathCells(maze: import("./types").WallGrid, start: Pos): Pos[] {
  const vis = new Set<string>();
  const out: Pos[] = [];
  const q: Pos[] = [start];
  vis.add(posKey(start));
  const dirs: Dir[] = ["up", "down", "left", "right"];
  while (q.length) {
    const cur = q.shift()!;
    out.push(cur);
    for (const d of dirs) {
      const dr = d === "up" ? -1 : d === "down" ? 1 : 0;
      const dc = d === "left" ? -1 : d === "right" ? 1 : 0;
      const nr = cur.row + dr;
      const nc = cur.col + dc;
      if (isWall(maze, nr, nc)) continue;
      const k = `${nr}-${nc}`;
      if (vis.has(k)) continue;
      vis.add(k);
      q.push({ row: nr, col: nc });
    }
  }
  return out;
}

function pickFarPair(pathCells: Pos[], avoid: Set<string>): { a: Pos; b: Pos } | null {
  const candidates = pathCells.filter((p) => !avoid.has(posKey(p)));
  if (candidates.length < 2) return null;
  const sh = shuffle(candidates);
  const a = sh[0]!;
  let best: Pos | null = null;
  let bestD = -1;
  for (const p of sh.slice(1)) {
    const d = Math.abs(p.row - a.row) + Math.abs(p.col - a.col);
    if (d > bestD) {
      bestD = d;
      best = p;
    }
  }
  if (!best) return null;
  return { a, b: best };
}

function cloneBundle(g: GameBundle): GameBundle {
  return {
    maze: g.maze,
    player: { ...g.player },
    goal: { ...g.goal },
    mechanic: g.mechanic,
    treatsRemaining: new Set(g.treatsRemaining),
    gustMap: new Map(g.gustMap),
    portalPair: g.portalPair ? { a: { ...g.portalPair.a }, b: { ...g.portalPair.b } } : null
  };
}

export function buildGameBundle(sceneId: SceneId, difficulty: MazeDifficulty): GameBundle {
  const scene = sceneById(sceneId);
  const maze = mazeForDifficulty(difficulty);
  const { start, goal } = defaultStartGoal(maze);
  const pathCells = enumeratePathCells(maze, start);
  const avoid = new Set<string>([posKey(start), posKey(goal)]);

  const treatsRemaining = new Set<string>();
  const gustMap = new Map<string, Dir>();
  let portalPair: { a: Pos; b: Pos } | null = null;

  const dirs: Dir[] = ["up", "down", "left", "right"];

  if (scene.mechanic === "collect") {
    const n = Math.min(scene.collectCount ?? 4, Math.max(0, pathCells.length - avoid.size));
    const pool = shuffle(pathCells.filter((p) => !avoid.has(posKey(p))));
    for (let i = 0; i < n; i++) treatsRemaining.add(posKey(pool[i]!));
  }

  if (scene.mechanic === "gust") {
    const ratio = scene.gustRatio ?? 0.1;
    const pool = shuffle(pathCells.filter((p) => !avoid.has(posKey(p)) && !treatsRemaining.has(posKey(p))));
    const count = Math.min(pool.length, Math.max(3, Math.floor(pathCells.length * ratio)));
    for (let i = 0; i < count; i++) {
      const p = pool[i]!;
      gustMap.set(posKey(p), dirs[i % dirs.length]!);
    }
  }

  if (scene.mechanic === "portal") {
    const treatKeys = new Set(treatsRemaining);
    const avoid2 = new Set([...avoid, ...treatKeys]);
    for (const k of gustMap.keys()) avoid2.add(k);
    portalPair = pickFarPair(pathCells, avoid2);
  }

  if (portalPair) {
    gustMap.delete(posKey(portalPair.a));
    gustMap.delete(posKey(portalPair.b));
  }

  return {
    maze,
    player: { ...start },
    goal: { ...goal },
    mechanic: scene.mechanic as SceneMechanic,
    treatsRemaining,
    gustMap,
    portalPair
  };
}

function stepDelta(dir: Dir): { dr: number; dc: number } {
  const dr = dir === "up" ? -1 : dir === "down" ? 1 : 0;
  const dc = dir === "left" ? -1 : dir === "right" ? 1 : 0;
  return { dr, dc };
}

function applyPortal(player: Pos, portalPair: { a: Pos; b: Pos } | null): Pos {
  if (!portalPair) return player;
  if (equalPos(player, portalPair.a)) return { ...portalPair.b };
  if (equalPos(player, portalPair.b)) return { ...portalPair.a };
  return player;
}

function goalOpen(g: GameBundle): boolean {
  if (g.mechanic === "collect") return g.treatsRemaining.size === 0;
  return true;
}

function isWinState(g: GameBundle): boolean {
  return equalPos(g.player, g.goal) && goalOpen(g);
}

export type StepResult = { game: GameBundle; moved: boolean; won: boolean };

/** 执行一步（含洋流连锁、传送门），返回新状态 */
export function applyDirection(game: GameBundle, dir: Dir): StepResult {
  const g0 = cloneBundle(game);
  const first = stepOnce(g0, dir);
  if (!first.moved) return { game, moved: false, won: false };
  let g = first.game;
  let won = isWinState(g);
  let depth = 0;
  while (!won && depth < 24) {
    const gust = g.gustMap.get(posKey(g.player));
    if (!gust) break;
    const chain = stepOnce(g, gust);
    if (!chain.moved) break;
    won = isWinState(g);
    depth += 1;
  }
  return { game: g, moved: true, won };
}

function stepOnce(g: GameBundle, dir: Dir): { game: GameBundle; moved: boolean } {
  const { dr, dc } = stepDelta(dir);
  const nr = g.player.row + dr;
  const nc = g.player.col + dc;
  if (isWall(g.maze, nr, nc)) return { game: g, moved: false };
  if (equalPos({ row: nr, col: nc }, g.goal) && !goalOpen(g)) return { game: g, moved: false };

  g.player = { row: nr, col: nc };
  const tk = posKey(g.player);
  if (g.treatsRemaining.has(tk)) g.treatsRemaining.delete(tk);

  g.player = applyPortal(g.player, g.portalPair);

  if (g.treatsRemaining.has(posKey(g.player))) g.treatsRemaining.delete(posKey(g.player));

  return { game: g, moved: true };
}
