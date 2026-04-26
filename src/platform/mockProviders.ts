import { createRequestId, err, ok, type ApiResult, type RequestMeta } from "./api";
import { DEFAULT_REMOTE_CONFIG, isModuleEnabled } from "./config";
import type { BindAccountInput, PlatformProviders } from "./providers";
import {
  PLATFORM_STORAGE_KEYS,
  readCache,
  readConsentCache,
  readRemoteConfigCache,
  readRewardCenterCache,
  readUserSession,
  readWalletCache,
  writeCache,
  writeConsentCache,
  writeRemoteConfigCache,
  writeRewardCenterCache,
  writeUserSession,
  writeWalletCache
} from "./storage";
import type {
  AdShowResult,
  AdShowToken,
  AnalyticsEvent,
  AssetAmount,
  AuditEvent,
  CampaignCloudProgress,
  DeviceInfo,
  ExperimentAssignment,
  LedgerEntry,
  Order,
  ProductCatalog,
  RemoteConfig,
  RewardCenterSnapshot,
  RewardDefinition,
  SessionToken,
  UserProfile,
  UserSession,
  WalletBalances,
  WalletSnapshot
} from "./types";

const ACCESS_TOKEN_TTL_MS = 10 * 60 * 1000;
const REFRESH_TOKEN_TTL_MS = 14 * 24 * 60 * 60 * 1000;
const ANALYTICS_ENDPOINT = "/api/platform/analytics";
const nowIso = () => new Date().toISOString();
const id = (prefix: string) => `${prefix}_${Math.random().toString(36).slice(2, 10)}_${Date.now().toString(36)}`;

const emptyBalances = (): WalletBalances => ({
  coins: 0,
  stamina: 0,
  hint: 0,
  undo: 0,
  ticket: 0,
  premium: 0
});

const issueToken = (): SessionToken => ({
  accessToken: id("atk"),
  refreshToken: id("rtk"),
  accessExpiresAt: Date.now() + ACCESS_TOKEN_TTL_MS,
  refreshExpiresAt: Date.now() + REFRESH_TOKEN_TTL_MS
});

const device = (): DeviceInfo => {
  const existing = readCache<DeviceInfo | null>("platform:device:v1", null);
  if (existing) return { ...existing, lastSeenAt: nowIso() };
  const created: DeviceInfo = {
    deviceId: id("dev"),
    platform: "web",
    appVersion: "0.1.0",
    firstSeenAt: nowIso(),
    lastSeenAt: nowIso()
  };
  writeCache("platform:device:v1", created);
  return created;
};

const defaultWallet = (userId: string): WalletSnapshot => ({
  userId,
  balances: {
    ...emptyBalances(),
    coins: 120,
    stamina: 24
  },
  ledgerCursor: "0",
  syncState: "online",
  reconciliation: { state: "clean", issueCount: 0 },
  updatedAt: nowIso()
});

function audit(event: Omit<AuditEvent, "id" | "createdAt">) {
  const prev = readCache<AuditEvent[]>(PLATFORM_STORAGE_KEYS.audits, []);
  writeCache(PLATFORM_STORAGE_KEYS.audits, [...prev, { ...event, id: id("audit"), createdAt: nowIso() }]);
}

function ledgers(): LedgerEntry[] {
  return readCache<LedgerEntry[]>(PLATFORM_STORAGE_KEYS.ledger, []);
}

function writeLedgers(entries: LedgerEntry[]) {
  writeCache(PLATFORM_STORAGE_KEYS.ledger, entries);
}

function currentAnalyticsPage(): string | undefined {
  if (typeof window === "undefined") return undefined;
  return `${window.location.pathname}${window.location.hash}`;
}

function withAnalyticsDefaults(event: AnalyticsEvent): AnalyticsEvent {
  return {
    ...event,
    source: event.source || "client",
    page: event.page || currentAnalyticsPage(),
    data: event.data ?? {},
    createdAt: event.createdAt || nowIso()
  };
}

