import { defaultStartGoal, isWall, mazeForDifficultyWithRng, mulberry32 } from "./generate";
import { sceneById, type SceneId } from "./scenes";
import type { ToolId } from "../campaign/types";
import type { Dir, GameBundle, MazeDifficulty, Pos, SceneMechanic, StrategicBuildOptions } from "./types";

export function posKey(p: Pos): string {
  return `${p.row}-${p.col}`;
}

export function equalPos(a: Pos, b: Pos): boolean {
  return a.row === b.row && a.col === b.col;
}

function shuffleRng<T>(arr: T[], rnd: () => number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function enumeratePathCells(maze: import("./types").WallGrid, start: Pos, blocked: Set<string> = new Set()): Pos[] {
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
      if (blocked.has(k)) continue;
      if (vis.has(k)) continue;
      vis.add(k);
      q.push({ row: nr, col: nc });
    }
  }
  return out;
}

function pathKeysToGoal(maze: import("./types").WallGrid, start: Pos, goal: Pos): Set<string> {
  return new Set(pathToGoal(maze, start, goal).map(posKey));
}

function pathToGoal(maze: import("./types").WallGrid, start: Pos, goal: Pos): Pos[] {
  const q: Array<{ p: Pos; path: Pos[] }> = [{ p: start, path: [start] }];
  const vis = new Set<string>([posKey(start)]);
  const dirs: Dir[] = ["up", "down", "left", "right"];

  while (q.length) {
    const cur = q.shift()!;
    if (equalPos(cur.p, goal)) return cur.path;
    for (const d of dirs) {
      const dr = d === "up" ? -1 : d === "down" ? 1 : 0;
      const dc = d === "left" ? -1 : d === "right" ? 1 : 0;
      const next = { row: cur.p.row + dr, col: cur.p.col + dc };
      if (isWall(maze, next.row, next.col)) continue;
      const k = posKey(next);
      if (vis.has(k)) continue;
      vis.add(k);
      q.push({ p: next, path: [...cur.path, next] });
    }
  }

  return [start, goal];
}

