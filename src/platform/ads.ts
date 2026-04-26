import { createRequestId, err, ok, type ApiResult } from "./api";
import { mockPlatformProviders } from "./mockProviders";
import type { PlatformProviders } from "./providers";
import { PLATFORM_STORAGE_KEYS, readCache, writeCache } from "./storage";
import type { AdPlacement, AdShowToken, AssetAmount, UserSession, WalletSnapshot } from "./types";

export type AdCapState = {
  placementId: string;
  dailyCount: number;
  sessionCount: number;
  lastShownAt?: number;
  day: string;
};

export type AdEligibility = {
  eligible: boolean;
  reason?: "disabled" | "cooldown" | "daily_cap" | "session_cap";
  remainingCooldownSec?: number;
};

const dayKey = () => new Date().toISOString().slice(0, 10);

function caps(): Record<string, AdCapState> {
  return readCache<Record<string, AdCapState>>(PLATFORM_STORAGE_KEYS.adCaps, {});
}

function capKey(userId: string, placementId: string) {
  return `${userId}:${placementId}`;
}

export function adDisclosureLabel(placement: AdPlacement): string {
  const reward = placement.rewards.map((item) => `${item.kind}×${item.amount}`).join("、");
  return placement.format === "rewarded" ? `看广告领取${reward || "奖励"}` : `广告 · ${placement.label}`;
}

export function adEligibility(userId: string, placement: AdPlacement, now = Date.now()): AdEligibility {
  if (!placement.enabled) return { eligible: false, reason: "disabled" };
  const key = capKey(userId, placement.id);
  const existing = caps()[key];
  const state = existing && existing.day === dayKey() ? existing : { placementId: placement.id, dailyCount: 0, sessionCount: 0, day: dayKey() };
  if (state.dailyCount >= placement.dailyCap) return { eligible: false, reason: "daily_cap" };
  if (state.sessionCount >= placement.sessionCap) return { eligible: false, reason: "session_cap" };
  if (state.lastShownAt && now - state.lastShownAt < placement.cooldownSec * 1000) {
    return {
      eligible: false,
      reason: "cooldown",
      remainingCooldownSec: Math.ceil((placement.cooldownSec * 1000 - (now - state.lastShownAt)) / 1000)
    };
  }
  return { eligible: true };
}

export function recordAdShown(userId: string, placementId: string, now = Date.now()): AdCapState {
  const all = caps();
  const key = capKey(userId, placementId);
  const prev = all[key]?.day === dayKey() ? all[key]! : { placementId, dailyCount: 0, sessionCount: 0, day: dayKey() };
  const next = { ...prev, dailyCount: prev.dailyCount + 1, sessionCount: prev.sessionCount + 1, lastShownAt: now };
  writeCache(PLATFORM_STORAGE_KEYS.adCaps, { ...all, [key]: next });
  return next;
}

export function pendingAdTokens(): AdShowToken[] {
  return readCache<AdShowToken[]>("platform:pending-ad-tokens:v1", []).filter((token) => token.expiresAt > Date.now() && !token.consumedAt);
}

export function storePendingAdToken(token: AdShowToken): void {
  writeCache("platform:pending-ad-tokens:v1", [...pendingAdTokens().filter((item) => item.token !== token.token), token]);
}

export async function loadAdPlacements(session: UserSession, providers: PlatformProviders = mockPlatformProviders): Promise<ApiResult<AdPlacement[]>> {
  const config = await providers.config.getConfig(session);
  if (!config.ok) return config;
  return providers.ads.getPlacements(session, config.data);
}

export async function runRewardedAd(
  session: UserSession,
  placementId: string,
  providers: PlatformProviders = mockPlatformProviders
): Promise<ApiResult<{ wallet: WalletSnapshot; rewards: AssetAmount[] }>> {
  const placements = await loadAdPlacements(session, providers);
  if (!placements.ok) return placements;
  const placement = placements.data.find((item) => item.id === placementId);
  if (!placement) return err("NOT_FOUND", "广告位不存在。");
  const eligibility = adEligibility(session.profile.userId, placement);
  if (!eligibility.eligible) return err("FEATURE_DISABLED", "广告暂不可用。", true, eligibility);

  const token = await providers.ads.requestShowToken(session, placementId, { requestId: createRequestId("adtoken") });
  if (!token.ok) return token;
  storePendingAdToken(token.data);
  await providers.analytics.track({
    name: "ad_reward_token_issued",
    userId: session.profile.userId,
    deviceId: session.device.deviceId,
    data: { placementId, rewardId: token.data.rewardId },
    createdAt: new Date().toISOString()
  });

  const show = await providers.ads.showAd(token.data, { requestId: createRequestId("adshow") });
  if (!show.ok) return show;
  if (!show.data.completed) return err("VALIDATION_FAILED", "广告未完整观看。", true);
  await providers.analytics.track({
    name: "ad_reward_completed",
    userId: session.profile.userId,
    deviceId: session.device.deviceId,
    data: { placementId, showId: show.data.showId, provider: "mock" },
    createdAt: new Date().toISOString()
  });

  const wallet = await providers.ads.claimReward(session, token.data, show.data, { requestId: createRequestId("adclaim"), idempotencyKey: `ad:${token.data.token}` });
  if (!wallet.ok) return wallet;
  recordAdShown(session.profile.userId, placementId);
  await providers.analytics.track({
    name: "ad_reward_granted",
    userId: session.profile.userId,
    deviceId: session.device.deviceId,
    data: { placementId, rewardId: token.data.rewardId },
    createdAt: new Date().toISOString()
  });
  return ok({ wallet: wallet.data, rewards: placement.rewards });
}

export function interstitialAllowedDuringPlay(isPlaying: boolean): boolean {
  return !isPlaying;
}
