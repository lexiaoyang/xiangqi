import { createRequestId, err, ok, type ApiResult } from "./api";
import { DEFAULT_REMOTE_CONFIG } from "./config";
import { mockPlatformProviders } from "./mockProviders";
import type { PlatformProviders } from "./providers";
import { readCache, writeCache, PLATFORM_STORAGE_KEYS } from "./storage";
import type { Order, ProductCatalog, ProductSku, UserSession, WalletSnapshot } from "./types";

export type PurchaseFlowResult = {
  order: Order;
  wallet: WalletSnapshot;
  sku: ProductSku;
};

export type PaymentRiskState = {
  failedAttempts: number;
  refundCount: number;
  restricted: boolean;
  reason?: string;
};

export function purchasableSkus(catalog: ProductCatalog): ProductSku[] {
  return catalog.skus.filter((sku) => catalog.eligibility[sku.id]?.purchasable);
}

export function paymentRiskState(userId: string): PaymentRiskState {
  const state = readCache<Record<string, PaymentRiskState>>("platform:payment-risk:v1", {});
  return state[userId] ?? { failedAttempts: 0, refundCount: 0, restricted: false };
}

export function recordPaymentFailure(userId: string): PaymentRiskState {
  const all = readCache<Record<string, PaymentRiskState>>("platform:payment-risk:v1", {});
  const prev = paymentRiskState(userId);
  const next: PaymentRiskState = {
    ...prev,
    failedAttempts: prev.failedAttempts + 1,
    restricted: prev.failedAttempts + 1 >= 5,
    reason: prev.failedAttempts + 1 >= 5 ? "rapid_failed_payments" : prev.reason
  };
  writeCache("platform:payment-risk:v1", { ...all, [userId]: next });
  return next;
}

export async function loadCatalog(session: UserSession, providers: PlatformProviders = mockPlatformProviders): Promise<ApiResult<ProductCatalog>> {
  const config = await providers.config.getConfig(session);
  if (!config.ok) return config;
  return providers.payment.getCatalog(session, config.data);
}

export async function runMockPurchase(
  session: UserSession,
  skuId: string,
  providers: PlatformProviders = mockPlatformProviders
): Promise<ApiResult<PurchaseFlowResult>> {
  const config = await providers.config.getConfig(session);
  if (!config.ok) return config;
  const sku = config.data.catalog.find((item) => item.id === skuId);
  if (!sku) return err("NOT_FOUND", "商品不存在。");

  const orderResult = await providers.payment.createOrder(session, skuId, {
    requestId: createRequestId("order"),
    idempotencyKey: createRequestId("purchase")
  });
  if (!orderResult.ok) {
    recordPaymentFailure(session.profile.userId);
    return orderResult;
  }

  const receipt = await providers.payment.verifyReceipt(session, orderResult.data.order.id, {
    transactionId: createRequestId("txn"),
    provider: sku.provider
  });
  if (!receipt.ok || receipt.data.status !== "paid") {
    recordPaymentFailure(session.profile.userId);
    return receipt.ok ? err("VALIDATION_FAILED", "支付校验失败。") : receipt;
  }

  const fulfilled = await providers.payment.fulfillOrder(session, receipt.data.id, { requestId: createRequestId("fulfill") });
  if (!fulfilled.ok) return fulfilled;
  return ok({ order: fulfilled.data.order, wallet: fulfilled.data.wallet, sku });
}

export function pendingOrders(userId: string): Order[] {
  return readCache<Order[]>(PLATFORM_STORAGE_KEYS.orders, []).filter(
    (order) => order.userId === userId && ["created", "payment_started", "paid"].includes(order.status)
  );
}

export function refundMockOrder(orderId: string): ApiResult<Order> {
  const orders = readCache<Order[]>(PLATFORM_STORAGE_KEYS.orders, []);
  const order = orders.find((item) => item.id === orderId);
  if (!order) return err("NOT_FOUND", "订单不存在。");
  const refunded: Order = { ...order, status: "refunded", updatedAt: new Date().toISOString() };
  writeCache(PLATFORM_STORAGE_KEYS.orders, orders.map((item) => (item.id === order.id ? refunded : item)));
  return ok(refunded);
}

export function reconciliationIssues(): Array<{ id: string; orderId: string; reason: string }> {
  const orders = readCache<Order[]>(PLATFORM_STORAGE_KEYS.orders, []);
  return orders
    .filter((order) => order.status === "paid")
    .map((order) => ({ id: `recon:${order.id}`, orderId: order.id, reason: "paid_not_fulfilled" }));
}

export const fallbackCatalog: ProductCatalog = {
  version: DEFAULT_REMOTE_CONFIG.version,
  currency: "CNY",
  skus: DEFAULT_REMOTE_CONFIG.catalog,
  eligibility: Object.fromEntries(DEFAULT_REMOTE_CONFIG.catalog.map((sku) => [sku.id, { skuId: sku.id, purchasable: sku.enabled }])),
  fetchedAt: new Date(0).toISOString()
};
