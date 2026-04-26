import { describe, expect, it } from "vitest";
import { createMockPlatformProviders } from "./mockProviders";
import { loadCatalog, paymentRiskState, pendingOrders, purchasableSkus, reconciliationIssues, recordPaymentFailure, refundMockOrder, runMockPurchase } from "./commerce";

describe("platform commerce", () => {
  it("loads catalog and filters purchasable SKUs", async () => {
    const providers = createMockPlatformProviders();
    const session = await providers.auth.ensureGuestSession();
    expect(session.ok).toBe(true);
    if (!session.ok) return;

    const catalog = await loadCatalog(session.data, providers);
    expect(catalog.ok).toBe(true);
    if (!catalog.ok) return;
    expect(purchasableSkus(catalog.data).length).toBeGreaterThan(0);
  });

  it("runs mock purchase through order, receipt, and fulfillment", async () => {
    const providers = createMockPlatformProviders();
    const session = await providers.auth.ensureGuestSession();
    expect(session.ok).toBe(true);
    if (!session.ok) return;

    const purchase = await runMockPurchase(session.data, "coins_pack_small", providers);
    expect(purchase.ok).toBe(true);
    if (!purchase.ok) return;
    expect(purchase.data.order.status).toBe("fulfilled");
    expect(purchase.data.wallet.balances.coins).toBeGreaterThanOrEqual(300);
  });

  it("reports pending reconciliation issues and refund state", async () => {
    const providers = createMockPlatformProviders();
    const session = await providers.auth.ensureGuestSession();
    expect(session.ok).toBe(true);
    if (!session.ok) return;

    const order = await providers.payment.createOrder(session.data, "coins_pack_small", { idempotencyKey: "pending-order" });
    expect(order.ok).toBe(true);
    if (!order.ok) return;
    const paid = await providers.payment.verifyReceipt(session.data, order.data.order.id, { transactionId: "txn-pending" });
    expect(paid.ok).toBe(true);
    expect(reconciliationIssues().some((issue) => issue.orderId === order.data.order.id)).toBe(true);
    expect(refundMockOrder(order.data.order.id).ok).toBe(true);
  });

  it("tracks payment risk after repeated failures", async () => {
    const userId = "risk-user";
    for (let i = 0; i < 5; i += 1) recordPaymentFailure(userId);
    expect(paymentRiskState(userId).restricted).toBe(true);
    expect(pendingOrders("none")).toEqual([]);
  });
});
