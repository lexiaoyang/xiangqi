import { createMemoryStore } from "../db/memoryStore.mjs";
import { PlatformRepository } from "../repositories/platformRepository.mjs";
import { buildPlatformServices } from "../services/platformServices.mjs";

export function createPlatformApi(store = createMemoryStore()) {
  const repo = new PlatformRepository(store);
  const services = buildPlatformServices(repo);

  async function handle({ method, pathname, query = new URLSearchParams(), body = {} }) {
    const userId = body.userId || query.get("userId") || "server_guest";
    const token = body.refreshToken || query.get("refreshToken");

    if (method === "GET" && pathname === "/health") return ok({ status: "ok" });
    if (method === "POST" && pathname === "/api/platform/identity/guest") return ok(services.identity.guest(body));
    if (method === "POST" && pathname === "/api/platform/session/refresh") return ok(services.identity.refresh(token));
    if (method === "POST" && pathname === "/api/platform/identity/bind") return ok(services.identity.bind(userId, body));
    if (method === "POST" && pathname === "/api/platform/privacy/delete") return ok(services.identity.delete(userId));
    if (method === "GET" && pathname === "/api/platform/devices") return ok({ ok: true, devices: repo.listDevices(userId) });
    if (method === "POST" && pathname === "/api/platform/devices/revoke") return ok({ ok: true, devices: repo.revokeDevice(userId, body.deviceId) });
    if (method === "GET" && pathname === "/api/platform/cloud-save") return ok(services.cloudSave.get(userId));
    if (method === "PUT" && pathname === "/api/platform/cloud-save") return ok(services.cloudSave.put(userId, body));
    if (method === "GET" && pathname === "/api/platform/wallet") return ok(services.wallet.get(userId));
    if (method === "POST" && pathname === "/api/platform/wallet/grant") return ok(services.wallet.grant(userId, body, body.idempotencyKey));
    if (method === "POST" && pathname === "/api/platform/wallet/spend") return ok(services.wallet.spend(userId, body, body.idempotencyKey));
    if (method === "GET" && pathname === "/api/platform/catalog") return ok(services.payment.catalog());
    if (method === "POST" && pathname === "/api/platform/orders") return ok(services.payment.createOrder(userId, body.skuId, body.idempotencyKey));
    if (method === "POST" && pathname === "/api/platform/orders/verify") return ok(services.payment.verify(body.orderId, body.receipt));
    if (method === "POST" && pathname === "/api/platform/orders/fulfill") return ok(services.payment.fulfill(body.orderId));
    if (method === "POST" && pathname === "/api/platform/orders/refund") return ok(services.payment.refund(body.orderId));
    if (method === "GET" && pathname === "/api/platform/orders/restore") return ok(services.payment.restore(userId));
    if (method === "GET" && pathname === "/api/platform/ads/placements") return ok(services.ads.placements());
    if (method === "POST" && pathname === "/api/platform/ads/show-token") return ok(services.ads.showToken(userId, body.placementId));
    if (method === "POST" && pathname === "/api/platform/ads/complete") return ok(services.ads.complete(body.token, body.result));
    if (method === "GET" && pathname === "/api/platform/ads/pending") return ok(services.ads.pending(userId));
    if (method === "GET" && pathname === "/api/platform/rewards") return ok(services.rewardsEvents.rewardCenter(userId));
    if (method === "POST" && pathname === "/api/platform/rewards/claim") return ok(services.rewardsEvents.claimReward(userId, body.rewardId));
    if (method === "GET" && pathname === "/api/platform/events") return ok(services.rewardsEvents.eventCenter(userId));
    if (method === "POST" && pathname === "/api/platform/events/progress") return ok(services.rewardsEvents.ingestEventProgress(userId, body));
    if (method === "POST" && pathname === "/api/platform/events/claim") return ok(services.rewardsEvents.claimEventTask(userId, body.eventId, body.taskId));
    if (method === "POST" && pathname === "/api/platform/popups/impression") return ok(services.rewardsEvents.popupRecord(userId, body.popupId, false));
    if (method === "POST" && pathname === "/api/platform/popups/suppress") return ok(services.rewardsEvents.popupRecord(userId, body.popupId, true));
    if (method === "GET" && pathname === "/api/platform/config") return ok({ ok: true, config: { ...store.remoteConfig, fetchedAt: new Date().toISOString() } });
    if (method === "GET" && pathname === "/api/platform/consent") return ok({ ok: true, consent: store.consents.get(userId) || null });
    if (method === "POST" && pathname === "/api/platform/consent") return ok(services.compliance.updateConsent(userId, body.consent || body));
    if (method === "POST" && pathname === "/api/platform/analytics") return ok(services.compliance.analytics(body));
    if (method === "GET" && pathname === "/api/platform/privacy/export") return ok(services.compliance.exportUser(userId));
    return { status: 404, body: { ok: false, error: "not_found" } };
  }

  return { store, repo, services, handle };
}

export async function readJsonBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString("utf8");
  return raw ? JSON.parse(raw) : {};
}

export function sendJson(res, status, body, corsOrigin = "*") {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": corsOrigin,
    "Access-Control-Allow-Methods": "GET, POST, PUT, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization"
  });
  res.end(JSON.stringify(body));
}

function ok(result) {
  return { status: result.ok === false ? 400 : 200, body: result };
}
