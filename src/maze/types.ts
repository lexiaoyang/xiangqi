export type WallGrid = boolean[][];

export type MazeDifficulty = "easy" | "medium" | "hard" | "expert";

export type Pos = { row: number; col: number };

export type Dir = "up" | "down" | "left" | "right";

/** 玩法机制，后续新场景可增枚举并在 gameState 中接线 */
export type SceneMechanic = "standard" | "collect" | "gust" | "portal";

/** 对局模式：自由练习不计榜；挑战计入服务端排行 */
export type RunMode = "practice" | "ranked";

export type GameBundle = {
  maze: WallGrid;
  player: Pos;
  goal: Pos;
  mechanic: SceneMechanic;
  /** collect：剩余收集物格子键 row-col */
  treatsRemaining: Set<string>;
  /** gust：踏入该格后追加滑一步的方向 */
  gustMap: Map<string, Dir>;
  /** portal：双向传送；null 表示本局无传送门 */
  portalPair: { a: Pos; b: Pos } | null;
};