function pickFarPair(pathCells: Pos[], avoid: Set<string>, rnd: () => number): { a: Pos; b: Pos } | null {
  const candidates = pathCells.filter((p) => !avoid.has(posKey(p)));
  if (candidates.length < 2) return null;
  const sh = shuffleRng(candidates, rnd);
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

type StrategicLayerInput = {
  pathCells: Pos[];
  cellsBeforeLockedGoal: Pos[];
  mainPath: Pos[];
  avoid: Set<string>;
  rng: () => number;
  options: StrategicBuildOptions;
  treatsRemaining: Set<string>;
  gustMap: Map<string, Dir>;
  portalPair: { a: Pos; b: Pos } | null;
};

function buildStrategicLayer(input: StrategicLayerInput): Pick<
  GameBundle,
  | "keyCells"
  | "lockCells"
  | "trapCells"
  | "sentryCells"
  | "switchCells"
  | "unstableCells"
  | "memoryRuneCells"
  | "memoryGateCells"
  | "phaseDoorCells"
  | "relicsRemaining"
  | "requiredRelics"
  | "status"
> {
  const modifiers = new Set(input.options.modifierIds ?? []);
  const keyCells = new Set<string>();
  const lockCells = new Set<string>();
  const trapCells = new Set<string>();
  const sentryCells = new Map<string, Dir>();
  const switchCells = new Set<string>();
  const unstableCells = new Map<string, number>();
  const memoryRuneCells = new Set<string>();
  const memoryGateCells = new Set<string>();
  const phaseDoorCells = new Set<string>();
  const relicsRemaining = new Set<string>();
  const reserved = new Set([...input.avoid, ...input.treatsRemaining, ...input.gustMap.keys()]);
  if (input.portalPair) {
    reserved.add(posKey(input.portalPair.a));
    reserved.add(posKey(input.portalPair.b));
  }
  const main = input.mainPath.filter((p) => !reserved.has(posKey(p)));
  const side = shuffleRng(input.pathCells.filter((p) => !reserved.has(posKey(p)) && !input.mainPath.some((m) => equalPos(m, p))), input.rng);
  const safePick = (pool: Pos[], ratio: number): Pos | null => {
    if (pool.length < 3) return null;
    return pool[Math.min(pool.length - 1, Math.max(1, Math.floor(pool.length * ratio)))] ?? null;
  };

  if (modifiers.has("keys")) {
    const key = safePick(main, 0.28);
    const lock = safePick(main, 0.62);
    if (key && lock && !equalPos(key, lock)) {
      keyCells.add(posKey(key));
      lockCells.add(posKey(lock));
      reserved.add(posKey(key));
      reserved.add(posKey(lock));
    }
  }

  if (modifiers.has("traps")) {
    const count = Math.min(5, 1 + Math.floor((input.options.complexity ?? 1) / 2));
    for (const p of side.slice(0, count)) {
      trapCells.add(posKey(p));
      reserved.add(posKey(p));
    }
  }

  if (modifiers.has("sentries")) {
    const dirs: Dir[] = ["up", "right", "down", "left"];
    for (const [i, p] of side.slice(3, 3 + Math.min(4, input.options.complexity ?? 1)).entries()) {
      sentryCells.set(posKey(p), dirs[i % dirs.length]!);
      reserved.add(posKey(p));
    }
  }

  if (modifiers.has("switches")) {
    const sw = safePick(main, 0.35);
    if (sw) {
      switchCells.add(posKey(sw));
      reserved.add(posKey(sw));
    }
  }

  if (modifiers.has("unstable")) {
    for (const p of side.slice(8, 8 + Math.min(5, input.options.complexity ?? 1))) {
      unstableCells.set(posKey(p), 1);
      reserved.add(posKey(p));
    }
  }

  if (modifiers.has("memory")) {
    const rune = safePick(main, 0.22);
    const gate = safePick(main, 0.72);
    if (rune && gate && !equalPos(rune, gate)) {
      memoryRuneCells.add(posKey(rune));
      memoryGateCells.add(posKey(gate));
      reserved.add(posKey(rune));
      reserved.add(posKey(gate));
    }
  }

  if (modifiers.has("phase")) {
    const door = safePick(side.length ? side : main, 0.5);
    if (door) phaseDoorCells.add(posKey(door));
  }

  if (modifiers.has("relics")) {
    const count = Math.min(2, 1 + Math.floor((input.options.complexity ?? 1) / 4));
    const pool = input.mainPath.filter((p) => !reserved.has(posKey(p)) && !equalPos(p, input.mainPath[0]!) && !equalPos(p, input.mainPath[input.mainPath.length - 1]!));
    for (const p of shuffleRng(pool, input.rng).slice(0, count)) relicsRemaining.add(posKey(p));
  }

  return {
    keyCells,
    lockCells,
    trapCells,
    sentryCells,
    switchCells,
    unstableCells,
    memoryRuneCells,
    memoryGateCells,
    phaseDoorCells,
    relicsRemaining,
    requiredRelics: relicsRemaining.size,
    status: {
      keysHeld: 0,
      memoryRunes: 0,
      switchesActivated: 0,
      trapHits: 0,
      sentryHits: 0,
      unstableBreaks: 0,
      lockedBlocks: 0,
      relicsCollected: 0,
      phaseOpen: false,
      freezeMoves: 0,
      decoys: 0,
      revealPulseMoves: 0,
      toolsUsed: 0
    }
  };
}

function cloneBundle(g: GameBundle): GameBundle {
  return {
    maze: g.maze,
    player: { ...g.player },
    goal: { ...g.goal },
    mechanic: g.mechanic,
    treatsRemaining: new Set(g.treatsRemaining),
    gustMap: new Map(g.gustMap),
    portalPair: g.portalPair ? { a: { ...g.portalPair.a }, b: { ...g.portalPair.b } } : null,
    keyCells: new Set(g.keyCells),
    lockCells: new Set(g.lockCells),
    trapCells: new Set(g.trapCells),
    sentryCells: new Map(g.sentryCells),
    switchCells: new Set(g.switchCells),
    unstableCells: new Map(g.unstableCells),
    memoryRuneCells: new Set(g.memoryRuneCells),
    memoryGateCells: new Set(g.memoryGateCells),
    phaseDoorCells: new Set(g.phaseDoorCells),
    relicsRemaining: new Set(g.relicsRemaining),
    requiredRelics: g.requiredRelics,
    status: { ...g.status }
  };
}

/**
 * @param rng 随机源；战役关卡传入 `mulberry32(seed)` 以保证复现
 */
export function buildGameBundle(sceneId: SceneId, difficulty: MazeDifficulty, rng: () => number = Math.random, options: StrategicBuildOptions = {}): GameBundle {
  const scene = sceneById(sceneId);
  const maze = mazeForDifficultyWithRng(difficulty, rng);
  const { start, goal } = defaultStartGoal(maze);
  const pathCells = enumeratePathCells(maze, start);
  const cellsBeforeLockedGoal = enumeratePathCells(maze, start, new Set([posKey(goal)]));
  const mainPathKeys = pathKeysToGoal(maze, start, goal);
  const mainPath = pathToGoal(maze, start, goal);
  const avoid = new Set<string>([posKey(start), posKey(goal)]);

  const treatsRemaining = new Set<string>();
  const gustMap = new Map<string, Dir>();
  let portalPair: { a: Pos; b: Pos } | null = null;

  const dirs: Dir[] = ["up", "down", "left", "right"];

  if (scene.mechanic === "collect") {
    const n = Math.min(scene.collectCount ?? 4, Math.max(0, cellsBeforeLockedGoal.length - 1));
    const pool = shuffleRng(
      cellsBeforeLockedGoal.filter((p) => !avoid.has(posKey(p))),
      rng
    );
    for (let i = 0; i < n; i++) treatsRemaining.add(posKey(pool[i]!));
  }

  if (scene.mechanic === "gust") {
    const ratio = scene.gustRatio ?? 0.1;
    const pool = shuffleRng(
      pathCells.filter((p) => !avoid.has(posKey(p)) && !treatsRemaining.has(posKey(p)) && !mainPathKeys.has(posKey(p))),
      rng
    );
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
    portalPair = pickFarPair(pathCells, avoid2, rng);
  }

  if (portalPair) {
    gustMap.delete(posKey(portalPair.a));
    gustMap.delete(posKey(portalPair.b));
  }

  const strategic = buildStrategicLayer({ pathCells, cellsBeforeLockedGoal, mainPath, avoid, rng, options, treatsRemaining, gustMap, portalPair });

  return {
    maze,
    player: { ...start },
    goal: { ...goal },
    mechanic: scene.mechanic as SceneMechanic,
    treatsRemaining,
    gustMap,
    portalPair,
    ...strategic
  };
}

export function buildGameBundleSeeded(sceneId: SceneId, difficulty: MazeDifficulty, seed: number, options: StrategicBuildOptions = {}): GameBundle {
  return buildGameBundle(sceneId, difficulty, mulberry32(seed >>> 0), options);
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
  const collectOpen = g.mechanic !== "collect" || g.treatsRemaining.size === 0;
  const relicOpen = g.requiredRelics === 0 || g.relicsRemaining.size === 0;
  return collectOpen && relicOpen;
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
    g = chain.game;
    won = isWinState(g);
    depth += 1;
  }
  return { game: g, moved: true, won };
}

