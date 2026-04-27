import { describe, expect, it } from "vitest";
import { applyToolUnlocksFromProgress, grantToolCharges, regenStamina } from "./persist";
import { nextVipTier, serverDay, vipStaminaCap, vipTierFor } from "./strategy";
import type { CampaignSaveV1 } from "./types";

function save(overrides: Partial<CampaignSaveV1> = {}): CampaignSaveV1 {
  return {
    schema: "campaign:v1",
    packVersion: 1,
    maxUnlockedLevel: 1,
    perLevel: {},
    coins: 0,
    stamina: 0,
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

describe("adult strategy campaign helpers", () => {
  it("unlocks tactical tools by campaign progress", () => {
    const progressed = applyToolUnlocksFromProgress(save({ maxUnlockedLevel: 70 }));
    expect(progressed.toolsUnlocked.scanner).toBe(true);
    expect(progressed.toolsUnlocked.freeze).toBe(true);
    expect(progressed.toolsUnlocked.key_forge).toBe(true);
  });

  it("grants tactical tool charges without losing existing inventory", () => {
    const next = grantToolCharges(save({ toolInventory: { scanner: 2 } }), { scanner: 3, bridge: 1 });
    expect(next.toolInventory.scanner).toBe(5);
    expect(next.toolInventory.bridge).toBe(1);
  });

  it("derives useful VIP benefits and stamina cap", () => {
    const vip = { points: 180, dailyClaimedAt: serverDay(0) };
    expect(vipTierFor(vip.points).level).toBe(2);
    expect(nextVipTier(vip.points)?.level).toBe(3);
    expect(vipStaminaCap(vip)).toBeGreaterThan(30);
  });

  it("uses VIP stamina recovery cap", () => {
    const next = regenStamina(save({ stamina: 29, vip: { points: 420 }, lastStaminaTs: Date.now() - 60 * 60 * 1000 }));
    expect(next.stamina).toBeGreaterThan(30);
  });
});
