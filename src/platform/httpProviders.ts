import { createRequestId, err, ok, type ApiResult, type PlatformErrorCode, type RequestMeta } from "./api";
import type { BindAccountInput, PlatformProviders } from "./providers";
import {
  readConsentCache,
  readRemoteConfigCache,
  readRewardCenterCache,
  readUserSession,
  readWalletCache,
  writeConsentCache,
  writeRemoteConfigCache,
  writeRewardCenterCache,
  writeUserSession,
  writeWalletCache
} from "./storage";
import type {
  AdPlacement,
  AdShowToken,
  AnalyticsEvent,
  CampaignCloudProgress,
  ConsentState,
  DeviceInfo,
  Order,
  PaymentClientAction,
  ProductCatalog,
  RemoteConfig,
  RewardCenterSnapshot,
  RewardDefinition,
  UserSession,
  WalletSnapshot
} from "./types";

const API_ROOT = import.meta.env.VITE_PLATFORM_API_ROOT || "/api/platform";

type BackendResult<T> = { ok: true } & T | { ok: false; error: string; message?: string; [key: string]: unknown };
type BackendFailure = { ok: false; error?: string; message?: string };

export function shouldUseHttpPlatformProviders(): boolean {
  return import.meta.env.VITE_PLATFORM_PROVIDER === "http";
}

