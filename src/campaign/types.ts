import type { MazeDifficulty } from "../maze/types";
import type { SceneId } from "../maze/scenes";

export type ObstacleId = "fog" | "timer_pressure";

export type ToolId = "hint" | "undo";

export type LevelSpec = {
  levelId: number;
  packVersion: number;
  /** 迷宫随机种子（与 packVersion 共同决定布局） */
  layoutSeed: number;
  difficulty: MazeDifficulty;
  sceneId: SceneId;
  /** 本关启用的阻碍（未解锁的会在运行时被过滤） */
  obstacleIds: ObstacleId[];
  /** 三星步数上限（含）；二星、一星依次放宽 */
  starStepPar: [number, number, number];
  /** 若启用计时阻碍，通关最长时间（秒），超时仍可通关但最高 1 星 */
  timeLimitSec: number | null;
};

export type PerLevelRecord = { stars: 0 | 1 | 2 | 3; cleared: boolean };

export type CampaignSaveV1 = {
  schema: "campaign:v1";
  packVersion: number;
  maxUnlockedLevel: number;
  perLevel: Record<string, PerLevelRecord>;
  coins: number;
  stamina: number;
  toolsUnlocked: Partial<Record<ToolId, boolean>>;
  lastStaminaTs: number;
};
