import { err, ok, type ApiResult } from "./api";
import { adEligibility, runRewardedAd } from "./ads";
import { DEFAULT_REMOTE_CONFIG, isModuleEnabled } from "./config";
import type { PlatformProviders } from "./providers";
import { runtimePlatformProviders } from "./runtimeProviders";
import { PLATFORM_STORAGE_KEYS, readCache, writeCache } from "./storage";
import type { AnalyticsEvent, AssetAmount, RemoteConfig, RewardedAdOffer, RewardedAdOfferState, RewardedAdOfferSurface, UserSession, WalletSnapshot } from "./types";

export type OfferEligibility = {
  state: RewardedAdOfferState;
  reason?: string;
  remainingCooldownSec?: number;
};

export type OfferRunResult = {
  offer: RewardedAdOffer;
  wallet: WalletSnapshot;
  rewards: AssetAmount[];
};

export function offersForSurface(config: RemoteConfig, surface: RewardedAdOfferSurface): RewardedAdOffer[] {
  if (!isModuleEnabled(config, "adOffers")) return [];
  return config.rewardedAdOffers.filter((offer) => offer.enabled && offer.surface === surface).sort((a, b) => b.priority - a.priority);
}

export function offerEligibility(session: UserSession | null, offer: RewardedAdOffer, config: RemoteConfig = DEFAULT_REMOTE_CONFIG): OfferEligibility {
  if (!session) return { state: "restricted", reason: "session_missing" };
  if (!offer.enabled || !isModuleEnabled(config, "ads") || !isModuleEnabled(config, "adOffers")) return { state: "disabled", reason: "disabled" };
  const placement = config.adPlacements.find((item) => item.id === offer.placementId);
  if (!placement) return { state: "disabled", reason: "placement_missing" };
  const placementEligibility = adEligibility(session.profile.userId, { ...placement, cooldownSec: offer.cooldownSec, dailyCap: offer.dailyCap, sessionCap: offer.sessionCap });
  if (!placementEligibility.eligible) {
    if (placementEligibility.reason === "cooldown") return { state: "cooldown", reason: "cooldown", remainingCooldownSec: placementEligibility.remainingCooldownSec };
    if (placementEligibility.reason === "daily_cap" || placementEligibility.reason === "session_cap") return { state: "cap_reached", reason: placementEligibility.reason };
    return { state: "disabled", reason: placementEligibility.reason };
  }
  return { state: "available" };
}

export async function runRewardedAdOffer(
  session: UserSession,
  offerId: string,
  config: RemoteConfig = DEFAULT_REMOTE_CONFIG,
  providers: PlatformProviders = runtimePlatformProviders
): Promise<ApiResult<OfferRunResult>> {
  const offer = config.rewardedAdOffers.find((item) => item.id === offerId);
  if (!offer) return err("NOT_FOUND", "广告激励不存在。");
  const eligibility = offerEligibility(session, offer, config);
  if (eligibility.state !== "available") return err("FEATURE_DISABLED", "广告激励暂不可用。", true, eligibility);
  trackOffer("ad_offer_clicked", session, offer, { surface: offer.surface });
  const result = await runRewardedAd(session, offer.placementId, providers);
  if (!result.ok) {
    storePendingOffer(offer, session);
    trackOffer("ad_offer_failed", session, offer, { code: result.error.code });
    return result;
  }
  trackOffer("ad_offer_rewarded", session, offer, { rewardCount: result.data.rewards.length });
  return ok({ offer, wallet: result.data.wallet, rewards: result.data.rewards });
}

export function pendingAdOfferRewards(): Array<{ offerId: string; userId: string; createdAt: string; expiresAt: number }> {
  return readCache<Array<{ offerId: string; userId: string; createdAt: string; expiresAt: number }>>(PLATFORM_STORAGE_KEYS.pendingAdRewards, []).filter((item) => item.expiresAt > Date.now());
}

function storePendingOffer(offer: RewardedAdOffer, session: UserSession) {
  writeCache(PLATFORM_STORAGE_KEYS.pendingAdRewards, [
    ...pendingAdOfferRewards().filter((item) => !(item.offerId === offer.id && item.userId === session.profile.userId)),
    { offerId: offer.id, userId: session.profile.userId, createdAt: new Date().toISOString(), expiresAt: Date.now() + 5 * 60 * 1000 }
  ]);
}

export function offerRewardText(offer: RewardedAdOffer): string {
  return offer.rewards.map((reward) => `${reward.kind}×${reward.amount}`).join(" / ");
}

function trackOffer(name: string, session: UserSession, offer: RewardedAdOffer, data: Record<string, string | number | boolean | null | undefined>) {
  const queue = readCache<AnalyticsEvent[]>(PLATFORM_STORAGE_KEYS.analyticsQueue, []);
  writeCache(PLATFORM_STORAGE_KEYS.analyticsQueue, [
    ...queue,
    {
      name,
      source: "ad",
      userId: session.profile.userId,
      data: { offerId: offer.id, placementId: offer.placementId, ...data },
      createdAt: new Date().toISOString()
    }
  ]);
}
