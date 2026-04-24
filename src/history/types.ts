import type { MazeDifficulty, RunMode, SceneMechanic } from "../maze/types";
import type { SceneId } from "../maze/scenes";

export const RUN_SCHEMA_VERSION = 1 as const;

/** 可扩展：后续新指标放进 extras，不必改表结构 */
export type RunExtras = {
  treatsTotal?: number;
  treatsRemainingEnd?: number;
  portalJumpCount?: number;
  /** 预留：版本、客户端渠道等 */
  [key: string]: unknown;
};

/** 单条对局记录（客户端与服务端对齐） */
export type RunRecordV1 = {
  schemaVersion: typeof RUN_SCHEMA_VERSION;
  clientRunId: string;
  clientPlayerId: string;
  playedAt: string;
  durationMs: number;
  steps: number;
  difficulty: MazeDifficulty;
  sceneId: SceneId;
  mode: RunMode;
  mechanic: SceneMechanic;
  won: boolean;
  extras?: RunExtras;
};

export type LeaderboardSort = "durationMs" | "steps";

export type LeaderboardRow = {
  rank: number;
  durationMs: number;
  steps: number;
  sceneId: SceneId;
  difficulty: MazeDifficulty;
  mode: RunMode;
  playedAt: string;
  clientPlayerId: string;
};
