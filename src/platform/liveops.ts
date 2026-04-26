import { createRequestId, type ApiResult } from "./api";
import { DEFAULT_REMOTE_CONFIG, isModuleEnabled, validateRemoteConfig } from "./config";
import type { PlatformProviders } from "./providers";
import { runtimePlatformProviders } from "./runtimeProviders";
import { PLATFORM_STORAGE_KEYS, readCache, writeCache } from "./storage";
import type { AnalyticsEvent, ExperimentAssignment, RemoteConfig, SegmentRule, UserSession } from "./types";

export function safeAnalyticsData(data: Record<string, unknown>): AnalyticsEvent["data"] {
  const blocked = new Set(["email", "phone", "receipt", "rawReceipt", "paymentCredential", "advertisingId"]);
  const out: AnalyticsEvent["data"] = {};
  for (const [key, value] of Object.entries(data)) {
    if (blocked.has(key)) continue;
    if (["string", "number", "boolean"].includes(typeof value) || value == null) out[key] = value as string | number | boolean | null | undefined;
  }
  return out;
}

export function buildAnalyticsEvent(
  name: string,
  session: UserSession | null,
  config: RemoteConfig,
  data: Record<string, unknown>
): AnalyticsEvent {
  const page = typeof window === "undefined" ? undefined : `${window.location.pathname}${window.location.hash}`;
  return {
    name,
    source: "client",
    userId: session?.profile.userId,
    deviceId: session?.device.deviceId,
    configVersion: config.version,
    page,
    data: safeAnalyticsData(data),
    createdAt: new Date().toISOString()
  };
}

export async function loadLiveConfig(session: UserSession | null, providers: PlatformProviders = runtimePlatformProviders): Promise<ApiResult<RemoteConfig>> {
  const result = await providers.config.getConfig(session);
  if (!result.ok) {
    writeCache(PLATFORM_STORAGE_KEYS.config, DEFAULT_REMOTE_CONFIG);
    return result;
  }
  const config = validateRemoteConfig(result.data) ? result.data : DEFAULT_REMOTE_CONFIG;
  writeCache(PLATFORM_STORAGE_KEYS.config, config);
  return { ...result, data: config };
}

export function evaluateSegment(rule: SegmentRule, context: Record<string, string | number | boolean>): boolean {
  const actual = context[rule.kind];
  switch (rule.operator) {
    case "eq":
      return actual === rule.value;
    case "neq":
      return actual !== rule.value;
    case "gte":
      return Number(actual) >= Number(rule.value);
    case "lte":
      return Number(actual) <= Number(rule.value);
    case "in":
      return Array.isArray(rule.value) && rule.value.includes(actual);
  }
}

export async function stableExperimentAssignment(
  session: UserSession,
  experimentId: string,
  providers: PlatformProviders = runtimePlatformProviders
): Promise<ApiResult<ExperimentAssignment | null>> {
  const key = `platform:experiment:${session.profile.userId}:${experimentId}`;
  const cached = readCache<ExperimentAssignment | null>(key, null);
  if (cached) return { ok: true, data: cached, requestId: createRequestId("experiment") };
  const assigned = await providers.config.assignExperiment(session, experimentId, { requestId: createRequestId("experiment") });
  if (assigned.ok && assigned.data) writeCache(key, assigned.data);
  return assigned;
}

export function isScheduledActive(startAt: string, endAt: string, now = Date.now()): boolean {
  return Date.parse(startAt) <= now && now < Date.parse(endAt);
}

export async function trackEvent(
  name: string,
  session: UserSession | null,
  config: RemoteConfig,
  data: Record<string, unknown>,
  providers: PlatformProviders = runtimePlatformProviders
): Promise<ApiResult<void>> {
  if (!isModuleEnabled(config, "analytics")) return { ok: true, data: undefined, requestId: createRequestId("analytics-disabled") };
  return providers.analytics.track(buildAnalyticsEvent(name, session, config, data));
}

export async function flushAnalytics(providers: PlatformProviders = runtimePlatformProviders): Promise<ApiResult<number>> {
  return providers.analytics.flush({ requestId: createRequestId("analytics-flush") });
}

export function dashboardMetrics(events: AnalyticsEvent[]) {
  return {
    dauUsers: new Set(events.map((event) => event.userId).filter(Boolean)).size,
    purchaseEvents: events.filter((event) => event.name.startsWith("purchase_")).length,
    adEvents: events.filter((event) => event.name.startsWith("ad_")).length,
    rewardEvents: events.filter((event) => event.name.startsWith("reward_")).length,
    levelEvents: events.filter((event) => event.name === "level_complete").length
  };
}