export function createHttpPlatformProviders(apiRoot = API_ROOT): PlatformProviders {
  async function request<T>(path: string, init: RequestInit = {}, meta?: RequestMeta): Promise<ApiResult<T>> {
    const requestId = meta?.requestId || createRequestId("http");
    try {
      const response = await fetch(`${apiRoot}${path}`, {
        ...init,
        headers: {
          "Content-Type": "application/json",
          "X-Request-Id": requestId,
          ...(init.headers || {})
        }
      });
      const data = (await response.json()) as BackendResult<T>;
      if (response.ok && data.ok !== false) return ok(data as T, requestId);
      const failure = data as BackendFailure;
      return err(mapError(failure.error, response.status), failure.message || failure.error || "服务端请求失败", response.status >= 500, undefined, requestId);
    } catch {
      return err("NETWORK_UNAVAILABLE", "后端暂不可用，已使用本地缓存继续。", true, undefined, requestId);
    }
  }

  return {
    auth: {
      async ensureGuestSession(meta) {
        const cached = readUserSession();
        if (cached && cached.profile.bindingState !== "deleted") return ok(cached);
        const result = await request<{ session: UserSession }>("/identity/guest", { method: "POST", body: JSON.stringify({ platform: "web", appVersion: "0.1.0" }) }, meta);
        if (result.ok) {
          writeUserSession(result.data.session);
          writeWalletCache(result.data.session.wallet);
          return ok(result.data.session, result.requestId);
        }
        return result;
      },
      async refreshSession(session, meta) {
        const result = await request<{ session: UserSession }>("/session/refresh", { method: "POST", body: JSON.stringify({ refreshToken: session.token.refreshToken }) }, meta);
        if (result.ok) {
          writeUserSession(result.data.session);
          return ok(result.data.session, result.requestId);
        }
        return result;
      },
      async bindAccount(session, input: BindAccountInput, meta) {
        const result = await request<{ profile: UserSession["profile"] }>("/identity/bind", { method: "POST", body: JSON.stringify({ ...input, userId: session.profile.userId }) }, meta);
        if (!result.ok) return result;
        const bound = { ...session, profile: result.data.profile, updatedAt: new Date().toISOString() };
        writeUserSession(bound);
        return ok(bound, result.requestId);
      },
      async logout() {
        return ok(undefined);
      },
      async requestDeletion(session, meta) {
        const result = await request<{ profile: UserSession["profile"] }>("/privacy/delete", { method: "POST", body: JSON.stringify({ userId: session.profile.userId }) }, meta);
        if (!result.ok) return result;
        const deleted = { ...session, profile: result.data.profile, updatedAt: new Date().toISOString() };
        writeUserSession(deleted);
        return ok(deleted, result.requestId);
      },
      async listDevices(session, meta) {
        const result = await request<{ devices: DeviceInfo[] }>(`/devices?userId=${encodeURIComponent(session.profile.userId)}`, undefined, meta);
        return result.ok ? ok(result.data.devices, result.requestId) : result;
      },
      async revokeDevice(session, deviceId, meta) {
        const result = await request<{ devices: DeviceInfo[] }>("/devices/revoke", { method: "POST", body: JSON.stringify({ userId: session.profile.userId, deviceId }) }, meta);
        return result.ok ? ok(result.data.devices, result.requestId) : result;
      },
      async uploadCloudProgress(session, progress: CampaignCloudProgress, meta) {
        const result = await request<{ save: CampaignCloudProgress }>("/cloud-save", { method: "PUT", body: JSON.stringify({ userId: session.profile.userId, progress, idempotencyKey: meta?.idempotencyKey }) }, meta);
        return result.ok ? ok(result.data.save, result.requestId) : result;
      },
      async downloadCloudProgress(session, meta) {
        const result = await request<{ save: CampaignCloudProgress | null }>(`/cloud-save?userId=${encodeURIComponent(session.profile.userId)}`, undefined, meta);
        return result.ok ? ok(result.data.save, result.requestId) : result;
      }
    },
    wallet: {
      async getWallet(session, meta) {
        const result = await request<{ wallet: WalletSnapshot }>(`/wallet?userId=${encodeURIComponent(session.profile.userId)}`, undefined, meta);
        if (result.ok) writeWalletCache(result.data.wallet);
        return result.ok ? ok(result.data.wallet, result.requestId) : readWalletFallback(result);
      },
      async grant(session, input, meta) {
        const result = await request<{ wallet: WalletSnapshot }>("/wallet/grant", { method: "POST", body: JSON.stringify({ ...input, userId: session.profile.userId, idempotencyKey: meta.idempotencyKey }) }, meta);
        if (result.ok) writeWalletCache(result.data.wallet);
        return result.ok ? ok(result.data.wallet, result.requestId) : result;
      },
      async spend(session, input, meta) {
        const result = await request<{ wallet: WalletSnapshot }>("/wallet/spend", { method: "POST", body: JSON.stringify({ ...input, userId: session.profile.userId, idempotencyKey: meta.idempotencyKey }) }, meta);
        if (result.ok) writeWalletCache(result.data.wallet);
        return result.ok ? ok(result.data.wallet, result.requestId) : result;
      }
    },
    payment: {
      async getCatalog(_session, _config, meta) {
        const cached = readRemoteConfigCache();
        const result = await request<{ catalog: ProductCatalog }>("/catalog", undefined, meta);
        return result.ok ? ok(result.data.catalog, result.requestId) : err("NETWORK_UNAVAILABLE", cached ? "商品目录使用缓存配置。" : "商品目录加载失败。", true);
      },
      async createOrder(session, skuId, meta) {
        const result = await request<{ order: Order; action: PaymentClientAction }>("/orders", { method: "POST", body: JSON.stringify({ userId: session.profile.userId, skuId, idempotencyKey: meta.idempotencyKey }) }, meta);
        return result.ok ? ok({ order: result.data.order, action: result.data.action }, result.requestId) : result;
      },
      async verifyReceipt(_session, orderId, receipt, meta) {
        const result = await request<{ order: Order }>("/orders/verify", { method: "POST", body: JSON.stringify({ orderId, receipt }) }, meta);
        return result.ok ? ok(result.data.order, result.requestId) : result;
      },
      async fulfillOrder(_session, orderId, meta) {
        const result = await request<{ order: Order; wallet: WalletSnapshot }>("/orders/fulfill", { method: "POST", body: JSON.stringify({ orderId }) }, meta);
        if (result.ok) writeWalletCache(result.data.wallet);
        return result.ok ? ok({ order: result.data.order, wallet: result.data.wallet }, result.requestId) : result;
      },
      async restorePurchases(session, meta) {
        const result = await request<{ orders: Order[] }>(`/orders/restore?userId=${encodeURIComponent(session.profile.userId)}`, undefined, meta);
        return result.ok ? ok(result.data.orders, result.requestId) : result;
      }
    },
    ads: {
      async getPlacements(session, _config, meta) {
        const result = await request<{ placements: AdPlacement[] }>(`/ads/placements?userId=${encodeURIComponent(session.profile.userId)}`, undefined, meta);
        return result.ok ? ok(result.data.placements, result.requestId) : result;
      },
      async requestShowToken(session, placementId, meta) {
        const result = await request<{ token: AdShowToken }>("/ads/show-token", { method: "POST", body: JSON.stringify({ userId: session.profile.userId, placementId }) }, meta);
        return result.ok ? ok(result.data.token, result.requestId) : result;
      },
      async showAd(token) {
        return ok({ placementId: token.placementId, showId: token.token, loaded: true, completed: true });
      },
      async claimReward(_session, token, result, meta) {
        const claimed = await request<{ wallet: WalletSnapshot }>("/ads/complete", { method: "POST", body: JSON.stringify({ token: token.token, result }) }, meta);
        if (claimed.ok) writeWalletCache(claimed.data.wallet);
        return claimed.ok ? ok(claimed.data.wallet, claimed.requestId) : claimed;
      }
    },
    rewards: {
      async getRewardCenter(session, _config, meta) {
        const result = await request<{ rewardCenter: RewardCenterSnapshot }>(`/rewards?userId=${encodeURIComponent(session.profile.userId)}`, undefined, meta);
        if (result.ok) writeRewardCenterCache(result.data.rewardCenter);
        return result.ok ? ok(result.data.rewardCenter, result.requestId) : rewardCenterFallback(result);
      },
      async ingestProgress(session, event, meta) {
        const result = await request<{ rewardCenter: RewardCenterSnapshot }>("/events/progress", { method: "POST", body: JSON.stringify({ ...event, userId: session.profile.userId }) }, meta);
        return result.ok ? ok(result.data.rewardCenter, result.requestId) : result;
      },
      async claimReward(session, rewardId, meta) {
        const result = await request<{ reward: RewardDefinition; wallet: WalletSnapshot }>("/rewards/claim", { method: "POST", body: JSON.stringify({ userId: session.profile.userId, rewardId, idempotencyKey: meta.idempotencyKey }) }, meta);
        if (result.ok) writeWalletCache(result.data.wallet);
        return result.ok ? ok({ reward: result.data.reward, wallet: result.data.wallet }, result.requestId) : result;
      }
    },
    config: {
      async getConfig(_session, meta) {
        const result = await request<{ config: RemoteConfig }>("/config", undefined, meta);
        if (result.ok) writeRemoteConfigCache(result.data.config);
        return result.ok ? ok(result.data.config, result.requestId) : ok(readRemoteConfigCache() as RemoteConfig, result.error.requestId);
      },
      async assignExperiment() {
        return ok(null);
      }
    },
    compliance: {
      async getConsent(session, meta) {
        if (!session) return ok(readConsentCache());
        const result = await request<{ consent: ConsentState | null }>(`/consent?userId=${encodeURIComponent(session.profile.userId)}`, undefined, meta);
        if (result.ok && result.data.consent) writeConsentCache(result.data.consent);
        return result.ok ? ok(result.data.consent, result.requestId) : ok(readConsentCache(), result.error.requestId);
      },
      async updateConsent(session, consent, meta) {
        const result = await request<{ consent: ConsentState }>("/consent", { method: "POST", body: JSON.stringify({ userId: session?.profile.userId, consent }) }, meta);
        if (result.ok) writeConsentCache(result.data.consent);
        return result.ok ? ok(result.data.consent, result.requestId) : result;
      },
      async canUseModule() {
        return ok({ allowed: true });
      }
    },
    analytics: {
      async track(event: AnalyticsEvent) {
        return request<void>("/analytics", { method: "POST", body: JSON.stringify(event) });
      },
      async flush() {
        return ok(0);
      }
    }
  };
}

