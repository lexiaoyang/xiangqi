import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT || 8787);
const dataDir = path.join(__dirname, "data");
const runsFile = path.join(dataDir, "runs.jsonl");
const platformFile = path.join(dataDir, "platform.json");

function ensureDataFile() {
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  if (!fs.existsSync(runsFile)) fs.writeFileSync(runsFile, "", "utf8");
  if (!fs.existsSync(platformFile)) fs.writeFileSync(platformFile, JSON.stringify(defaultPlatformState(), null, 2), "utf8");
}

function defaultPlatformState() {
  return {
    users: {},
    wallets: {},
    ledgers: [],
    orders: [],
    adShows: {},
    rewards: {},
    config: {
      version: "server-mock-v1",
      schemaVersion: 1,
      flags: { account: "enabled", payments: "enabled", ads: "enabled", rewards: "enabled", analytics: "enabled", experiments: "enabled", audio: "enabled", events: "enabled", homePopups: "enabled", adOffers: "enabled" },
      killSwitches: {},
      catalog: [
        { id: "coins_pack_small", title: "金币小袋", description: "300 金币", priceLabel: "¥6", amount: 6, currency: "CNY", provider: "mock", contents: [{ kind: "coins", amount: 300 }], enabled: true, tags: ["coins"], limit: { kind: "none", max: 0 } },
        { id: "stamina_bundle", title: "体力补给", description: "10 体力 + 1 提示", priceLabel: "¥8", amount: 8, currency: "CNY", provider: "mock", contents: [{ kind: "stamina", amount: 10 }, { kind: "hint", amount: 1 }], enabled: true, tags: ["stamina"], limit: { kind: "daily", max: 3 } }
      ],
      adPlacements: [
        { id: "reward_stamina", format: "rewarded", enabled: true, label: "看广告领体力", rewards: [{ kind: "stamina", amount: 3 }], cooldownSec: 120, dailyCap: 8, sessionCap: 3 },
        { id: "reward_hint", format: "rewarded", enabled: true, label: "看广告得提示", rewards: [{ kind: "hint", amount: 1 }], cooldownSec: 120, dailyCap: 6, sessionCap: 3 }
      ],
      audio: {
        enabled: true,
        defaultVolume: 0.42,
        bgm: { home: "home_lobby_synth", lobby: "lobby_synth", activity: "activity_synth", shop: "shop_synth", rewards: "reward_synth", gameplay: "gameplay_synth" },
        sfx: { tap: "tap_blip", reward_claim: "reward_chime", purchase_success: "purchase_fanfare", ad_start: "ad_start", ad_complete: "ad_complete", popup_open: "popup_open", failure: "failure_buzz" }
      },
      events: [
        {
          id: "star_gate_sprint",
          title: "星门冲刺",
          subtitle: "限时闯关赢补给",
          description: "完成闯关任务，领取体力、金币和提示补给。",
          visual: { emoji: "🚀", theme: "violet" },
          startsAt: "2020-01-01T00:00:00.000Z",
          endsAt: "2099-12-31T23:59:59.000Z",
          priority: 100,
          enabled: true,
          tasks: [
            { id: "clear_3_levels", kind: "level_clear", title: "通关 3 次", target: 3, progress: 0, rewards: [{ kind: "coins", amount: 120 }], state: "in_progress" },
            { id: "watch_1_ad", kind: "ad_watch", title: "看 1 次广告补给", target: 1, progress: 0, rewards: [{ kind: "hint", amount: 1 }], state: "in_progress" }
          ],
          rewards: [{ kind: "stamina", amount: 5 }],
          cta: { kind: "ad_offer", targetId: "stamina_home", label: "看广告拿补给" }
        }
      ],
      homePopups: [
        { id: "popup_star_gate", campaignId: "star_gate_sprint", title: "星门冲刺开启", subtitle: "看广告领体力，冲击更高关卡", visualEmoji: "🚀", rewardPreview: [{ kind: "stamina", amount: 3 }, { kind: "hint", amount: 1 }], priority: 100, startsAt: "2020-01-01T00:00:00.000Z", endsAt: "2099-12-31T23:59:59.000Z", dailyCap: 1, enabled: true, ctaLabel: "立即领补给", target: { kind: "ad_offer", offerId: "stamina_home" }, disclosure: "ad" }
      ],
      rewardedAdOffers: [
        { id: "stamina_home", placementId: "reward_stamina", surface: "home", title: "看广告领体力", subtitle: "补充 3 点体力，继续闯关", icon: "⚡", ctaText: "看广告 +3", disclosureText: "观看完整广告后获得体力", rewards: [{ kind: "stamina", amount: 3 }], cooldownSec: 120, dailyCap: 8, sessionCap: 3, priority: 100, enabled: true },
        { id: "hint_home", placementId: "reward_hint", surface: "home", title: "看广告得提示", subtitle: "迷路时拿 1 个提示", icon: "💡", ctaText: "看广告 +1", disclosureText: "观看完整广告后获得提示", rewards: [{ kind: "hint", amount: 1 }], cooldownSec: 120, dailyCap: 6, sessionCap: 3, priority: 90, enabled: true }
      ],
      rewards: [
        { id: "daily_signin_1", kind: "sign_in", title: "每日签到", description: "每天登录领取金币", rewards: [{ kind: "coins", amount: 50 }], state: "claimable" },
        { id: "task_clear_3", kind: "daily_task", title: "闯关 3 次", description: "完成 3 个关卡", rewards: [{ kind: "coins", amount: 80 }], state: "in_progress", progress: { current: 0, target: 3 } }
      ],
      experiments: [],
      fetchedAt: new Date(0).toISOString()
    },
    analytics: [],
    popupHistory: {},
    eventProgress: {},
    pendingAdRewards: [],
    consents: {},
    audits: [],
    safety: { rateLimits: {}, fraudSignals: [] }
  };
}

