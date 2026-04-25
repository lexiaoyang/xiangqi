import type { MazeDifficulty } from "../maze/types";
import type { SceneId } from "../maze/scenes";
import { SCENES } from "../maze/scenes";
import { CAMPAIGN_PACK_VERSION, MAX_LEVEL_ID } from "./constants";
import type { LevelSpec, ObstacleId } from "./types";

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

function timeLimitFor(levelId: number, difficulty: MazeDifficulty): number | null {
  if (levelId < 18) return null;
  const base = difficulty === "easy" ? 70 : difficulty === "medium" ? 110 : difficulty === "hard" ? 165 : 230;
  return Math.round(base + levelId * 0.08);
}

export function getLevelSpec(levelId: number): LevelSpec {
  const lid = Math.max(1, Math.min(MAX_LEVEL_ID, Math.floor(levelId)));
  const difficulty = difficultyForLevel(lid);
  const sceneId = sceneForLevel(lid);
  return {
    levelId: lid,
    packVersion: CAMPAIGN_PACK_VERSION,
    layoutSeed: layoutSeedForLevel(lid),
    difficulty,
    sceneId,
    obstacleIds: obstaclesForLevel(lid),
    starStepPar: starStepPar(lid, difficulty),
    timeLimitSec: timeLimitFor(lid, difficulty)
  };
}
