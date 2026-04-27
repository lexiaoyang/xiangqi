import type { ObstacleId, ToolId } from "./types";
import { TACTICAL_TOOL_META } from "./strategy";

export const OBSTACLE_META: Record<ObstacleId, { name: string; unlockAtLevel: number }> = {
  fog: { name: "迷雾", unlockAtLevel: 8 },
  timer_pressure: { name: "限时压力", unlockAtLevel: 18 },
  strategic_layers: { name: "策略机关", unlockAtLevel: 9 }
};

export const TOOL_META: Record<ToolId, { name: string; unlockAtLevel: number; defaultCharges: number }> = {
  hint: { name: TACTICAL_TOOL_META.hint.shortName, unlockAtLevel: TACTICAL_TOOL_META.hint.unlockAtLevel, defaultCharges: TACTICAL_TOOL_META.hint.defaultCharges },
  undo: { name: TACTICAL_TOOL_META.undo.shortName, unlockAtLevel: TACTICAL_TOOL_META.undo.unlockAtLevel, defaultCharges: TACTICAL_TOOL_META.undo.defaultCharges },
  scanner: { name: TACTICAL_TOOL_META.scanner.shortName, unlockAtLevel: TACTICAL_TOOL_META.scanner.unlockAtLevel, defaultCharges: TACTICAL_TOOL_META.scanner.defaultCharges },
  rewind: { name: TACTICAL_TOOL_META.rewind.shortName, unlockAtLevel: TACTICAL_TOOL_META.rewind.unlockAtLevel, defaultCharges: TACTICAL_TOOL_META.rewind.defaultCharges },
  freeze: { name: TACTICAL_TOOL_META.freeze.shortName, unlockAtLevel: TACTICAL_TOOL_META.freeze.unlockAtLevel, defaultCharges: TACTICAL_TOOL_META.freeze.defaultCharges },
  bridge: { name: TACTICAL_TOOL_META.bridge.shortName, unlockAtLevel: TACTICAL_TOOL_META.bridge.unlockAtLevel, defaultCharges: TACTICAL_TOOL_META.bridge.defaultCharges },
  decoy: { name: TACTICAL_TOOL_META.decoy.shortName, unlockAtLevel: TACTICAL_TOOL_META.decoy.unlockAtLevel, defaultCharges: TACTICAL_TOOL_META.decoy.defaultCharges },
  key_forge: { name: TACTICAL_TOOL_META.key_forge.shortName, unlockAtLevel: TACTICAL_TOOL_META.key_forge.unlockAtLevel, defaultCharges: TACTICAL_TOOL_META.key_forge.defaultCharges },
  reveal_pulse: { name: TACTICAL_TOOL_META.reveal_pulse.shortName, unlockAtLevel: TACTICAL_TOOL_META.reveal_pulse.unlockAtLevel, defaultCharges: TACTICAL_TOOL_META.reveal_pulse.defaultCharges }
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
