import type { MazeDifficulty } from "../maze/types";
import type { SceneId } from "../maze/scenes";
import { SCENES } from "../maze/scenes";
import { CAMPAIGN_PACK_VERSION, MAX_LEVEL_ID } from "./constants";
import type { LevelSpec, ObstacleId } from "./types";
import {
  archetypeForLevel,
  chapterForLevel,
  complexityForLevel,
  modifiersForLevel,
  recommendedToolsForModifiers,
  rewardWithVipBonus
} from "./strategy";

const SCENE_ORDER: SceneId[] = SCENES.map((s) => s.id);

function difficultyForLevel(levelId: number): MazeDifficulty {
  if (levelId <= 8) return "easy";
  if (levelId <= 70) return "medium";
  if (levelId <= 320) return "hard";
  return "expert";
}

function sceneForLevel(levelId: number): SceneId {
  return SCENE_ORDER[(levelId - 1) % SCENE_ORDER.length]!;
}

/** 与战役包版本混合，保证升级后可整体换图 */
export function layoutSeedForLevel(levelId: number): number {
  const x = Math.imul(levelId, 0x9e3779b1) ^ Math.imul(CAMPAIGN_PACK_VERSION, 0x85ebca6b);
  return (x >>> 0) ^ 0xdeadbeef;
}

function obstaclesForLevel(levelId: number): ObstacleId[] {
  const out: ObstacleId[] = [];
  if (levelId >= 8) out.push("fog");
  if (levelId >= 9) out.push("strategic_layers");
  if (levelId >= 18) out.push("timer_pressure");
  return out;
}

function starStepPar(levelId: number, difficulty: MazeDifficulty): [number, number, number] {
  const base =
    difficulty === "easy" ? 48 : difficulty === "medium" ? 92 : difficulty === "hard" ? 150 : 220;
  const scale = 1 + (levelId / MAX_LEVEL_ID) * 0.35;
  const b = Math.round(base * scale);
  return [Math.round(b * 0.55), Math.round(b * 0.75), b];
}

function masteryLabel(levelId: number, complexity: number): string {
  if (levelId <= 4) return "基础读图";
  if (complexity <= 2) return "路线规划";
  if (complexity === 3) return "风险控制";
  if (complexity === 4) return "系统推演";
  return "宗师级复合解";
}

function objectiveBrief(levelId: number, modifiers: string[]): string {
  if (levelId <= 4) return "观察路径、收集目标并安全撤离。";
  const parts = modifiers.map((modifier) => {
    if (modifier === "keys") return "先拿钥匙再开锁";
    if (modifier === "traps") return "绕开陷阱或用工具压低风险";
    if (modifier === "sentries") return "避开巡逻视野";
    if (modifier === "switches") return "按顺序触发机关";
    if (modifier === "unstable") return "减少重复踩踏";
    if (modifier === "memory") return "记住门序";
    if (modifier === "phase") return "等待相位窗口";
    if (modifier === "relics") return "拿到遗物再撤离";
    return "完成战术目标";
  });
  return parts.length ? parts.join("，") + "。" : "规划路线、控制步数并安全抵达终点。";
}

function timeLimitFor(levelId: number, difficulty: MazeDifficulty): number | null {
  if (levelId < 18) return null;
  const base = difficulty === "easy" ? 70 : difficulty === "medium" ? 110 : difficulty === "hard" ? 165 : 230;
  return Math.round(base + levelId * 0.08);
}

export function getLevelSpec(levelId: number): LevelSpec {
  const lid = Math.max(1, Math.min(MAX_LEVEL_ID, Math.floor(levelId)));
  const difficulty = difficultyForLevel(lid);
  const sceneId = sceneForLevel(lid);
  const archetype = archetypeForLevel(lid);
  const modifierIds = modifiersForLevel(lid, archetype);
  const complexity = complexityForLevel(lid);
  const chapter = chapterForLevel(lid);
  const recommendedTools = recommendedToolsForModifiers(modifierIds).filter((tool) => tool === "hint" || tool === "undo" || lid >= 8);
  const coins = rewardWithVipBonus(10 + Math.round(lid * 0.15) + complexity * 6, { points: 0 });
  return {
    levelId: lid,
    packVersion: CAMPAIGN_PACK_VERSION,
    layoutSeed: layoutSeedForLevel(lid),
    difficulty,
    sceneId,
    obstacleIds: obstaclesForLevel(lid),
    chapter,
    archetype,
    complexity,
    objectiveBrief: objectiveBrief(lid, modifierIds),
    objectives: [
      { id: "reach_goal", label: "抵达出口", description: "找到通往终点的稳定路线。", required: true },
      ...(modifierIds.includes("relics") ? [{ id: "extract_relic", label: "带走遗物", description: "先取得遗物，再选择安全撤离线。", required: true }] : []),
      ...(modifierIds.includes("traps") || modifierIds.includes("sentries") ? [{ id: "avoid_danger", label: "控制风险", description: "尽量避开陷阱和巡逻惩罚。", required: false }] : []),
      { id: "master_steps", label: "大师步数", description: "在三星步数内完成关卡。", required: false }
    ],
    modifierIds,
    recommendedTools,
    rewardProfile: {
      coins,
      ...(lid % 10 === 0 ? { stamina: 1 } : {}),
      ...(lid % 25 === 0 ? { vipPoints: 10 } : {}),
      ...(lid % 12 === 0 ? { toolCharges: { scanner: 1 } } : {})
    },
    masteryLabel: masteryLabel(lid, complexity),
    firstTimeMechanic: modifierIds.find((modifier) => {
      const firstAt: Record<string, number> = { keys: 9, traps: 21, sentries: 28, switches: 41, unstable: 48, memory: 68, phase: 76, relics: 81 };
      return firstAt[modifier] === lid;
    }),
    starStepPar: starStepPar(lid, difficulty),
    timeLimitSec: timeLimitFor(lid, difficulty)
  };
}