function stepOnce(g: GameBundle, dir: Dir): { game: GameBundle; moved: boolean } {
  tickStatus(g);
  const { dr, dc } = stepDelta(dir);
  const nr = g.player.row + dr;
  const nc = g.player.col + dc;
  if (isWall(g.maze, nr, nc)) return { game: g, moved: false };
  const nextPos = { row: nr, col: nc };
  const nk = posKey(nextPos);
  if (g.lockCells.has(nk)) {
    if (g.status.keysHeld < 1) {
      g.status.lockedBlocks += 1;
      g.status.lastMessage = "需要钥匙或万能钥匙才能通过。";
      return { game: g, moved: false };
    }
    g.status.keysHeld -= 1;
    g.lockCells.delete(nk);
    g.status.lastMessage = "锁门已开启。";
  }
  if (g.memoryGateCells.has(nk)) {
    if (g.status.memoryRunes < 1) {
      g.status.lockedBlocks += 1;
      g.status.lastMessage = "记忆门需要先触发符文。";
      return { game: g, moved: false };
    }
    g.memoryGateCells.delete(nk);
  }
  if (g.phaseDoorCells.has(nk) && !g.status.phaseOpen && g.status.switchesActivated < 1) {
    g.status.lockedBlocks += 1;
    g.status.lastMessage = "相位门关闭，寻找开关或等待窗口。";
    return { game: g, moved: false };
  }
  if (equalPos(nextPos, g.goal) && !goalOpen(g)) {
    g.status.lastMessage = g.relicsRemaining.size > 0 ? "目标遗物尚未带走，出口保持锁定。" : "收集目标未完成。";
    return { game: g, moved: false };
  }

  g.player = { row: nr, col: nc };
  const tk = posKey(g.player);
  if (g.treatsRemaining.has(tk)) g.treatsRemaining.delete(tk);
  collectStrategicCell(g, tk);

  g.player = applyPortal(g.player, g.portalPair);

  if (g.treatsRemaining.has(posKey(g.player))) g.treatsRemaining.delete(posKey(g.player));
  collectStrategicCell(g, posKey(g.player));

  return { game: g, moved: true };
}

