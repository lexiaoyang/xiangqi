import { applyDeltas, ensureWallet, id, nowIso, walletSnapshot } from "../db/memoryStore.mjs";

export class PlatformRepository {
  constructor(store) {
    this.store = store;
  }

  audit(type, payload = {}, userId, deviceId, requestId = id("req")) {
    const event = { id: id("audit"), type, userId, deviceId, requestId, payload, createdAt: nowIso() };
    this.store.auditEvents.push(event);
    return event;
  }

  createUserSession({ provider = "guest", platform = "web", appVersion = "0.1.0" } = {}) {
    const userId = id("user");
    const deviceId = id("dev");
    const sessionId = id("session");
    const profile = { userId, guestId: id("guest"), nickname: "游客玩家", bindingState: "guest", provider, createdAt: nowIso() };
    const device = { deviceId, userId, platform, appVersion, firstSeenAt: nowIso(), lastSeenAt: nowIso() };
    const session = {
      sessionId,
      userId,
      deviceId,
      accessToken: id("atk"),
      refreshToken: id("rtk"),
      accessExpiresAt: Date.now() + 10 * 60 * 1000,
      refreshExpiresAt: Date.now() + 14 * 24 * 60 * 60 * 1000,
      revokedAt: undefined,
      createdAt: nowIso()
    };
    this.store.users.set(userId, profile);
    this.store.devices.set(deviceId, device);
    this.store.sessions.set(session.refreshToken, session);
    ensureWallet(this.store, userId);
    this.store.cloudSaves.set(userId, { userId, version: 1, maxUnlockedLevel: 1, perLevelStars: {}, settings: {}, updatedAt: nowIso() });
    this.audit("account_created", { provider }, userId, deviceId);
    return this.toUserSession(profile, device, session);
  }

  refreshSession(refreshToken) {
    const session = this.store.sessions.get(refreshToken);
    if (!session || session.revokedAt || session.refreshExpiresAt <= Date.now()) return null;
    const refreshed = { ...session, accessToken: id("atk"), accessExpiresAt: Date.now() + 10 * 60 * 1000 };
    this.store.sessions.set(refreshToken, refreshed);
    this.audit("session_refreshed", {}, refreshed.userId, refreshed.deviceId);
    return this.toUserSession(this.store.users.get(refreshed.userId), this.store.devices.get(refreshed.deviceId), refreshed);
  }

  revokeDevice(userId, deviceId) {
    const device = this.store.devices.get(deviceId);
    if (!device || device.userId !== userId) return [];
    device.revokedAt = nowIso();
    for (const session of this.store.sessions.values()) {
      if (session.userId === userId && session.deviceId === deviceId) session.revokedAt = nowIso();
    }
    this.audit("device_revoked", { deviceId }, userId, deviceId);
    return this.listDevices(userId);
  }

  listDevices(userId) {
    return [...this.store.devices.values()].filter((device) => device.userId === userId);
  }

  bindAccount(userId, input) {
    const providerKey = `${input.provider}:${hashLike(input.identifier)}`;
    const taken = [...this.store.users.values()].find((user) => user.providerUidHash === providerKey && user.userId !== userId);
    if (taken && !input.mergeConfirmed) {
      return { conflict: true, provider: input.provider };
    }
    const profile = this.store.users.get(userId);
    Object.assign(profile, {
      bindingState: "bound",
      provider: input.provider,
      providerUidHash: providerKey,
      nickname: input.provider === "phone" ? `用户${String(input.identifier).slice(-4)}` : "绑定玩家",
      boundAt: nowIso()
    });
    this.audit("account_bound", { provider: input.provider }, userId);
    return { profile };
  }

  requestDeletion(userId) {
    const profile = this.store.users.get(userId);
    if (!profile) return null;
    profile.bindingState = "deleted";
    profile.deletionRequestedAt = nowIso();
    for (const session of this.store.sessions.values()) {
      if (session.userId === userId) session.revokedAt = nowIso();
    }
    this.audit("account_deleted", {}, userId);
    return profile;
  }

  getCloudSave(userId) {
    return this.store.cloudSaves.get(userId) || null;
  }

  putCloudSave(userId, input) {
    const current = this.getCloudSave(userId);
    if (current && input.baseVersion && input.baseVersion < current.version) {
      return { conflict: true, current };
    }
    const merged = mergeCloudSave(current, input.progress);
    const next = { userId, version: (current?.version || 0) + 1, ...merged, updatedAt: nowIso() };
    this.store.cloudSaves.set(userId, next);
    return { save: next };
  }

