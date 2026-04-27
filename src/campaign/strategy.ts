import type { LevelArchetype, RewardProfile, StrategicModifierId, StrategyChapter, ToolId, VipState } from "./types";

export const STRATEGY_CHAPTERS: StrategyChapter[] = [
  { id: "rookie", name: "序章：路径直觉", subtitle: "学会读图，而不是只看出口", unlockAtLevel: 1, theme: "green", ruleSummary: "短路线与收集目标，建立基础空间判断。" },
  { id: "routing", name: "第一幕：钥匙与分岔", subtitle: "先拿什么，后开哪扇门", unlockAtLevel: 9, theme: "amber", ruleSummary: "钥匙、锁门、路线回报开始影响最优解。" },
  { id: "pressure", name: "第二幕：巡逻与风险", subtitle: "避开危险区域，保留关键步数", unlockAtLevel: 21, theme: "crimson", ruleSummary: "陷阱、巡逻与限时压力要求预判。" },
  { id: "systems", name: "第三幕：机关系统", subtitle: "开关、相位门、一次性地块", unlockAtLevel: 41, theme: "violet", ruleSummary: "多个系统交叠，要求顺序规划。" },
  { id: "mastery", name: "第四幕：遗物撤离", subtitle: "收益、风险、撤离路线三选二", unlockAtLevel: 81, theme: "cyan", ruleSummary: "遗物与可选目标带来成人向取舍。" },
  { id: "grandmaster", name: "终幕：混合大师", subtitle: "多系统复合解题", unlockAtLevel: 181, theme: "gold", ruleSummary: "所有机制混合，考验稳定策略。" }
];

export const TACTICAL_TOOL_META: Record<ToolId, { name: string; shortName: string; unlockAtLevel: number; defaultCharges: number; description: string; counters: StrategicModifierId[] }> = {
  hint: { name: "路径推演", shortName: "提示", unlockAtLevel: 12, defaultCharges: 1, description: "标记通向目标的下一步。", counters: ["relics", "keys"] },
  undo: { name: "回溯一步", shortName: "撤销", unlockAtLevel: 24, defaultCharges: 2, description: "撤回上一步行动。", counters: ["traps", "unstable"] },
  scanner: { name: "战术扫描", shortName: "扫描", unlockAtLevel: 10, defaultCharges: 1, description: "揭示附近危险、钥匙和遗物。", counters: ["traps", "sentries", "relics"] },
  rewind: { name: "时间回卷", shortName: "回卷", unlockAtLevel: 28, defaultCharges: 1, description: "连续回退多步，修正错误路线。", counters: ["traps", "phase", "unstable"] },
  freeze: { name: "冻结场", shortName: "冻结", unlockAtLevel: 34, defaultCharges: 1, description: "短时间压制巡逻和陷阱伤害。", counters: ["sentries", "phase", "traps"] },
  bridge: { name: "架桥模块", shortName: "架桥", unlockAtLevel: 44, defaultCharges: 1, description: "稳定一块不稳定地面或修复危险路段。", counters: ["unstable"] },
  decoy: { name: "诱饵信标", shortName: "诱饵", unlockAtLevel: 55, defaultCharges: 1, description: "抵消下一次巡逻惩罚。", counters: ["sentries"] },
  key_forge: { name: "万能钥匙", shortName: "钥匙", unlockAtLevel: 65, defaultCharges: 1, description: "补一枚临时钥匙，解决锁门路线失误。", counters: ["keys", "memory"] },
  reveal_pulse: { name: "全局脉冲", shortName: "脉冲", unlockAtLevel: 90, defaultCharges: 1, description: "短时间扩大视野并标记关键目标。", counters: ["memory", "relics", "phase"] }
};

export type VipTier = {
  level: number;
  name: string;
  minPoints: number;
  dailyPack: RewardProfile;
  benefits: {
    staminaCapBonus: number;
    staminaRegenReductionPct: number;
    shopDiscountPct: number;
    rewardBonusPct: number;
    extraLoadoutSlots: number;
    scannerRadiusBonus: number;
  };
};

