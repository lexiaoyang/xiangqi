import { MAX_LEVEL_ID } from "./constants";
import { serverDay, vipTierFor } from "./strategy";
import type { CampaignSaveV1, LevelSpec, MasteryBadge, RewardProfile, StrategicModifierId } from "./types";

export type StrategicClearStats = {
  stars: 0 | 1 | 2 | 3;
  steps: number;
  durationMs: number;
  dangerHits: number;
  toolUses: number;
  relicsCollected: number;
  requiredRelics: number;
};

export type MasteryEvaluation = {
  score: number;
  badge: MasteryBadge;
  label: string;
  contributors: string[];
  tip: string;
};

export type AchievementDefinition = {
  id: string;
  title: string;
  description: string;
  reward: RewardProfile;
};

export type AchievementUnlock = AchievementDefinition & {
  unlockedAt: string;
};

export const MODIFIER_COPY: Record<StrategicModifierId, { short: string; name: string; description: string }> = {
  keys: { short: "钥匙锁门", name: "钥匙与锁门", description: "先拿钥匙再规划开门顺序，避免被锁在收益路线外。" },
  traps: { short: "陷阱风险", name: "陷阱格", description: "危险格会计入策略风险，干净路线可拿更高大师评分。" },
  sentries: { short: "警戒格", name: "警戒岗哨", description: "进入警戒格会增加风险，冻结或诱饵可以降低损失。" },
  switches: { short: "机关闸门", name: "开关机关", description: "先激活机关，再回到关键路径通过特殊门。" },
  unstable: { short: "裂隙地块", name: "不稳定地块", description: "裂隙会制造路线压力，架桥模块可稳定危险路段。" },
  memory: { short: "记忆符文", name: "记忆门", description: "收集符文后通过记忆门，错误顺序会浪费步数。" },
  phase: { short: "相位门", name: "相位门", description: "相位状态会变化，观察 HUD 状态再决定是否推进。" },
  relics: { short: "遗物撤离", name: "遗物目标", description: "先拿遗物再撤离，兼顾收益和安全路线。" }
};

export const ACHIEVEMENTS: AchievementDefinition[] = [
  { id: "first_clear", title: "首战告捷", description: "完成任意 1 个策略关卡", reward: { coins: 60 } },
  { id: "clear_10", title: "稳定推进", description: "累计通关 10 个关卡", reward: { coins: 160, toolCharges: { scanner: 1 } } },
  { id: "stars_30", title: "星门熟手", description: "累计获得 30 颗星", reward: { coins: 220, stamina: 2 } },
  { id: "clean_mastery", title: "零风险大师", description: "零风险并拿到 A 级以上大师评分", reward: { coins: 180, vipPoints: 10 } },
  { id: "tool_efficient", title: "极简解法", description: "复杂关卡中不使用额外工具通关", reward: { coins: 160, toolCharges: { undo: 1 } } },
  { id: "relic_hunter", title: "遗物猎人", description: "成功带出任意遗物", reward: { coins: 240, toolCharges: { reveal_pulse: 1 } } },
  { id: "vip_apprentice", title: "VIP 策略学徒", description: "达到 VIP 1", reward: { coins: 120, toolCharges: { scanner: 1 } } }
];