function tickStatus(g: GameBundle): void {
  if (g.status.freezeMoves > 0) g.status.freezeMoves -= 1;
  if (g.status.revealPulseMoves > 0) g.status.revealPulseMoves -= 1;
  g.status.phaseOpen = !g.status.phaseOpen;
}

function collectStrategicCell(g: GameBundle, key: string): void {
  if (g.keyCells.has(key)) {
    g.keyCells.delete(key);
    g.status.keysHeld += 1;
    g.status.lastMessage = "获得钥匙，新的路线已打开。";
  }
  if (g.memoryRuneCells.has(key)) {
    g.memoryRuneCells.delete(key);
    g.status.memoryRunes += 1;
    g.status.lastMessage = "记忆符文已记录。";
  }
  if (g.switchCells.has(key)) {
    g.switchCells.delete(key);
    g.status.switchesActivated += 1;
    g.status.phaseOpen = true;
    g.status.lastMessage = "机关已切换，观察相位门。";
  }
  if (g.relicsRemaining.has(key)) {
    g.relicsRemaining.delete(key);
    g.status.relicsCollected += 1;
    g.status.lastMessage = "遗物已取得，规划撤离路线。";
  }
  if (g.trapCells.has(key) && g.status.freezeMoves < 1) {
    g.status.trapHits += 1;
    g.status.lastMessage = "踩中陷阱，星级评价会受影响。";
  }
  if (g.sentryCells.has(key) && g.status.freezeMoves < 1) {
    if (g.status.decoys > 0) {
      g.status.decoys -= 1;
      g.status.lastMessage = "诱饵抵消了一次巡逻惩罚。";
    } else {
      g.status.sentryHits += 1;
      g.status.lastMessage = "进入巡逻视野，路线风险上升。";
    }
  }
  const unstable = g.unstableCells.get(key);
  if (unstable != null) {
    if (unstable <= 1) {
      g.unstableCells.delete(key);
      g.status.unstableBreaks += 1;
      g.status.lastMessage = "不稳定地块已坍塌，避免回头路。";
    } else {
      g.unstableCells.set(key, unstable - 1);
    }
  }
}

export function applyTacticalTool(game: GameBundle, tool: ToolId): { game: GameBundle; applied: boolean; message: string } {
  const g = cloneBundle(game);
  g.status.toolsUsed += 1;
  if (tool === "scanner" || tool === "reveal_pulse") {
    g.status.revealPulseMoves = tool === "reveal_pulse" ? 12 : 6;
    g.status.lastMessage = tool === "reveal_pulse" ? "全局脉冲已展开，关键点短暂显形。" : "战术扫描已展开，附近风险显形。";
    return { game: g, applied: true, message: g.status.lastMessage };
  }
  if (tool === "freeze") {
    g.status.freezeMoves = 5;
    g.status.lastMessage = "冻结场启动，巡逻与陷阱短暂失效。";
    return { game: g, applied: true, message: g.status.lastMessage };
  }
  if (tool === "decoy") {
    g.status.decoys += 1;
    g.status.lastMessage = "诱饵信标已部署，可抵消下一次巡逻惩罚。";
    return { game: g, applied: true, message: g.status.lastMessage };
  }
  if (tool === "key_forge") {
    g.status.keysHeld += 1;
    g.status.lastMessage = "万能钥匙已生成。";
    return { game: g, applied: true, message: g.status.lastMessage };
  }
  if (tool === "bridge") {
    const target = [...g.unstableCells.keys()][0] ?? [...g.trapCells.keys()][0];
    if (!target) return { game, applied: false, message: "当前没有需要架桥处理的危险地块。" };
    g.unstableCells.delete(target);
    g.trapCells.delete(target);
    g.status.lastMessage = "架桥模块已稳定一处风险地块。";
    return { game: g, applied: true, message: g.status.lastMessage };
  }
  return { game, applied: false, message: "该工具由操作层处理。" };
}
