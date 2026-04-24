import type { MazeDifficulty, WallGrid } from "./types";

export type { MazeDifficulty, WallGrid };

const SIZE: Record<MazeDifficulty, [number, number]> = {
  easy: [9, 9],
  medium: [13, 11],
  hard: [17, 15],
  expert: [21, 19]
};

/** 可复现随机数（用于战役关卡种子） */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a += 0x6d2b79f5;
    let t = Math.imul(a ^ (a >>> 15), a | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffleWithRng<T>(arr: T[], rnd: () => number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** 深度优先挖通道，保证全图连通且起点到终点可走 */
export function carveMaze(rows: number, cols: number): WallGrid {
  const oddRows = rows % 2 === 0 ? rows + 1 : rows;
  const oddCols = cols % 2 === 0 ? cols + 1 : cols;
  const wall: WallGrid = Array.from({ length: oddRows }, () => Array.from({ length: oddCols }, () => true));

  const dirs: [number, number][] = [
    [0, 2],
    [0, -2],
    [2, 0],
    [-2, 0]
  ];

  function carve(r: number, c: number) {
    wall[r][c] = false;
    for (const [dr, dc] of shuffle(dirs)) {
      const nr = r + dr;
      const nc = c + dc;
      if (nr <= 0 || nr >= oddRows - 1 || nc <= 0 || nc >= oddCols - 1) continue;
      if (wall[nr][nc]) {
        wall[r + dr / 2][c + dc / 2] = false;
        carve(nr, nc);
      }
    }
  }

  carve(1, 1);
  return wall;
}

export function carveMazeWithRng(rows: number, cols: number, rnd: () => number): WallGrid {
  const oddRows = rows % 2 === 0 ? rows + 1 : rows;
  const oddCols = cols % 2 === 0 ? cols + 1 : cols;
  const wall: WallGrid = Array.from({ length: oddRows }, () => Array.from({ length: oddCols }, () => true));

  const dirs: [number, number][] = [
    [0, 2],
    [0, -2],
    [2, 0],
    [-2, 0]
  ];

  function carve(r: number, c: number) {
    wall[r][c] = false;
    for (const [dr, dc] of shuffleWithRng(dirs, rnd)) {
      const nr = r + dr;
      const nc = c + dc;
      if (nr <= 0 || nr >= oddRows - 1 || nc <= 0 || nc >= oddCols - 1) continue;
      if (wall[nr][nc]) {
        wall[r + dr / 2][c + dc / 2] = false;
        carve(nr, nc);
      }
    }
  }

  carve(1, 1);
  return wall;
}

export function mazeForDifficulty(d: MazeDifficulty): WallGrid {
  const [r, c] = SIZE[d];
  return carveMaze(r, c);
}

export function mazeForDifficultyWithRng(d: MazeDifficulty, rnd: () => number): WallGrid {
  const [r, c] = SIZE[d];
  return carveMazeWithRng(r, c, rnd);
}

export function gridDimensions(grid: WallGrid): { rows: number; cols: number } {
  return { rows: grid.length, cols: grid[0]?.length ?? 0 };
}

export function defaultStartGoal(grid: WallGrid): { start: { row: number; col: number }; goal: { row: number; col: number } } {
  const { rows, cols } = gridDimensions(grid);
  return {
    start: { row: 1, col: 1 },
    goal: { row: rows - 2, col: cols - 2 }
  };
}

export function isWall(grid: WallGrid, row: number, col: number): boolean {
  if (row < 0 || col < 0 || row >= grid.length || col >= (grid[0]?.length ?? 0)) return true;
  return grid[row][col];
}