  wallet(userId) {
    return walletSnapshot(userId, ensureWallet(this.store, userId));
  }

  mutateWallet(userId, { source, sourceId, deltas }, { idempotencyKey }) {
    const payloadKey = JSON.stringify({ userId, source, sourceId, deltas });
    const existing = this.store.idempotency.get(idempotencyKey);
    if (existing) {
      if (existing.payloadKey !== payloadKey) {
        this.recordFraud(userId, "idempotency_conflict", { idempotencyKey, source, sourceId });
        const err = new Error("IDEMPOTENCY_CONFLICT");
        err.code = "IDEMPOTENCY_CONFLICT";
        throw err;
      }
      return existing.wallet;
    }
    const wallet = ensureWallet(this.store, userId);
    applyDeltas(wallet, deltas);
    const entry = {
      id: id("ledger"),
      userId,
      idempotencyKey,
      source,
      sourceId,
      deltas,
      balanceAfter: { ...wallet.balances },
      createdAt: nowIso()
    };
    this.store.ledgerEntries.push(entry);
    const snapshot = walletSnapshot(userId, wallet);
    this.store.idempotency.set(idempotencyKey, { payloadKey, wallet: snapshot, ledgerId: entry.id });
    this.audit("ledger_mutation", { source, sourceId, ledgerId: entry.id }, userId);
    return snapshot;
  }

  createOrder(userId, skuId, idempotencyKey) {
    const existing = [...this.store.orders.values()].find((order) => order.idempotencyKey === idempotencyKey);
    if (existing) return existing;
    const sku = this.store.catalog.find((item) => item.id === skuId && item.enabled);
    if (!sku) return null;
    const order = { id: id("order"), userId, skuId, amount: sku.amount, currency: sku.currency, provider: sku.provider, status: "created", idempotencyKey, createdAt: nowIso(), updatedAt: nowIso() };
    this.store.orders.set(order.id, order);
    this.audit("order_state_changed", { orderId: order.id, status: order.status }, userId);
    return order;
  }

  updateOrder(orderId, patch) {
    const order = this.store.orders.get(orderId);
    if (!order) return null;
    Object.assign(order, patch, { updatedAt: nowIso() });
    this.audit("order_state_changed", { orderId, status: order.status }, order.userId);
    return order;
  }

  issueAdToken(userId, placementId) {
    const placement = this.store.remoteConfig.adPlacements.find((item) => item.id === placementId && item.enabled);
    if (!placement) return null;
    const token = { token: id("adshow"), userId, placementId, rewardId: `${placementId}:reward`, expiresAt: Date.now() + 5 * 60 * 1000, consumedAt: undefined };
    this.store.adTokens.set(token.token, token);
    return token;
  }

  consumeAdToken(tokenId) {
    const token = this.store.adTokens.get(tokenId);
    if (!token || token.expiresAt <= Date.now()) return null;
    if (!token.consumedAt) token.consumedAt = nowIso();
    return token;
  }

  recordFraud(userId, kind, payload = {}, severity = "medium") {
    const signal = { id: id("fraud"), userId, kind, severity, payload, createdAt: nowIso() };
    this.store.fraudSignals.push(signal);
    return signal;
  }

  toUserSession(profile, device, session) {
    return {
      profile,
      device,
      token: {
        accessToken: session.accessToken,
        refreshToken: session.refreshToken,
        accessExpiresAt: session.accessExpiresAt,
        refreshExpiresAt: session.refreshExpiresAt
      },
      wallet: this.wallet(profile.userId),
      updatedAt: nowIso()
    };
  }
}

export function mergeCloudSave(current, incoming) {
  const perLevelStars = { ...(current?.perLevelStars || {}) };
  for (const [level, stars] of Object.entries(incoming?.perLevelStars || {})) {
    perLevelStars[level] = Math.max(Number(perLevelStars[level] || 0), Number(stars || 0));
  }
  return {
    maxUnlockedLevel: Math.max(Number(current?.maxUnlockedLevel || 1), Number(incoming?.maxUnlockedLevel || 1)),
    perLevelStars,
    settings: { ...(current?.settings || {}), ...(incoming?.settings || {}) }
  };
}

function hashLike(value) {
  return Buffer.from(String(value)).toString("base64url");
}