export const VIP_TIERS: VipTier[] = [
  { level: 0, name: "VIP 0", minPoints: 0, dailyPack: { coins: 0 }, benefits: { staminaCapBonus: 0, staminaRegenReductionPct: 0, shopDiscountPct: 0, rewardBonusPct: 0, extraLoadoutSlots: 0, scannerRadiusBonus: 0 } },
  { level: 1, name: "VIP 1 策略学徒", minPoints: 60, dailyPack: { coins: 60, toolCharges: { scanner: 1 } }, benefits: { staminaCapBonus: 4, staminaRegenReductionPct: 10, shopDiscountPct: 5, rewardBonusPct: 5, extraLoadoutSlots: 0, scannerRadiusBonus: 1 } },
  { level: 2, name: "VIP 2 战术专家", minPoints: 180, dailyPack: { coins: 120, stamina: 2, toolCharges: { scanner: 1, freeze: 1 } }, benefits: { staminaCapBonus: 8, staminaRegenReductionPct: 18, shopDiscountPct: 8, rewardBonusPct: 10, extraLoadoutSlots: 1, scannerRadiusBonus: 1 } },
  { level: 3, name: "VIP 3 迷宫大师", minPoints: 420, dailyPack: { coins: 220, stamina: 4, toolCharges: { scanner: 1, bridge: 1, reveal_pulse: 1 } }, benefits: { staminaCapBonus: 12, staminaRegenReductionPct: 25, shopDiscountPct: 12, rewardBonusPct: 15, extraLoadoutSlots: 1, scannerRadiusBonus: 2 } },
  { level: 4, name: "VIP 4 宗师计划", minPoints: 900, dailyPack: { coins: 420, stamina: 6, toolCharges: { scanner: 2, freeze: 1, bridge: 1, key_forge: 1 } }, benefits: { staminaCapBonus: 18, staminaRegenReductionPct: 32, shopDiscountPct: 15, rewardBonusPct: 20, extraLoadoutSlots: 2, scannerRadiusBonus: 2 } }
];

export function chapterForLevel(levelId: number): StrategyChapter {
  return [...STRATEGY_CHAPTERS].reverse().find((chapter) => levelId >= chapter.unlockAtLevel) ?? STRATEGY_CHAPTERS[0]!;
}

export function archetypeForLevel(levelId: number): LevelArchetype {
  if (levelId <= 4) return "tutorial";
  const cycle: LevelArchetype[] = ["route_planning", "key_routing", "resource_conservation", "patrol_evasion", "switch_sequence", "relic_extraction", "mixed_mastery"];
  return cycle[Math.floor((levelId - 5) / 3) % cycle.length]!;
}

export function modifiersForLevel(levelId: number, archetype: LevelArchetype): StrategicModifierId[] {
  const out = new Set<StrategicModifierId>();
  if (levelId >= 9 || archetype === "key_routing") out.add("keys");
  if (levelId >= 21 || archetype === "patrol_evasion") out.add("traps");
  if (levelId >= 28 || archetype === "patrol_evasion") out.add("sentries");
  if (levelId >= 41 || archetype === "switch_sequence") out.add("switches");
  if (levelId >= 48 || archetype === "switch_sequence") out.add("unstable");
  if (levelId >= 68) out.add("memory");
  if (levelId >= 76) out.add("phase");
  if (levelId >= 81 || archetype === "relic_extraction") out.add("relics");
  if (archetype === "mixed_mastery") {
    out.add("keys");
    out.add("traps");
    out.add("switches");
  }
  const limit = Math.min(5, 1 + Math.floor(levelId / 35));
  const picked = [...out].slice(0, limit);
  if (levelId >= 81 && !picked.includes("relics")) picked[picked.length - 1] = "relics";
  return picked;
}

export function complexityForLevel(levelId: number): 1 | 2 | 3 | 4 | 5 {
  if (levelId < 9) return 1;
  if (levelId < 30) return 2;
  if (levelId < 70) return 3;
  if (levelId < 160) return 4;
  return 5;
}

export function recommendedToolsForModifiers(modifiers: StrategicModifierId[]): ToolId[] {
  const tools = new Set<ToolId>(["hint", "undo"]);
  for (const [tool, meta] of Object.entries(TACTICAL_TOOL_META) as Array<[ToolId, (typeof TACTICAL_TOOL_META)[ToolId]]>) {
    if (meta.counters.some((counter) => modifiers.includes(counter))) tools.add(tool);
  }
  return [...tools].slice(0, 4);
}

export function vipTierFor(points: number): VipTier {
  return [...VIP_TIERS].reverse().find((tier) => points >= tier.minPoints) ?? VIP_TIERS[0]!;
}

export function nextVipTier(points: number): VipTier | null {
  return VIP_TIERS.find((tier) => tier.minPoints > points) ?? null;
}

export function vipStaminaCap(vip: VipState): number {
  return 30 + vipTierFor(vip.points).benefits.staminaCapBonus;
}

export function vipRegenMs(vip: VipState): number {
  const reduction = vipTierFor(vip.points).benefits.staminaRegenReductionPct / 100;
  return Math.round(300_000 * (1 - reduction));
}

export function rewardWithVipBonus(baseCoins: number, vip: VipState): number {
  return Math.round(baseCoins * (1 + vipTierFor(vip.points).benefits.rewardBonusPct / 100));
}

export function serverDay(ts = Date.now()): string {
  return new Date(ts).toISOString().slice(0, 10);
}
