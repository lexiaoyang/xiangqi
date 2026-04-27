import { describe, expect, it } from "vitest";
import { CAMPAIGN_PACK_VERSION } from "./constants";
import { getLevelSpec } from "./levelSpec";
import {
  achievementUnlocks,
  applyAchievementUnlocks,
  dailyChallengeFor,
  ensureDailyState,
  evaluateMastery,
  recordCodexSeen,
  recordMastery,
  updateStreakAfterClear
} from "./retention";
import type { CampaignSaveV1 } from "./types";

function save(overrides: Partial<CampaignSaveV1> = {}): CampaignSaveV1 {
  return {
    schema: "campaign:v1",
    packVersion: CAMPAIGN_PACK_VERSION,
    maxUnlockedLevel: 30,
    perLevel: {},
    coins: 0,
    stamina: 10,
    toolsUnlocked: {},
    toolInventory: {},
    vip: { points: 0 },
    seenMechanics: {},
    masteryRecords: {},
    daily: { day: "2026-01-01", levelId: 1 },
    streak: { count: 0, best: 0 },
    achievements: {},
    codex: {},
    lastStaminaTs: Date.now(),
    ...overrides
  };
}

describe("fun retention loop helpers", () => {
  it("selects a deterministic daily challenge inside unlocked progress", () => {
    const a = dailyChallengeFor("2026-04-27", 18);
    const b = dailyChallengeFor("2026-04-27", 18);
    expect(a).toEqual(b);
    expect(a.levelId).toBeGreaterThanOrEqual(1);
    expect(a.levelId).toBeLessThanOrEqual(18);
  });

  it("evaluates and records only better mastery scores", () => {
    const spec = getLevelSpec(24);
    const high = evaluateMastery(spec, { stars: 3, steps: spec.starStepPar[0], durationMs: 30_000, dangerHits: 0, toolUses: 0, relicsCollected: 0, requiredRelics: 0 }, 180);
    const low = evaluateMastery(spec, { stars: 1, steps: spec.starStepPar[2] + 20, durationMs: 80_000, dangerHits: 3, toolUses: 4, relicsCollected: 0, requiredRelics: 0 }, 0);
    const withHigh = recordMastery(save(), spec.levelId, high, { stars: 3, steps: spec.starStepPar[0], durationMs: 30_000, dangerHits: 0, toolUses: 0, relicsCollected: 0, requiredRelics: 0 });
    const withLow = recordMastery(withHigh, spec.levelId, low, { stars: 1, steps: spec.starStepPar[2], durationMs: 80_000, dangerHits: 3, toolUses: 4, relicsCollected: 0, requiredRelics: 0 });
    expect(withLow.masteryRecords[String(spec.levelId)]?.score).toBe(high.score);
  });

  it("updates streak once per day and resets after a gap", () => {
    const first = updateStreakAfterClear(save(), "2026-04-27");
    expect(first.save.streak.count).toBe(1);
    expect(first.reward?.coins).toBeGreaterThan(0);
    const sameDay = updateStreakAfterClear(first.save, "2026-04-27");
    expect(sameDay.reward).toBeNull();
    const nextDay = updateStreakAfterClear(first.save, "2026-04-28");
    expect(nextDay.save.streak.count).toBe(2);
    const gap = updateStreakAfterClear(nextDay.save, "2026-04-30");
    expect(gap.save.streak.count).toBe(1);
  });

  it("records codex entries once and grants discovery reward", () => {
    const first = recordCodexSeen(save(), ["keys", "traps"], "2026-04-27T00:00:00.000Z");
    expect(first.newEntries).toEqual(["keys", "traps"]);
    expect(first.reward?.coins).toBe(50);
    const second = recordCodexSeen(first.save, ["keys"], "2026-04-27T00:00:00.000Z");
    expect(second.newEntries).toEqual([]);
    expect(second.reward).toBeNull();
  });

  it("unlocks achievements without duplicating records", () => {
    const base = save({
      perLevel: { "1": { cleared: true, stars: 3 } },
      masteryRecords: { "1": { score: 92, badge: "S", stars: 3, dangerHits: 0, toolUses: 0, clearedAt: "2026-04-27T00:00:00.000Z" } }
    });
    const unlocks = achievementUnlocks(base, { stars: 3, steps: 20, durationMs: 20_000, dangerHits: 0, toolUses: 0, relicsCollected: 0, requiredRelics: 0 });
    expect(unlocks.some((item) => item.id === "first_clear")).toBe(true);
    const applied = applyAchievementUnlocks(base, unlocks);
    expect(achievementUnlocks(applied)).toEqual([]);
  });

  it("refreshes stale daily challenge state", () => {
    const refreshed = ensureDailyState(save({ daily: { day: "2026-04-26", levelId: 2 } }), "2026-04-27");
    expect(refreshed.daily.day).toBe("2026-04-27");
  });
});
