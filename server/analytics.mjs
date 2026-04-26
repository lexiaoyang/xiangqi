const DEFAULT_RECENT_LIMIT = 20;
const MAX_RECENT_LIMIT = 100;

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function stringValue(value, fallback = "") {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function sanitizeProperties(value) {
  if (!isPlainObject(value)) return {};
  const out = {};
  for (const [key, raw] of Object.entries(value)) {
    if (!["string", "number", "boolean"].includes(typeof raw) && raw !== null) continue;
    out[key] = typeof raw === "string" ? raw.slice(0, 160) : raw;
  }
  return out;
}

export function normalizeAnalyticsEvents(payload, receivedAt = new Date().toISOString()) {
  const rawEvents = Array.isArray(payload?.events) ? payload.events : [payload];
  if (rawEvents.length === 0) {
    return { ok: false, error: "analytics_events_empty" };
  }
  if (rawEvents.length > 100) {
    return { ok: false, error: "analytics_batch_too_large" };
  }

  const events = [];
  for (const raw of rawEvents) {
    if (!isPlainObject(raw)) {
      return { ok: false, error: "analytics_event_invalid" };
    }

    const name = stringValue(raw.name);
    const source = stringValue(raw.source);
    if (!name) return { ok: false, error: "analytics_name_required" };
    if (!source) return { ok: false, error: "analytics_source_required" };

    events.push({
      name,
      source,
      userId: stringValue(raw.userId) || undefined,
      deviceId: stringValue(raw.deviceId) || undefined,
      sessionId: stringValue(raw.sessionId) || undefined,
      configVersion: stringValue(raw.configVersion) || undefined,
      page: stringValue(raw.page) || undefined,
      data: sanitizeProperties(raw.data),
      createdAt: stringValue(raw.createdAt, receivedAt),
      receivedAt
    });
  }

  return { ok: true, events };
}

export function buildAnalyticsStats(events, options = {}) {
  const limit = Math.min(MAX_RECENT_LIMIT, Math.max(1, Number(options.limit || DEFAULT_RECENT_LIMIT)));
  const byName = {};
  const byPage = {};
  const bySource = {};
  const uniqueUsers = new Set();
  let firstReceivedAt;
  let lastReceivedAt;

  for (const event of events) {
    const name = stringValue(event?.name, "unknown");
    const page = stringValue(event?.page, "unknown");
    const source = stringValue(event?.source, "unknown");
    byName[name] = (byName[name] || 0) + 1;
    byPage[page] = (byPage[page] || 0) + 1;
    bySource[source] = (bySource[source] || 0) + 1;
    if (event?.userId) uniqueUsers.add(String(event.userId));
    const receivedAt = stringValue(event?.receivedAt || event?.createdAt);
    if (receivedAt && (!firstReceivedAt || receivedAt < firstReceivedAt)) firstReceivedAt = receivedAt;
    if (receivedAt && (!lastReceivedAt || receivedAt > lastReceivedAt)) lastReceivedAt = receivedAt;
  }

  return {
    total: events.length,
    uniqueUsers: uniqueUsers.size,
    byName,
    byPage,
    bySource,
    firstReceivedAt,
    lastReceivedAt,
    recent: events.slice(-limit).reverse()
  };
}
