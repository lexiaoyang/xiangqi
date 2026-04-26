import { describe, expect, it } from "vitest";
import { CAMPAIGN_PACK_VERSION } from "../campaign/constants";
import type { CampaignSaveV1 } from "../campaign/types";
import {
  bindPlatformAccount,
  bootstrapPlatformUser,
  campaignSaveToCloudProgress,
  getWalletSummary,
  guestRecoveryMessage,
  mergeCampaignCloudProgress,
  requestAccountDeletion,
  restoreCachedPlatformSession,
  summarizeAccount,
  syncCampaignProgress
} from "./user";

const localSave = (): CampaignSaveV1 => ({
  schema: "campaign:v1",
  packVersion: CAMPAIGN_PACK_VERSION,
  maxUnlockedLevel: 8,
  perLevel: {
    "1": { cleared: true, stars: 2 },
    "2": { cleared: true, stars: 3 }
  },
  coins: 120,
  stamina: 20,
  toolsUnlocked: {},
  lastStaminaTs: Date.now()
});

describe("platform user account", () => {
  it("bootstraps and restores a durable guest session", async () => {
    const created = await bootstrapPlatformUser();
    expect(created.ok).toBe(true);
    if (!created.ok) return;
    expect(created.data.profile.bindingState).toBe("guest");
    expect(restoreCachedPlatformSession()?.profile.userId).toBe(created.data.profile.userId);
    expect(summarizeAccount(created.data).state).toBe("guest");
  });

  it("binds guest account without losing identity", async () => {
    const created = await bootstrapPlatformUser();
    expect(created.ok).toBe(true);
    if (!created.ok) return;
    const bound = await bindPlatformAccount(created.data, {
      provider: "phone",
      identifier: "13800001234",
      verifyCode: "123456",
      mergeConfirmed: false
    });
    expect(bound.ok).toBe(true);
    if (!bound.ok) return;
    expect(bound.data.profile.userId).toBe(created.data.profile.userId);
    expect(summarizeAccount(bound.data).state).toBe("bound");
  });

  it("merges campaign progress by highest unlock and best stars", () => {
    const merged = mergeCampaignCloudProgress(localSave(), {
      maxUnlockedLevel: 5,
      perLevelStars: { "1": 3, "3": 1 },
      updatedAt: new Date(0).toISOString()
    });
    expect(merged.maxUnlockedLevel).toBe(8);
    expect(merged.perLevelStars["1"]).toBe(3);
    expect(merged.perLevelStars["2"]).toBe(3);
    expect(merged.perLevelStars["3"]).toBe(1);
    expect(campaignSaveToCloudProgress(localSave()).perLevelStars["2"]).toBe(3);
  });

  it("syncs cloud progress and exposes wallet summary", async () => {
    const created = await bootstrapPlatformUser();
    expect(created.ok).toBe(true);
    if (!created.ok) return;
    const synced = await syncCampaignProgress(created.data, localSave());
    expect(synced.ok).toBe(true);
    const wallet = await getWalletSummary(created.data);
    expect(wallet.ok).toBe(true);
    if (!wallet.ok || !wallet.data) return;
    expect(wallet.data.balances.coins).toBeGreaterThanOrEqual(0);
  });

  it("blocks commercial wallet access after deletion request", async () => {
    const created = await bootstrapPlatformUser();
    expect(created.ok).toBe(true);
    if (!created.ok) return;
    const deleted = await requestAccountDeletion(created.data);
    expect(deleted.ok).toBe(true);
    if (!deleted.ok) return;
    expect(summarizeAccount(deleted.data).state).toBe("deleted");
    const wallet = await getWalletSummary(deleted.data);
    expect(wallet.ok).toBe(false);
    expect(guestRecoveryMessage(null)).toContain("无法远程找回");
  });
});