function appendAnalyticsQueue(events: AnalyticsEvent[]): void {
  const queue = readCache<AnalyticsEvent[]>(PLATFORM_STORAGE_KEYS.analyticsQueue, []);
  writeCache(PLATFORM_STORAGE_KEYS.analyticsQueue, [...queue, ...events.map(withAnalyticsDefaults)]);
}

async function postAnalyticsEvents(events: AnalyticsEvent[]): Promise<boolean> {
  if (typeof fetch !== "function" || events.length === 0) return false;
  try {
    const response = await fetch(ANALYTICS_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ events: events.map(withAnalyticsDefaults) })
    });
    return response.ok;
  } catch {
    return false;
  }
}

function applyDeltas(wallet: WalletSnapshot, deltas: AssetAmount[]): WalletSnapshot {
  const balances = { ...wallet.balances };
  for (const delta of deltas) {
    balances[delta.kind] = Math.max(0, (balances[delta.kind] ?? 0) + delta.amount);
  }
  return {
    ...wallet,
    balances,
    ledgerCursor: String(Number(wallet.ledgerCursor || "0") + 1),
    updatedAt: nowIso()
  };
}

function mutateWallet(userId: string, input: { source: string; sourceId: string; deltas: AssetAmount[] }, meta: RequestMeta): WalletSnapshot {
  const idempotencyKey = meta.idempotencyKey ?? createRequestId("idem");
  const existingEntry = ledgers().find((entry) => entry.idempotencyKey === idempotencyKey);
  if (existingEntry) {
    const cached = readWalletCache();
    return cached && cached.userId === userId ? cached : defaultWallet(userId);
  }

  const current = readWalletCache() ?? defaultWallet(userId);
  const next = applyDeltas(current, input.deltas);
  const entry: LedgerEntry = {
    id: id("ledger"),
    userId,
    idempotencyKey,
    source: input.source as LedgerEntry["source"],
    sourceId: input.sourceId,
    deltas: input.deltas,
    balanceAfter: next.balances,
    createdAt: nowIso()
  };
  writeLedgers([...ledgers(), entry]);
  writeWalletCache(next);
  const analytics = readCache<AnalyticsEvent[]>(PLATFORM_STORAGE_KEYS.analyticsQueue, []);
  writeCache(PLATFORM_STORAGE_KEYS.analyticsQueue, [
    ...analytics,
    {
      name: input.deltas.some((delta) => delta.amount < 0) ? "economy_sink" : "economy_source",
      source: "economy",
      userId,
      data: {
        source: input.source,
        sourceId: input.sourceId,
        ledgerId: entry.id,
        cursor: next.ledgerCursor
      },
      createdAt: nowIso()
    }
  ]);
  return next;
}

function catalogFromConfig(config: RemoteConfig): ProductCatalog {
  const eligibility: ProductCatalog["eligibility"] = {};
  for (const sku of config.catalog) {
    eligibility[sku.id] = {
      skuId: sku.id,
      purchasable: sku.enabled && isModuleEnabled(config, "payments"),
      reason: sku.enabled ? undefined : "disabled"
    };
  }
  return {
    version: config.version,
    currency: "CNY",
    skus: config.catalog,
    eligibility,
    fetchedAt: nowIso()
  };
}

function orders(): Order[] {
  return readCache<Order[]>(PLATFORM_STORAGE_KEYS.orders, []);
}

function writeOrders(next: Order[]) {
  writeCache(PLATFORM_STORAGE_KEYS.orders, next);
}

function updateOrder(order: Order): Order {
  const next = orders().filter((o) => o.id !== order.id).concat(order);
  writeOrders(next);
  return order;
}

