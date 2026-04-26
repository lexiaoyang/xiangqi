import { id, nowIso } from "../db/memoryStore.mjs";

export class IdentityService {
  constructor(repo) {
    this.repo = repo;
  }
  guest(input) {
    return { ok: true, session: this.repo.createUserSession(input) };
  }
  refresh(refreshToken) {
    const session = this.repo.refreshSession(refreshToken);
    return session ? { ok: true, session } : { ok: false, error: "session_expired" };
  }
  bind(userId, input) {
    const result = this.repo.bindAccount(userId, input);
    return result.conflict ? { ok: false, error: "merge_confirmation_required", provider: result.provider } : { ok: true, profile: result.profile };
  }
  delete(userId) {
    const profile = this.repo.requestDeletion(userId);
    return profile ? { ok: true, profile } : { ok: false, error: "user_not_found" };
  }
}

export class CloudSaveService {
  constructor(repo) {
    this.repo = repo;
  }
  get(userId) {
    return { ok: true, save: this.repo.getCloudSave(userId) };
  }
  put(userId, input) {
    const result = this.repo.putCloudSave(userId, input);
    return result.conflict ? { ok: false, error: "cloud_save_conflict", current: result.current } : { ok: true, save: result.save };
  }
}

export class WalletService {
  constructor(repo) {
    this.repo = repo;
  }
  get(userId) {
    return { ok: true, wallet: this.repo.wallet(userId) };
  }
  grant(userId, input, idempotencyKey = id("idem")) {
    try {
      return { ok: true, wallet: this.repo.mutateWallet(userId, input, { idempotencyKey }) };
    } catch (error) {
      return { ok: false, error: error.code || "wallet_mutation_failed" };
    }
  }
  spend(userId, input, idempotencyKey = id("idem")) {
    return this.grant(userId, { ...input, deltas: input.deltas.map((delta) => ({ ...delta, amount: -Math.abs(delta.amount) })) }, idempotencyKey);
  }
  reconcile(userId) {
    const wallet = this.repo.wallet(userId);
    const projected = {};
    for (const entry of this.repo.store.ledgerEntries.filter((item) => item.userId === userId)) {
      for (const delta of entry.deltas) projected[delta.kind] = (projected[delta.kind] || 0) + delta.amount;
    }
    return { ok: true, state: "clean", wallet, projected };
  }
}

export class PaymentService {
  constructor(repo, walletService) {
    this.repo = repo;
    this.walletService = walletService;
  }
  catalog() {
    return { ok: true, catalog: { version: this.repo.store.remoteConfig.version, currency: "CNY", skus: this.repo.store.catalog, eligibility: Object.fromEntries(this.repo.store.catalog.map((sku) => [sku.id, { skuId: sku.id, purchasable: sku.enabled }])), fetchedAt: nowIso() } };
  }
  createOrder(userId, skuId, idempotencyKey = id("orderidem")) {
    const order = this.repo.createOrder(userId, skuId, idempotencyKey);
    return order ? { ok: true, order, action: { kind: "sdk", provider: "mock", payload: { orderId: order.id } } } : { ok: false, error: "sku_not_found" };
  }
  verify(orderId, receipt = {}) {
    const order = this.repo.store.orders.get(orderId);
    if (!order) return { ok: false, error: "order_not_found" };
    const status = receipt.invalid ? "verification_failed" : "paid";
    return { ok: true, order: this.repo.updateOrder(orderId, { status, providerTransactionId: receipt.transactionId || id("txn") }) };
  }
  fulfill(orderId) {
    const order = this.repo.store.orders.get(orderId);
    if (!order) return { ok: false, error: "order_not_found" };
    if (order.status === "fulfilled") return { ok: true, order, wallet: this.repo.wallet(order.userId) };
    if (order.status !== "paid") return { ok: false, error: "order_not_paid" };
    const sku = this.repo.store.catalog.find((item) => item.id === order.skuId);
    const result = this.walletService.grant(order.userId, { source: "purchase", sourceId: order.id, deltas: sku.contents }, `fulfill:${order.id}`);
    if (!result.ok) return result;
    const fulfilled = this.repo.updateOrder(order.id, { status: "fulfilled", fulfillmentLedgerId: result.wallet.ledgerCursor });
    return { ok: true, order: fulfilled, wallet: result.wallet };
  }
  refund(orderId) {
    const order = this.repo.store.orders.get(orderId);
    if (!order) return { ok: false, error: "order_not_found" };
    const sku = this.repo.store.catalog.find((item) => item.id === order.skuId);
    const reversal = this.walletService.spend(order.userId, { source: "refund_reversal", sourceId: order.id, deltas: sku.contents }, `refund:${order.id}`);
    const refunded = this.repo.updateOrder(order.id, { status: "refunded" });
    return { ok: true, order: refunded, wallet: reversal.wallet };
  }
  restore(userId) {
    return { ok: true, orders: [...this.repo.store.orders.values()].filter((order) => order.userId === userId && ["paid", "fulfilled"].includes(order.status)) };
  }
}