function hashDay(day: string): number {
  let h = 2166136261;
  for (let i = 0; i < day.length; i++) {
    h ^= day.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function dailyChallengeFor(day = serverDay(), maxUnlockedLevel = 1): CampaignSaveV1["daily"] {
  const unlocked = Math.max(1, Math.min(MAX_LEVEL_ID, maxUnlockedLevel));
  const span = Math.max(1, Math.min(unlocked, 60));
  const floor = Math.max(1, unlocked - span + 1);
  return { day, levelId: floor + (hashDay(day) % span) };
}

export function ensureDailyState(save: CampaignSaveV1, day = serverDay()): CampaignSaveV1 {
  if (save.daily.day === day) return save;
  return { ...save, daily: dailyChallengeFor(day, save.maxUnlockedLevel) };
}

export function streakReward(count: number): RewardProfile {
  const tier = Math.min(7, Math.max(1, count));
  return {
    coins: 40 + tier * 20,
    stamina: tier >= 3 ? 1 : undefined,
    toolCharges: tier >= 5 ? { scanner: 1 } : undefined,
    vipPoints: tier >= 7 ? 5 : undefined
  };
}

export function updateStreakAfterClear(save: CampaignSaveV1, day = serverDay()): { save: CampaignSaveV1; reward: RewardProfile | null } {
  if (save.streak.lastClearDay === day) return { save, reward: null };
  const yesterday = new Date(`${day}T00:00:00.000Z`);
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);
  const yesterdayKey = yesterday.toISOString().slice(0, 10);
  const continued = save.streak.lastClearDay === yesterdayKey;
  const count = continued ? save.streak.count + 1 : 1;
  return {
    save: { ...save, streak: { count, best: Math.max(save.streak.best, count), lastClearDay: day } },
    reward: streakReward(count)
  };
}

export function evaluateMastery(spec: LevelSpec, stats: StrategicClearStats, vipPoints: number): MasteryEvaluation {
  const stepTarget = spec.starStepPar[0];
  const stepScore = Math.max(0, Math.min(20, Math.round(20 - Math.max(0, stats.steps - stepTarget) * 0.7)));
  const starScore = stats.stars * 16;
  const dangerScore = Math.max(0, 16 - stats.dangerHits * 5);
  const toolScore = Math.max(0, 10 - Math.max(0, stats.toolUses - 1) * 3);
  const relicScore = stats.requiredRelics > 0 ? (stats.relicsCollected >= stats.requiredRelics ? 10 : 0) : 6;
  const timerScore = spec.timeLimitSec ? Math.max(0, Math.min(8, Math.round(8 - stats.durationMs / 1000 / spec.timeLimitSec * 4))) : 6;
  const vipBonus = Math.min(4, Math.floor(vipTierFor(vipPoints).benefits.rewardBonusPct / 5));
  const score = Math.max(0, Math.min(100, starScore + stepScore + dangerScore + toolScore + relicScore + timerScore + vipBonus));
  const badge: MasteryBadge = score >= 90 ? "S" : score >= 75 ? "A" : score >= 55 ? "B" : "C";
  const contributors = [
    `星级 +${starScore}`,
    `路线效率 +${stepScore}`,
    stats.dangerHits === 0 ? "零风险 +16" : `风险 -${stats.dangerHits * 5}`,
    stats.toolUses <= 1 ? "工具克制 +10" : `工具消耗 ${stats.toolUses}`,
    stats.requiredRelics > 0 ? `遗物 ${stats.relicsCollected}/${stats.requiredRelics}` : "主线目标完成",
    vipBonus > 0 ? `VIP 加成 +${vipBonus}` : ""
  ].filter(Boolean);
  const tip =
    stats.dangerHits > 0
      ? "下次优先扫描危险格，零风险路线会显著提高大师评分。"
      : stats.steps > stepTarget
        ? "路线已经安全，下一步尝试压缩绕路步数。"
        : stats.toolUses > 1
          ? "可以尝试少用工具，保留库存会提高策略评价。"
          : "这是一条高质量路线，继续挑战更高复杂度关卡。";
  return { score, badge, label: `${badge} 级大师评分`, contributors, tip };
}

export function recordMastery(save: CampaignSaveV1, levelId: number, evaluation: MasteryEvaluation, stats: StrategicClearStats, now = new Date().toISOString()): CampaignSaveV1 {
  const key = String(levelId);
  const prev = save.masteryRecords[key];
  if (prev && prev.score >= evaluation.score) return save;
  return {
    ...save,
    masteryRecords: {
      ...save.masteryRecords,
      [key]: {
        score: evaluation.score,
        badge: evaluation.badge,
        stars: stats.stars,
        dangerHits: stats.dangerHits,
        toolUses: stats.toolUses,
        clearedAt: now
      }
    }
  };
}

export function recordCodexSeen(save: CampaignSaveV1, modifiers: StrategicModifierId[], now = new Date().toISOString()): { save: CampaignSaveV1; newEntries: StrategicModifierId[]; reward: RewardProfile | null } {
  const codex = { ...save.codex };
  const seenMechanics = { ...save.seenMechanics };
  const newEntries: StrategicModifierId[] = [];
  for (const modifier of modifiers) {
    if (!codex[modifier]) {
      codex[modifier] = { seenAt: now, rewardClaimedAt: now };
      seenMechanics[modifier] = true;
      newEntries.push(modifier);
    }
  }
  return {
    save: { ...save, codex, seenMechanics },
    newEntries,
    reward: newEntries.length ? { coins: newEntries.length * 25 } : null
  };
}

export function achievementUnlocks(save: CampaignSaveV1, stats?: StrategicClearStats): AchievementUnlock[] {
  const cleared = Object.values(save.perLevel).filter((item) => item.cleared).length;
  const stars = Object.values(save.perLevel).reduce((sum, item) => sum + item.stars, 0);
  const masteryBest = Object.values(save.masteryRecords);
  const checks: Record<string, boolean> = {
    first_clear: cleared >= 1,
    clear_10: cleared >= 10,
    stars_30: stars >= 30,
    clean_mastery: Boolean(stats && stats.dangerHits === 0 && masteryBest.some((item) => item.score >= 75)),
    tool_efficient: Boolean(stats && stats.toolUses === 0 && stats.stars >= 2),
    relic_hunter: Boolean(stats && stats.relicsCollected > 0),
    vip_apprentice: vipTierFor(save.vip.points).level >= 1
  };
  const now = new Date().toISOString();
  return ACHIEVEMENTS.filter((item) => checks[item.id] && !save.achievements[item.id]).map((item) => ({ ...item, unlockedAt: now }));
}

export function applyAchievementUnlocks(save: CampaignSaveV1, unlocks: AchievementUnlock[]): CampaignSaveV1 {
  if (unlocks.length === 0) return save;
  const achievements = { ...save.achievements };
  for (const unlock of unlocks) achievements[unlock.id] = { unlockedAt: unlock.unlockedAt, claimedAt: unlock.unlockedAt };
  return { ...save, achievements };
}

export function totalMasteryScore(save: CampaignSaveV1): number {
  return Object.values(save.masteryRecords).reduce((sum, item) => sum + item.score, 0);
}
