import type { ObstacleId, ToolId } from "./types";

export const OBSTACLE_META: Record<ObstacleId, { name: string; unlockAtLevel: number }> = {
  fog: { name: "迷雾", unlockAtLevel: 10 },
  timer_pressure: { name: "限时压力", unlockAtLevel: 25 }
};

export const TOOL_META: Record<ToolId, { name: string; unlockAtLevel: number; defaultCharges: number }> = {
  hint: { name: "提示一步", unlockAtLevel: 15, defaultCharges: 1 },
  undo: { name: "撤销", unlockAtLevel: 30, defaultCharges: 2 }
};

export function obstacleUnlockedForPlayer(ob: ObstacleId, maxUnlockedLevel: number): boolean {
  return maxUnlockedLevel >= OBSTACLE_META[ob].unlockAtLevel;
}

export function toolUnlockedForPlayer(t: ToolId, maxUnlockedLevel: number): boolean {
  return maxUnlockedLevel >= TOOL_META[t].unlockAtLevel;
}

export function filterObstaclesForRun(active: ObstacleId[], maxUnlockedLevel: number): ObstacleId[] {
  return active.filter((o) => obstacleUnlockedForPlayer(o, maxUnlockedLevel));
}
