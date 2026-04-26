import { describe, expect, it } from "vitest";
import { createMemoryStore } from "../db/memoryStore.mjs";
import { createPlatformApi } from "../http/platformApi.mjs";

describe("real backend platform services", () => {
  it("bootstraps guest identity, wallet and cloud save", () => {
    const api = createPlatformApi(createMemoryStore());
    const result = api.services.identity.guest({ platform: "web", appVersion: "test" });

    expect(result.ok).toBe(true);
    expect(result.session.profile.bindingState).toBe("guest");
    expect(result.session.wallet.balances.stamina).toBeGreaterThan(0);
    expect(api.services.cloudSave.get(result.session.profile.userId).save.version).toBe(1);
    expect(api.store.auditEvents.some((event) => event.type === "account_created")).toBe(true);
  });

  it("merges cloud save progress by highest unlock and stars", () => {
    const api = createPlatformApi(createMemoryStore());
    const userId = api.services.identity.guest().session.profile.userId;

    expect(api.services.cloudSave.put(userId, { baseVersion: 1, progress: { maxUnlockedLevel: 4, perLevelStars: { "2": 2 } } }).ok).toBe(true);
    expect(api.services.cloudSave.put(userId, { baseVersion: 2, progress: { maxUnlockedLevel: 3, perLevelStars: { "2": 3, "3": 1 } } }).save).toMatchObject({
      maxUnlockedLevel: 4,
      perLevelStars: { "2": 3, "3": 1 }
    });
  });

  it("keeps wallet ledger idempotent and detects conflicts", () => {
    const api = createPlatformApi(createMemoryStore());
    const userId = api.services.identity.guest().session.profile.userId;
    const grant = { source: "test", sourceId: "a", deltas: [{ kind: "coins", amount: 20 }] };

    const first = api.services.wallet.grant(userId, grant, "same-key");
    const second = api.services.wallet.grant(userId, grant, "same-key");
    const conflict = api.services.wallet.grant(userId, { ...grant, sourceId: "b" }, "same-key");

    expect(first.ok).toBe(true);
    expect(second.wallet.balances.coins).toBe(first.wallet.balances.coins);
    expect(conflict).toEqual({ ok: false, error: "IDEMPOTENCY_CONFLICT" });
    expect(api.store.fraudSignals.some((signal) => signal.kind === "idempotency_conflict")).toBe(true);
  });

  it("creates, verifies, fulfills, restores and refunds a purchase order", () => {
    const api = createPlatformApi(createMemoryStore());
    const userId = api.services.identity.guest().session.profile.userId;

    const created = api.services.payment.createOrder(userId, "coins_pack_small", "order-key");
    expect(created.ok).toBe(true);
    expect(api.services.payment.verify(created.order.id, { transactionId: "txn_1" }).order.status).toBe("paid");
    const fulfilled = api.services.payment.fulfill(created.order.id);
    expect(fulfilled.order.status).toBe("fulfilled");
    expect(fulfilled.wallet.balances.coins).toBe(420);
    expect(api.services.payment.restore(userId).orders).toHaveLength(1);
    expect(api.services.payment.refund(created.order.id).order.status).toBe("refunded");
  });

  it("issues ad show tokens once and grants verified rewarded ads", () => {
    const api = createPlatformApi(createMemoryStore());
    const userId = api.services.identity.guest().session.profile.userId;
    const issued = api.services.ads.showToken(userId, "reward_hint");
    const cooldown = api.services.ads.showToken(userId, "reward_hint");

    expect(issued.ok).toBe(true);
    expect(cooldown.error).toBe("ad_cooldown");
    const completed = api.services.ads.complete(issued.token.token);
    const duplicate = api.services.ads.complete(issued.token.token);

    expect(completed.ok).toBe(true);
    expect(completed.wallet.balances.hint).toBe(1);
    expect(duplicate.wallet.balances.hint).toBe(1);
  });

  it("tracks event progress, blocks impossible progress and grants event rewards", () => {
    const api = createPlatformApi(createMemoryStore());
    const userId = api.services.identity.guest().session.profile.userId;

    expect(api.services.rewardsEvents.ingestEventProgress(userId, { kind: "level_clear", amount: 3 }).eventCenter.claimableCount).toBe(1);
    const claimed = api.services.rewardsEvents.claimEventTask(userId, "star_gate_sprint", "clear_3_levels");
    expect(claimed.ok).toBe(true);
    expect(claimed.wallet.balances.coins).toBe(240);
    expect(api.services.rewardsEvents.ingestEventProgress(userId, { kind: "level_clear", amount: 999 })).toEqual({ ok: false, error: "implausible_progress" });
  });

  it("persists popup frequency and enforces minor restrictions through compliance service", () => {
    const api = createPlatformApi(createMemoryStore());
    const userId = api.services.identity.guest().session.profile.userId;

    expect(api.services.rewardsEvents.popupRecord(userId, "spring_sale").record.impressions).toBe(1);
    expect(api.services.compliance.updateConsent(userId, { ageStatus: "minor", analyticsAllowed: false }).ok).toBe(true);
    expect(api.services.compliance.canUseModule(userId, "payments")).toEqual({ ok: true, allowed: false, reason: "minor_restricted" });
    expect(api.services.compliance.exportUser(userId).export.profile.userId).toBe(userId);
  });

  it("routes HTTP-shaped platform API requests", async () => {
    const api = createPlatformApi(createMemoryStore());
    const response = await api.handle({ method: "POST", pathname: "/api/platform/identity/guest", body: { platform: "web" } });

    expect(response.status).toBe(200);
    expect(response.body.session.profile.userId).toMatch(/^user_/);
  });
});