export function createMockPlatformProviders(configOverride?: Partial<RemoteConfig>): PlatformProviders {
  const getConfigValue = (): RemoteConfig => ({ ...DEFAULT_REMOTE_CONFIG, ...readRemoteConfigCache(), ...configOverride, fetchedAt: nowIso() });

  return {
    auth: {
      async ensureGuestSession(): Promise<ApiResult<UserSession>> {
        const cached = readUserSession();
        if (cached && cached.profile.bindingState !== "deleted") return ok(cached);
        const profile: UserProfile = {
          userId: id("user"),
          guestId: id("guest"),
          nickname: "游客玩家",
          bindingState: "guest",
          provider: "guest",
          createdAt: nowIso()
        };
        const session: UserSession = {
          profile,
          token: issueToken(),
          device: device(),
          wallet: defaultWallet(profile.userId),
          updatedAt: nowIso()
        };
        writeUserSession(session);
        writeWalletCache(session.wallet);
        audit({ type: "account_created", userId: profile.userId, deviceId: session.device.deviceId, requestId: createRequestId(), payload: { provider: "guest" } });
        return ok(session);
      },
      async refreshSession(session) {
        if (session.token.refreshExpiresAt <= Date.now()) return err("SESSION_EXPIRED", "登录已过期，请重新进入。");
        const refreshed = { ...session, token: issueToken(), updatedAt: nowIso() };
        writeUserSession(refreshed);
        audit({ type: "session_refreshed", userId: session.profile.userId, deviceId: session.device.deviceId, requestId: createRequestId(), payload: {} });
        return ok(refreshed);
      },
      async bindAccount(session: UserSession, input: BindAccountInput, meta?: RequestMeta) {
        if (input.identifier.toLowerCase().includes("taken") && !input.mergeConfirmed) {
          return err("VALIDATION_FAILED", "该凭据已绑定其他账号，需要确认合并。", false, { provider: input.provider });
        }
        const bound: UserSession = {
          ...session,
          profile: {
            ...session.profile,
            bindingState: "bound",
            provider: input.provider,
            providerUid: input.identifier,
            boundAt: nowIso(),
            nickname: input.provider === "phone" ? `用户${input.identifier.slice(-4)}` : "绑定玩家"
          },
          updatedAt: nowIso()
        };
        writeUserSession(bound);
        audit({ type: "account_bound", userId: bound.profile.userId, deviceId: bound.device.deviceId, requestId: meta?.requestId ?? createRequestId(), payload: { provider: input.provider } });
        return ok(bound);
      },
      async logout() {
        return ok(undefined);
      },
      async requestDeletion(session, meta) {
        const deleted: UserSession = {
          ...session,
          profile: { ...session.profile, bindingState: "deleted", deletionRequestedAt: nowIso() },
          updatedAt: nowIso()
        };
        writeUserSession(deleted);
        audit({ type: "account_deleted", userId: session.profile.userId, deviceId: session.device.deviceId, requestId: meta?.requestId ?? createRequestId(), payload: {} });
        return ok(deleted);
      },
      async listDevices(session) {
        return ok([session.device]);
      },
      async revokeDevice(session, deviceId) {
        const revoked = [{ ...session.device, revokedAt: session.device.deviceId === deviceId ? nowIso() : session.device.revokedAt }];
        return ok(revoked);
      },
      async uploadCloudProgress(_session, progress) {
        writeCache("platform:cloud-progress:v1", progress);
        return ok(progress);
      },
      async downloadCloudProgress() {
        return ok(readCache<CampaignCloudProgress | null>("platform:cloud-progress:v1", null));
      }
    },
    wallet: {
      async getWallet(session) {
        const cached = readWalletCache();
        return ok(cached && cached.userId === session.profile.userId ? cached : writeWalletCache(defaultWallet(session.profile.userId)));
      },
      async grant(session, input, meta) {
        return ok(mutateWallet(session.profile.userId, { ...input, deltas: input.deltas as AssetAmount[] }, meta));
      },
      async spend(session, input, meta) {
        const negative = input.deltas.map((d) => ({ kind: d.kind as AssetAmount["kind"], amount: -Math.abs(d.amount) }));
        return ok(mutateWallet(session.profile.userId, { ...input, deltas: negative }, meta));
      }
    },
    payment: {
      async getCatalog(_session, config) {
        if (!isModuleEnabled(config, "payments")) return err("FEATURE_DISABLED", "支付暂不可用。");
        return ok(catalogFromConfig(config));
      },
      async createOrder(session, skuId, meta) {
        const existing = orders().find((o) => o.idempotencyKey === meta.idempotencyKey);
        if (existing) return ok({ order: existing, action: { kind: "none", message: "订单已创建" } });
        const sku = getConfigValue().catalog.find((item) => item.id === skuId);
        if (!sku) return err("NOT_FOUND", "商品不存在。");
        const order: Order = {
          id: id("order"),
          userId: session.profile.userId,
          skuId,
          amount: sku.amount,
          currency: sku.currency,
          provider: sku.provider,
          status: "created",
          idempotencyKey: meta.idempotencyKey ?? createRequestId("idem"),
          createdAt: nowIso(),
          updatedAt: nowIso()
        };
        updateOrder(order);
        return ok({ order, action: { kind: "sdk", provider: "mock", payload: { orderId: order.id } } });
      },
      async verifyReceipt(_session, orderId, receipt) {
        const order = orders().find((o) => o.id === orderId);
        if (!order) return err("NOT_FOUND", "订单不存在。");
        if (receipt.invalid) return ok(updateOrder({ ...order, status: "verification_failed", updatedAt: nowIso() }));
        return ok(updateOrder({ ...order, status: "paid", providerTransactionId: String(receipt.transactionId ?? id("txn")), updatedAt: nowIso() }));
      },
      async fulfillOrder(session, orderId) {
        const order = orders().find((o) => o.id === orderId);
        if (!order) return err("NOT_FOUND", "订单不存在。");
        const sku = getConfigValue().catalog.find((item) => item.id === order.skuId);
        if (!sku) return err("NOT_FOUND", "商品不存在。");
        if (order.status === "fulfilled") return ok({ order, wallet: readWalletCache() ?? defaultWallet(session.profile.userId) });
        if (order.status !== "paid") return err("VALIDATION_FAILED", "订单尚未支付。");
        const wallet = mutateWallet(session.profile.userId, { source: "purchase", sourceId: order.id, deltas: sku.contents }, { idempotencyKey: `fulfill:${order.id}` });
        const fulfilled = updateOrder({ ...order, status: "fulfilled", fulfillmentLedgerId: wallet.ledgerCursor, updatedAt: nowIso() });
        return ok({ order: fulfilled, wallet });
      },
      async restorePurchases() {
        return ok(orders().filter((order) => order.status === "paid" || order.status === "fulfilled"));
      }
    },
    ads: {
      async getPlacements(_session, config) {
        return ok(isModuleEnabled(config, "ads") ? config.adPlacements.filter((p) => p.enabled) : []);
      },
      async requestShowToken(session, placementId) {
        const placement = getConfigValue().adPlacements.find((p) => p.id === placementId);
        if (!placement || !placement.enabled) return err("FEATURE_DISABLED", "广告位不可用。");
        const token: AdShowToken = {
          token: id("adshow"),
          placementId,
          userId: session.profile.userId,
          rewardId: `${placementId}:reward`,
          expiresAt: Date.now() + 5 * 60 * 1000
        };
        writeCache(`platform:ad-token:${token.token}`, token);
        return ok(token);
      },
      async showAd(token) {
        const result: AdShowResult = { placementId: token.placementId, showId: id("show"), loaded: true, completed: true };
        return ok(result);
      },
      async claimReward(session, token, result) {
        if (token.expiresAt <= Date.now()) return err("VALIDATION_FAILED", "广告奖励已过期。");
        if (!result.completed) return err("VALIDATION_FAILED", "广告未完整观看。");
        const placement = getConfigValue().adPlacements.find((p) => p.id === token.placementId);
        if (!placement) return err("NOT_FOUND", "广告位不存在。");
        return ok(mutateWallet(session.profile.userId, { source: "ad_reward", sourceId: token.token, deltas: placement.rewards }, { idempotencyKey: `ad:${token.token}` }));
      }
    },
    rewards: {
      async getRewardCenter(session, config) {
        const cached = readRewardCenterCache();
        if (cached && cached.userId === session.profile.userId) return ok(cached);
        const snapshot: RewardCenterSnapshot = {
          userId: session.profile.userId,
          rewards: config.rewards,
          claimableCount: config.rewards.filter((reward) => reward.state === "claimable").length,
          serverDay: new Date().toISOString().slice(0, 10),
          updatedAt: nowIso()
        };
        writeRewardCenterCache(snapshot);
        return ok(snapshot);
      },
      async ingestProgress(session, event) {
        const config = getConfigValue();
        const center = readRewardCenterCache() ?? {
          userId: session.profile.userId,
          rewards: config.rewards,
          claimableCount: 0,
          serverDay: new Date().toISOString().slice(0, 10),
          updatedAt: nowIso()
        };
        const rewards = center.rewards.map((reward) => {
          if (!reward.progress || reward.state === "claimed") return reward;
          const current = Math.min(reward.progress.target, reward.progress.current + (event.amount ?? 1));
          return { ...reward, progress: { ...reward.progress, current }, state: current >= reward.progress.target ? "claimable" : reward.state };
        }) as RewardDefinition[];
        const next = { ...center, rewards, claimableCount: rewards.filter((reward) => reward.state === "claimable").length, updatedAt: nowIso() };
        writeRewardCenterCache(next);
        return ok(next);
      },
      async claimReward(session, rewardId, meta) {
        const center = readRewardCenterCache();
        const reward = center?.rewards.find((item) => item.id === rewardId);
        if (!center || !reward) return err("NOT_FOUND", "奖励不存在。");
        if (reward.state === "claimed") return err("ALREADY_CLAIMED", "奖励已领取。");
        if (reward.state !== "claimable") return err("VALIDATION_FAILED", "奖励尚不可领取。");
        const wallet = mutateWallet(session.profile.userId, { source: reward.kind, sourceId: reward.id, deltas: reward.rewards }, { idempotencyKey: meta.idempotencyKey ?? `reward:${reward.id}` });
        const nextRewards = center.rewards.map((item) => (item.id === reward.id ? { ...item, state: "claimed" as const } : item));
        writeRewardCenterCache({ ...center, rewards: nextRewards, claimableCount: nextRewards.filter((item) => item.state === "claimable").length, updatedAt: nowIso() });
        return ok({ reward: { ...reward, state: "claimed" }, wallet });
      }
    },
    config: {
      async getConfig() {
        const config = getConfigValue();
        writeRemoteConfigCache(config);
        return ok(config);
      },
      async assignExperiment(session, experimentId) {
        const experiment = getConfigValue().experiments.find((item) => item.id === experimentId);
        if (!experiment || experiment.variants.length === 0) return ok(null);
        const index = Math.abs([...session.profile.userId].reduce((acc, ch) => acc + ch.charCodeAt(0), 0)) % experiment.variants.length;
        const assignment: ExperimentAssignment = { experimentId, variantId: experiment.variants[index]!, assignedAt: nowIso() };
        return ok(assignment);
      }
    },
    compliance: {
      async getConsent() {
        return ok(readConsentCache());
      },
      async updateConsent(_session, consent) {
        return ok(writeConsentCache({ ...consent, updatedAt: nowIso() }));
      },
      async canUseModule(module, _session, config) {
        const allowed = isModuleEnabled(config, module as keyof RemoteConfig["flags"]);
        return ok({ allowed, reason: allowed ? undefined : "feature_disabled" });
      }
    },
    analytics: {
      async track(event: AnalyticsEvent) {
        const normalized = withAnalyticsDefaults(event);
        const delivered = await postAnalyticsEvents([normalized]);
        if (!delivered) appendAnalyticsQueue([normalized]);
        return ok(undefined);
      },
      async flush() {
        const queue = readCache<AnalyticsEvent[]>(PLATFORM_STORAGE_KEYS.analyticsQueue, []);
        if (queue.length === 0) return ok(0);
        const delivered = await postAnalyticsEvents(queue);
        if (!delivered) return err("NETWORK_UNAVAILABLE", "埋点服务暂不可用，事件已保留在本地队列。", true);
        writeCache(PLATFORM_STORAGE_KEYS.analyticsQueue, []);
        return ok(queue.length);
      }
    }
  };
}

export const mockPlatformProviders = createMockPlatformProviders();