export class AdService {
  constructor(repo, walletService) {
    this.repo = repo;
    this.walletService = walletService;
  }
  placements() {
    return { ok: true, placements: this.repo.store.remoteConfig.adPlacements.filter((item) => item.enabled) };
  }
  showToken(userId, placementId) {
    const placement = this.repo.store.remoteConfig.adPlacements.find((item) => item.id === placementId && item.enabled);
    if (!placement) return { ok: false, error: "placement_disabled" };
    const gate = commercialGate(this.repo.store.consents.get(userId), "ads");
    if (!gate.allowed) return { ok: false, error: gate.reason };
    const cap = this.consumeCap(userId, placement);
    if (!cap.ok) return cap;
    const token = this.repo.issueAdToken(userId, placementId);
    return token ? { ok: true, token } : { ok: false, error: "placement_disabled" };
  }
  complete(tokenId, providerResult = { completed: true }) {
    const token = this.repo.consumeAdToken(tokenId);
    if (!token) return { ok: false, error: "invalid_ad_token" };
    if (!providerResult.completed) return { ok: false, error: "ad_not_completed" };
    const placement = this.repo.store.remoteConfig.adPlacements.find((item) => item.id === token.placementId);
    const result = this.walletService.grant(token.userId, { source: "ad_reward", sourceId: token.token, deltas: placement.rewards }, `ad:${token.token}`);
    return result.ok ? { ok: true, wallet: result.wallet, rewards: placement.rewards } : result;
  }
  pending(userId) {
    return { ok: true, pending: [...this.repo.store.adTokens.values()].filter((token) => token.userId === userId && token.expiresAt > Date.now() && !token.consumedAt) };
  }
  consumeCap(userId, placement) {
    const day = nowIso().slice(0, 10);
    const cooldownKey = `ad:cooldown:${userId}:${placement.id}`;
    const dailyKey = `ad:daily:${day}:${userId}:${placement.id}`;
    const sessionKey = `ad:session:${userId}:${placement.id}`;
    const cooldownUntil = Number(this.repo.store.rateLimits.get(cooldownKey) || 0);
    if (cooldownUntil > Date.now()) return { ok: false, error: "ad_cooldown", retryAfterMs: cooldownUntil - Date.now() };
    const dailyCount = Number(this.repo.store.rateLimits.get(dailyKey) || 0);
    const sessionCount = Number(this.repo.store.rateLimits.get(sessionKey) || 0);
    if (placement.dailyCap && dailyCount >= placement.dailyCap) return { ok: false, error: "ad_daily_cap" };
    if (placement.sessionCap && sessionCount >= placement.sessionCap) return { ok: false, error: "ad_session_cap" };
    this.repo.store.rateLimits.set(cooldownKey, Date.now() + placement.cooldownSec * 1000);
    this.repo.store.rateLimits.set(dailyKey, dailyCount + 1);
    this.repo.store.rateLimits.set(sessionKey, sessionCount + 1);
    return { ok: true };
  }
}

