import type { MazeDifficulty } from "../maze/types";
import type { SceneId } from "../maze/scenes";

export type ObstacleId = "fog" | "timer_pressure" | "strategic_layers";

export type ToolId = "hint" | "undo" | "scanner" | "rewind" | "freeze" | "bridge" | "decoy" | "key_forge" | "reveal_pulse";

export type StrategyChapterId = "rookie" | "routing" | "pressure" | "systems" | "mastery" | "grandmaster";

export type LevelArchetype =
  | "tutorial"
  | "route_planning"
  | "resource_conservation"
  | "key_routing"
  | "patrol_evasion"
  | "switch_sequence"
  | "relic_extraction"
  | "mixed_mastery";

export type StrategicModifierId = "keys" | "traps" | "sentries" | "switches" | "unstable" | "memory" | "phase" | "relics";

export type LevelObjective = {
  id: string;
  label: string;
  description: string;
  required: boolean;
};

export type RewardProfile = {
  coins: number;
  stamina?: number;
  vipPoints?: number;
  toolCharges?: Partial<Record<ToolId, number>>;
};

export type StrategyChapter = {
  id: StrategyChapterId;
  name: string;
  subtitle: string;
  unlockAtLevel: number;
  theme: "green" | "amber" | "violet" | "crimson" | "cyan" | "gold";
  ruleSummary: string;
};

export type VipState = {
  points: number;
  dailyClaimedAt?: string;
};

export type MasteryBadge = "S" | "A" | "B" | "C";

export type MasteryRecord = {
  score: number;
  badge: MasteryBadge;
  stars: 0 | 1 | 2 | 3;
  dangerHits: number;
  toolUses: number;
  clearedAt: string;
};

export type DailyChallengeState = {
  day: string;
  levelId: number;
  completedAt?: string;
};

export type StreakState = {
  count: number;
  best: number;
  lastClearDay?: string;
};

export type AchievementRecord = {
  unlockedAt: string;
  claimedAt?: string;
};

export type CodexRecord = {
  seenAt: string;
  rewardClaimedAt?: string;
};

export type LevelSpec = {
  levelId: number;
  packVersion: number;
  /** 迷宫随机种子（与 packVersion 共同决定布局） */
  layoutSeed: number;
  difficulty: MazeDifficulty;
  sceneId: SceneId;
  /** 本关启用的阻碍（未解锁的会在运行时被过滤） */
  obstacleIds: ObstacleId[];
  chapter: StrategyChapter;
  archetype: LevelArchetype;
  complexity: 1 | 2 | 3 | 4 | 5;
  objectiveBrief: string;
  objectives: LevelObjective[];
  modifierIds: StrategicModifierId[];
  recommendedTools: ToolId[];
  rewardProfile: RewardProfile;
  masteryLabel: string;
  firstTimeMechanic?: StrategicModifierId;
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
  toolInventory: Partial<Record<ToolId, number>>;
  vip: VipState;
  seenMechanics: Partial<Record<StrategicModifierId, boolean>>;
  masteryRecords: Record<string, MasteryRecord>;
  daily: DailyChallengeState;
  streak: StreakState;
  achievements: Record<string, AchievementRecord>;
  codex: Partial<Record<StrategicModifierId, CodexRecord>>;
  lastStaminaTs: number;
};