function readPlatformState() {
  ensureDataFile();
  try {
    const defaults = defaultPlatformState();
    const parsed = JSON.parse(fs.readFileSync(platformFile, "utf8"));
    return { ...defaults, ...parsed, config: { ...defaults.config, ...(parsed.config || {}) } };
  } catch {
    return defaultPlatformState();
  }
}

function writePlatformState(state) {
  ensureDataFile();
  fs.writeFileSync(platformFile, JSON.stringify(state, null, 2), "utf8");
}

function randomId(prefix) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}_${Date.now().toString(36)}`;
}

function nowIso() {
  return new Date().toISOString();
}

function walletFor(state, userId) {
  if (!state.wallets[userId]) {
    state.wallets[userId] = {
      userId,
      balances: { coins: 120, stamina: 24, hint: 0, undo: 0, ticket: 0, premium: 0 },
      ledgerCursor: "0",
      syncState: "online",
      reconciliation: { state: "clean", issueCount: 0 },
      updatedAt: nowIso()
    };
  }
  return state.wallets[userId];
}

function mutateWallet(state, userId, source, sourceId, deltas, idempotencyKey = randomId("idem")) {
  const existing = state.ledgers.find((entry) => entry.idempotencyKey === idempotencyKey);
  if (existing) return walletFor(state, userId);
  const wallet = walletFor(state, userId);
  for (const delta of deltas) wallet.balances[delta.kind] = Math.max(0, (wallet.balances[delta.kind] || 0) + delta.amount);
  wallet.ledgerCursor = String(Number(wallet.ledgerCursor || "0") + 1);
  wallet.updatedAt = nowIso();
  state.ledgers.push({ id: randomId("ledger"), userId, idempotencyKey, source, sourceId, deltas, balanceAfter: wallet.balances, createdAt: nowIso() });
  return wallet;
}

function readAllRuns() {
  ensureDataFile();
  const raw = fs.readFileSync(runsFile, "utf8").trim();
  if (!raw) return [];
  const lines = raw.split("\n");
  const out = [];
  for (const line of lines) {
    if (!line.trim()) continue;
    try {
      out.push(JSON.parse(line));
    } catch {
      /* skip bad line */
    }
  }
  return out;
}

function appendRun(record) {
  ensureDataFile();
  fs.appendFileSync(runsFile, `${JSON.stringify(record)}\n`, "utf8");
}

function buildLeaderboard(rows, query) {
  const sceneId = query.get("sceneId") || "";
  const difficulty = query.get("difficulty") || "";
  const mode = query.get("mode") || "ranked";
  const sort = query.get("sort") === "steps" ? "steps" : "durationMs";
  const limit = Math.min(100, Math.max(1, Number(query.get("limit") || 20)));

  const filtered = rows.filter(
    (r) =>
      r &&
      r.won === true &&
      r.mode === mode &&
      r.sceneId === sceneId &&
      r.difficulty === difficulty
  );

  const byPlayer = new Map();
  for (const r of filtered) {
    const pid = String(r.clientPlayerId || "anon");
    const cur = byPlayer.get(pid);
    if (!cur) {
      byPlayer.set(pid, r);
      continue;
    }
    const better =
      sort === "steps"
        ? r.steps < cur.steps || (r.steps === cur.steps && r.durationMs < cur.durationMs)
        : r.durationMs < cur.durationMs || (r.durationMs === cur.durationMs && r.steps < cur.steps);
    if (better) byPlayer.set(pid, r);
  }

  const list = [...byPlayer.values()];
  list.sort((a, b) => {
    if (sort === "steps") {
      if (a.steps !== b.steps) return a.steps - b.steps;
      return a.durationMs - b.durationMs;
    }
    if (a.durationMs !== b.durationMs) return a.durationMs - b.durationMs;
    return a.steps - b.steps;
  });

  return list.slice(0, limit).map((r, i) => ({
    rank: i + 1,
    durationMs: r.durationMs,
    steps: r.steps,
    sceneId: r.sceneId,
    difficulty: r.difficulty,
    mode: r.mode,
    playedAt: r.playedAt,
    clientPlayerId: r.clientPlayerId
  }));
}

function sendJson(res, status, body) {
  const json = JSON.stringify(body);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  });
  res.end(json);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || "/", `http://127.0.0.1:${PORT}`);

  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    });
    res.end();
    return;
  }

  if (req.method === "GET" && url.pathname === "/api/leaderboard") {
    const rows = readAllRuns();
    const rowsOut = buildLeaderboard(rows, url.searchParams);
    sendJson(res, 200, { rows: rowsOut });
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/runs") {
    try {
      const raw = await readBody(req);
      const record = JSON.parse(raw);
      appendRun(record);
      sendJson(res, 201, { ok: true });
    } catch {
      sendJson(res, 400, { ok: false, error: "invalid_json" });
    }
    return;
  }

  if (url.pathname.startsWith("/api/platform/")) {
    const state = readPlatformState();
    const userId = url.searchParams.get("userId") || "server_guest";

    try {
      if (req.method === "POST" && url.pathname === "/api/platform/identity/guest") {
        const id = randomId("user");
        const session = {
          profile: { userId: id, guestId: randomId("guest"), nickname: "游客玩家", bindingState: "guest", provider: "guest", createdAt: nowIso() },
          token: { accessToken: randomId("atk"), refreshToken: randomId("rtk"), accessExpiresAt: Date.now() + 600000, refreshExpiresAt: Date.now() + 1209600000 },
          device: { deviceId: randomId("dev"), platform: "web", appVersion: "0.1.0", firstSeenAt: nowIso(), lastSeenAt: nowIso() },
          wallet: walletFor(state, id),
          updatedAt: nowIso()
        };
        state.users[id] = session;
        state.audits.push({ id: randomId("audit"), type: "account_created", userId: id, requestId: randomId("req"), payload: {}, createdAt: nowIso() });
        writePlatformState(state);
        sendJson(res, 201, { ok: true, session });
        return;
      }

      if (req.method === "GET" && url.pathname === "/api/platform/wallet") {
        sendJson(res, 200, { ok: true, wallet: walletFor(state, userId) });
        return;
      }

      if (req.method === "POST" && url.pathname === "/api/platform/wallet/ledger") {
        const body = JSON.parse(await readBody(req));
        const wallet = mutateWallet(state, userId, body.source || "manual_grant", body.sourceId || "api", body.deltas || [], body.idempotencyKey);
        writePlatformState(state);
        sendJson(res, 200, { ok: true, wallet });
        return;
      }

      if (req.method === "GET" && url.pathname === "/api/platform/config") {
        sendJson(res, 200, { ok: true, config: { ...state.config, fetchedAt: nowIso() } });
        return;
      }

      if (req.method === "GET" && url.pathname === "/api/platform/catalog") {
        sendJson(res, 200, { ok: true, catalog: { version: state.config.version, currency: "CNY", skus: state.config.catalog, eligibility: Object.fromEntries(state.config.catalog.map((sku) => [sku.id, { skuId: sku.id, purchasable: sku.enabled }])), fetchedAt: nowIso() } });
        return;
      }

      if (req.method === "POST" && url.pathname === "/api/platform/orders") {
        const body = JSON.parse(await readBody(req));
        const sku = state.config.catalog.find((item) => item.id === body.skuId);
        if (!sku) {
          sendJson(res, 404, { ok: false, error: "sku_not_found" });
          return;
        }
        const existing = state.orders.find((order) => order.idempotencyKey === body.idempotencyKey);
        const order = existing || { id: randomId("order"), userId, skuId: sku.id, amount: sku.amount, currency: sku.currency, provider: sku.provider, status: "created", idempotencyKey: body.idempotencyKey || randomId("idem"), createdAt: nowIso(), updatedAt: nowIso() };
        if (!existing) state.orders.push(order);
        writePlatformState(state);
        sendJson(res, 201, { ok: true, order, action: { kind: "sdk", provider: "mock", payload: { orderId: order.id } } });
        return;
      }

      if (req.method === "POST" && url.pathname === "/api/platform/orders/verify") {
        const body = JSON.parse(await readBody(req));
        const order = state.orders.find((item) => item.id === body.orderId);
        if (!order) {
          sendJson(res, 404, { ok: false, error: "order_not_found" });
          return;
        }
        order.status = body.invalid ? "verification_failed" : "paid";
        order.providerTransactionId = body.transactionId || randomId("txn");
        order.updatedAt = nowIso();
        writePlatformState(state);
        sendJson(res, 200, { ok: true, order });
        return;
      }

      if (req.method === "POST" && url.pathname === "/api/platform/orders/fulfill") {
        const body = JSON.parse(await readBody(req));
        const order = state.orders.find((item) => item.id === body.orderId);
        const sku = order && state.config.catalog.find((item) => item.id === order.skuId);
        if (!order || !sku || order.status !== "paid") {
          sendJson(res, 400, { ok: false, error: "order_not_fulfillable" });
          return;
        }
        const wallet = mutateWallet(state, order.userId, "purchase", order.id, sku.contents, `fulfill:${order.id}`);
        order.status = "fulfilled";
        order.fulfillmentLedgerId = wallet.ledgerCursor;
        order.updatedAt = nowIso();
        writePlatformState(state);
        sendJson(res, 200, { ok: true, order, wallet });
        return;
      }

      if (req.method === "GET" && url.pathname === "/api/platform/orders/restore") {
        sendJson(res, 200, { ok: true, orders: state.orders.filter((order) => order.userId === userId && ["paid", "fulfilled"].includes(order.status)) });
        return;
      }

      if (req.method === "GET" && url.pathname === "/api/platform/ads/placements") {
        sendJson(res, 200, { ok: true, placements: state.config.adPlacements.filter((item) => item.enabled) });
        return;
      }

      if (req.method === "POST" && url.pathname === "/api/platform/ads/show-token") {
        const body = JSON.parse(await readBody(req));
        const token = { token: randomId("adshow"), placementId: body.placementId, userId, rewardId: `${body.placementId}:reward`, expiresAt: Date.now() + 300000 };
        state.adShows[token.token] = token;
        writePlatformState(state);
        sendJson(res, 201, { ok: true, token });
        return;
      }

      if (req.method === "POST" && url.pathname === "/api/platform/ads/complete") {
        const body = JSON.parse(await readBody(req));
        const token = state.adShows[body.token];
        const placement = token && state.config.adPlacements.find((item) => item.id === token.placementId);
        if (!token || !placement || token.expiresAt <= Date.now()) {
          sendJson(res, 400, { ok: false, error: "invalid_ad_token" });
          return;
        }
        const wallet = mutateWallet(state, token.userId, "ad_reward", token.token, placement.rewards, `ad:${token.token}`);
        token.consumedAt = nowIso();
        writePlatformState(state);
        sendJson(res, 200, { ok: true, wallet });
        return;
      }

      if (req.method === "GET" && url.pathname === "/api/platform/rewards") {
        const rewards = state.rewards[userId] || state.config.rewards;
        sendJson(res, 200, { ok: true, rewardCenter: { userId, rewards, claimableCount: rewards.filter((reward) => reward.state === "claimable").length, serverDay: nowIso().slice(0, 10), updatedAt: nowIso() } });
        return;
      }

      if (req.method === "GET" && url.pathname === "/api/platform/events") {
        const events = state.eventProgress[userId] || state.config.events;
        sendJson(res, 200, { ok: true, eventCenter: { userId, events, claimableCount: events.reduce((sum, event) => sum + event.tasks.filter((task) => task.state === "claimable").length, 0), updatedAt: nowIso() } });
        return;
      }

      if (req.method === "POST" && url.pathname === "/api/platform/events/progress") {
        const body = JSON.parse(await readBody(req));
        if (Number(body.amount || 1) > 20) {
          state.safety.fraudSignals.push({ userId, kind: "event_progress", payload: body, createdAt: nowIso() });
          writePlatformState(state);
          sendJson(res, 400, { ok: false, error: "implausible_progress" });
          return;
        }
        const events = state.eventProgress[userId] || structuredClone(state.config.events);
        for (const event of events) {
          for (const task of event.tasks) {
            if (task.kind !== body.kind || task.state === "claimed") continue;
            task.progress = Math.min(task.target, task.progress + Number(body.amount || 1));
            if (task.progress >= task.target) task.state = "claimable";
          }
        }
        state.eventProgress[userId] = events;
        writePlatformState(state);
        sendJson(res, 200, { ok: true, eventCenter: { userId, events, claimableCount: events.reduce((sum, event) => sum + event.tasks.filter((task) => task.state === "claimable").length, 0), updatedAt: nowIso() } });
        return;
      }

      if (req.method === "POST" && url.pathname === "/api/platform/events/claim") {
        const body = JSON.parse(await readBody(req));
        const events = state.eventProgress[userId] || structuredClone(state.config.events);
        const event = events.find((item) => item.id === body.eventId);
        const task = event && event.tasks.find((item) => item.id === body.taskId);
        if (!event || !task || task.state !== "claimable") {
          sendJson(res, 400, { ok: false, error: "event_task_not_claimable" });
          return;
        }
        const wallet = mutateWallet(state, userId, "event", `${event.id}:${task.id}`, task.rewards, `event:${userId}:${event.id}:${task.id}`);
        task.state = "claimed";
        state.eventProgress[userId] = events;
        writePlatformState(state);
        sendJson(res, 200, { ok: true, event, task, wallet });
        return;
      }

      if (req.method === "POST" && url.pathname === "/api/platform/popups/impression") {
        const body = JSON.parse(await readBody(req));
        const day = nowIso().slice(0, 10);
        const key = `${userId}:${body.popupId}`;
        const prev = state.popupHistory[key] || { popupId: body.popupId, day, impressions: 0, suppressedToday: false };
        state.popupHistory[key] = { ...prev, day, impressions: prev.day === day ? prev.impressions + 1 : 1, lastShownAt: nowIso() };
        writePlatformState(state);
        sendJson(res, 202, { ok: true, record: state.popupHistory[key] });
        return;
      }

      if (req.method === "POST" && url.pathname === "/api/platform/popups/suppress") {
        const body = JSON.parse(await readBody(req));
        const day = nowIso().slice(0, 10);
        const key = `${userId}:${body.popupId}`;
        const prev = state.popupHistory[key] || { popupId: body.popupId, day, impressions: 0, suppressedToday: false };
        state.popupHistory[key] = { ...prev, day, suppressedToday: true };
        writePlatformState(state);
        sendJson(res, 202, { ok: true, record: state.popupHistory[key] });
        return;
      }

      if (req.method === "GET" && url.pathname === "/api/platform/ad-offers") {
        sendJson(res, 200, { ok: true, offers: state.config.rewardedAdOffers.filter((offer) => offer.enabled) });
        return;
      }

      if (req.method === "GET" && url.pathname === "/api/platform/ad-offers/pending") {
        sendJson(res, 200, { ok: true, pending: state.pendingAdRewards.filter((item) => item.userId === userId && item.expiresAt > Date.now()) });
        return;
      }

      if (req.method === "POST" && url.pathname === "/api/platform/rewards/claim") {
        const body = JSON.parse(await readBody(req));
        const rewards = state.rewards[userId] || state.config.rewards;
        const reward = rewards.find((item) => item.id === body.rewardId);
        if (!reward || reward.state !== "claimable") {
          sendJson(res, 400, { ok: false, error: "reward_not_claimable" });
          return;
        }
        const wallet = mutateWallet(state, userId, reward.kind, reward.id, reward.rewards, `reward:${userId}:${reward.id}`);
        reward.state = "claimed";
        state.rewards[userId] = rewards;
        writePlatformState(state);
        sendJson(res, 200, { ok: true, reward, wallet });
        return;
      }

      if (req.method === "POST" && url.pathname === "/api/platform/analytics") {
        const body = JSON.parse(await readBody(req));
        state.analytics.push({ ...body, createdAt: nowIso() });
        writePlatformState(state);
        sendJson(res, 202, { ok: true });
        return;
      }

      if (req.method === "POST" && url.pathname === "/api/platform/consent") {
        const body = JSON.parse(await readBody(req));
        state.consents[userId] = { ...body, updatedAt: nowIso() };
        writePlatformState(state);
        sendJson(res, 200, { ok: true, consent: state.consents[userId] });
        return;
      }

      if (req.method === "GET" && url.pathname === "/api/platform/audit") {
        sendJson(res, 200, { ok: true, audits: state.audits.slice(-100) });
        return;
      }
    } catch {
      sendJson(res, 400, { ok: false, error: "invalid_platform_request" });
      return;
    }
  }

  if (req.method === "GET" && url.pathname === "/health") {
    sendJson(res, 200, { ok: true });
    return;
  }

  sendJson(res, 404, { ok: false, error: "not_found" });
});

server.listen(PORT, () => {
  ensureDataFile();
  console.log(`maze history server http://127.0.0.1:${PORT}`);
});