export class RewardsEventsService {
  constructor(repo, walletService) {
    this.repo = repo;
    this.walletService = walletService;
  }
  rewardCenter(userId) {
    const claims = this.repo.store.rewardClaims;
    const rewards = this.repo.store.rewardDefinitions.map((reward) => ({ ...reward, state: claims.has(`${userId}:${reward.id}`) ? "claimed" : reward.state }));
    return { ok: true, rewardCenter: { userId, rewards, claimableCount: rewards.filter((reward) => reward.state === "claimable").length, serverDay: nowIso().slice(0, 10), updatedAt: nowIso() } };
  }
  claimReward(userId, rewardId) {
    const key = `${userId}:${rewardId}`;
    const reward = this.repo.store.rewardDefinitions.find((item) => item.id === rewardId);
    if (!reward || reward.state !== "claimable") return { ok: false, error: "reward_not_claimable" };
    if (this.repo.store.rewardClaims.has(key)) return { ok: false, error: "already_claimed" };
    const result = this.walletService.grant(userId, { source: reward.kind, sourceId: reward.id, deltas: reward.rewards }, `reward:${key}`);
    if (!result.ok) return result;
    this.repo.store.rewardClaims.set(key, { userId, rewardId, ledgerCursor: result.wallet.ledgerCursor, claimedAt: nowIso() });
    return { ok: true, reward: { ...reward, state: "claimed" }, wallet: result.wallet };
  }
  ingestEventProgress(userId, event) {
    if (Number(event.amount || 1) > 20) {
      this.repo.recordFraud(userId, "impossible_event_progress", event, "high");
      return { ok: false, error: "implausible_progress" };
    }
    const events = this.userEvents(userId);
    for (const liveEvent of events) {
      for (const task of liveEvent.tasks) {
        if (task.kind !== event.kind || task.state === "claimed") continue;
        task.progress = Math.min(task.target, task.progress + Number(event.amount || 1));
        if (task.progress >= task.target) task.state = "claimable";
      }
    }
    this.repo.store.eventProgress.set(userId, events);
    return { ok: true, eventCenter: this.eventCenter(userId).eventCenter };
  }
  eventCenter(userId) {
    const events = this.userEvents(userId);
    return { ok: true, eventCenter: { userId, events, claimableCount: events.reduce((sum, event) => sum + event.tasks.filter((task) => task.state === "claimable").length, 0), updatedAt: nowIso() } };
  }
  claimEventTask(userId, eventId, taskId) {
    const events = this.userEvents(userId);
    const event = events.find((item) => item.id === eventId);
    const task = event?.tasks.find((item) => item.id === taskId);
    if (!event || !task || task.state !== "claimable") return { ok: false, error: "event_task_not_claimable" };
    const result = this.walletService.grant(userId, { source: "event", sourceId: `${eventId}:${taskId}`, deltas: task.rewards }, `event:${userId}:${eventId}:${taskId}`);
    if (!result.ok) return result;
    task.state = "claimed";
    this.repo.store.eventProgress.set(userId, events);
    return { ok: true, event, task, wallet: result.wallet };
  }
  popupRecord(userId, popupId, suppress = false) {
    const day = nowIso().slice(0, 10);
    const key = `${userId}:${popupId}:${day}`;
    const prev = this.repo.store.popupRecords.get(key) || { userId, popupId, day, impressions: 0, suppressedToday: false };
    const next = { ...prev, impressions: suppress ? prev.impressions : prev.impressions + 1, suppressedToday: suppress || prev.suppressedToday, lastShownAt: nowIso() };
    this.repo.store.popupRecords.set(key, next);
    return { ok: true, record: next };
  }
  userEvents(userId) {
    return structuredClone(this.repo.store.eventProgress.get(userId) || this.repo.store.events);
  }
}

export class ComplianceService {
  constructor(repo) {
    this.repo = repo;
  }
  updateConsent(userId, consent) {
    const next = { ...consent, updatedAt: nowIso() };
    this.repo.store.consents.set(userId, next);
    this.repo.audit("consent_changed", { consent: next }, userId);
    return { ok: true, consent: next };
  }
  canUseModule(userId, module) {
    const consent = this.repo.store.consents.get(userId);
    const gate = commercialGate(consent, module);
    return { ok: true, ...gate };
  }
  analytics(event) {
    const safe = sanitizeAnalytics(event);
    this.repo.store.analyticsEvents.push(safe);
    return { ok: true };
  }
  exportUser(userId) {
    return {
      ok: true,
      export: {
        profile: this.repo.store.users.get(userId),
        devices: this.repo.listDevices(userId),
        wallet: this.repo.wallet(userId),
        orders: [...this.repo.store.orders.values()].filter((order) => order.userId === userId),
        consents: this.repo.store.consents.get(userId) || null,
        audits: this.repo.store.auditEvents.filter((event) => event.userId === userId)
      }
    };
  }
}

export function buildPlatformServices(repo) {
  const wallet = new WalletService(repo);
  return {
    identity: new IdentityService(repo),
    cloudSave: new CloudSaveService(repo),
    wallet,
    payment: new PaymentService(repo, wallet),
    ads: new AdService(repo, wallet),
    rewardsEvents: new RewardsEventsService(repo, wallet),
    compliance: new ComplianceService(repo)
  };
}

function sanitizeAnalytics(event) {
  const data = {};
  for (const [key, value] of Object.entries(event.data || {})) {
    if (["string", "number", "boolean"].includes(typeof value) || value == null) data[key] = typeof value === "string" ? value.slice(0, 160) : value;
  }
  return { name: String(event.name || "unknown"), userId: event.userId, deviceId: event.deviceId, data, createdAt: nowIso() };
}

function commercialGate(consent = {}, module) {
  if (consent?.ageStatus === "minor" && ["payments", "ads", "analytics", "experiments"].includes(module)) {
    return { allowed: false, reason: "minor_restricted" };
  }
  if (module === "analytics" && consent.analyticsAllowed === false) return { allowed: false, reason: "consent_required" };
  if (module === "ads" && consent.personalizedAdsAllowed === false) return { allowed: false, reason: "consent_required" };
  if (module === "payments" && consent.paymentsAllowed === false) return { allowed: false, reason: "consent_required" };
  return { allowed: true };
}
