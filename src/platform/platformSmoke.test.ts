import { describe, expect, it } from "vitest";
import { CAMPAIGN_PACK_VERSION } from "../campaign/constants";
import type { CampaignSaveV1 } from "../campaign/types";
import { runRewardedAd } from "./ads";
import { loadCatalog, runMockPurchase } from "./commerce";
import { createMockPlatformProviders } from "./mockProviders";
import { claimRewardCenterItem, loadRewardCenter } from "./rewards";
import { bindPlatformAccount, syncCampaignProgress } from "./user";

const smokeSave = (): CampaignSaveV1 => ({
  schema: "campaign:v1",
  packVersion: CAMPAIGN_PACK_VERSION,
  maxUnlockedLevel: 3,
  perLevel: { "1": { cleared: true, stars: 3 } },
  coins: 100,
  stamina: 20,
  toolsUnlocked: {},
  lastStaminaTs: Date.now()
});

describe("platform commercial smoke flow", () => {
  it("guest claims reward, watches ad, purchases, binds account, and syncs progress", async () => {
    const providers = createMockPlatformProviders();
    const session = await providers.auth.ensureGuestSession();
    expect(session.ok).toBe(true);
    if (!session.ok) return;

    const rewards = await loadRewardCenter(session.data, providers);
    expect(rewards.ok).toBe(true);
    const claimed = await claimRewardCenterItem(session.data, "daily_signin_1", providers);
    expect(claimed.ok).toBe(true);

    const ad = await runRewardedAd(session.data, "reward_stamina", providers);
    expect(ad.ok).toBe(true);

    const catalog = await loadCatalog(session.data, providers);
    expect(catalog.ok).toBe(true);
    const purchase = await runMockPurchase(session.data, "coins_pack_small", providers);
    expect(purchase.ok).toBe(true);

    const bound = await bindPlatformAccount(
      session.data,
      { provider: "phone", identifier: "13900001234", verifyCode: "123456", mergeConfirmed: false },
      providers
    );
    expect(bound.ok).toBe(true);
    if (!bound.ok) return;

    const synced = await syncCampaignProgress(bound.data, smokeSave(), providers);
    expect(synced.ok).toBe(true);
    if (!synced.ok) return;
    expect(synced.data.maxUnlockedLevel).toBe(3);
  });
});