export const httpPlatformProviders = createHttpPlatformProviders();

function mapError(error: string | undefined, status: number): PlatformErrorCode {
  if (status === 401) return "UNAUTHORIZED";
  if (status === 404) return "NOT_FOUND";
  if (status === 429 || error === "rate_limited") return "RATE_LIMITED";
  if (error === "IDEMPOTENCY_CONFLICT") return "IDEMPOTENCY_CONFLICT";
  if (error === "INSUFFICIENT_BALANCE") return "INSUFFICIENT_BALANCE";
  if (error === "already_claimed") return "ALREADY_CLAIMED";
  if (error?.includes("restricted") || error?.includes("consent")) return "COMPLIANCE_RESTRICTED";
  return status >= 500 ? "PROVIDER_UNAVAILABLE" : "VALIDATION_FAILED";
}

function readWalletFallback<T>(result: ApiResult<T>): ApiResult<WalletSnapshot> {
  const cached = readWalletCache();
  return cached ? ok({ ...cached, syncState: "cached" }, result.ok ? result.requestId : result.error.requestId) : (result as ApiResult<WalletSnapshot>);
}

function rewardCenterFallback<T>(result: ApiResult<T>): ApiResult<RewardCenterSnapshot> {
  const cached = readRewardCenterCache();
  return cached ? ok({ ...cached, syncState: "cached" }, result.ok ? result.requestId : result.error.requestId) : (result as ApiResult<RewardCenterSnapshot>);
}
