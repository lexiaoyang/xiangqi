import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_REMOTE_CONFIG } from "./config";
import { createMockPlatformProviders } from "./mockProviders";
import { buildAnalyticsEvent, dashboardMetrics, evaluateSegment, isScheduledActive, loadLiveConfig, safeAnalyticsData, stableExperimentAssignment, trackEvent } from "./liveops";
import { PLATFORM_STORAGE_KEYS, readCache } from "./storage";

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("platform liveops and analytics", () => {
  it("loads valid config and evaluates feature flags", async () => {
    const providers = createMockPlatformProviders();
    const session = await providers.auth.ensureGuestSession();
    expect(session.ok).toBe(true);
    if (!session.ok) return;
    const config = await loadLiveConfig(session.data, providers);
    expect(config.ok).toBe(true);
    if (!config.ok) return;
    expect(config.data.version).toBeTruthy();
  });

  it("evaluates segments and schedules", () => {
    expect(evaluateSegment({ id: "progress", kind: "progress", operator: "gte", value: 10 }, { progress: 12 })).toBe(true);
    expect(evaluateSegment({ id: "payer", kind: "payer", operator: "eq", value: true }, { payer: false })).toBe(false);
    expect(isScheduledActive("2020-01-01T00:00:00.000Z", "2099-01-01T00:00:00.000Z")).toBe(true);
  });

  it("persists stable experiment assignments", async () => {
    const providers = createMockPlatformProviders({ experiments: [{ id: "shop_copy", variants: ["a", "b"], rollout: 100 }] });
    const session = await providers.auth.ensureGuestSession();
    expect(session.ok).toBe(true);
    if (!session.ok) return;
    const first = await stableExperimentAssignment(session.data, "shop_copy", providers);
    const second = await stableExperimentAssignment(session.data, "shop_copy", providers);
    expect(first.ok).toBe(true);
    expect(second.ok).toBe(true);
    if (!first.ok || !second.ok) return;
    expect(first.data?.variantId).toBe(second.data?.variantId);
  });

  it("sanitizes analytics payloads and emits dashboard metrics", async () => {
    const providers = createMockPlatformProviders();
    const session = await providers.auth.ensureGuestSession();
    expect(session.ok).toBe(true);
    if (!session.ok) return;
    const data = safeAnalyticsData({ levelId: 1, phone: "secret", receipt: "raw", won: true });
    expect(data.phone).toBeUndefined();
    const event = buildAnalyticsEvent("level_complete", session.data, DEFAULT_REMOTE_CONFIG, data);
    await trackEvent("level_complete", session.data, DEFAULT_REMOTE_CONFIG, data, providers);
    expect(dashboardMetrics([event]).levelEvents).toBe(1);
  });

  it("sends analytics to the backend endpoint when available", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal("fetch", fetchMock);
    const providers = createMockPlatformProviders();
    const session = await providers.auth.ensureGuestSession();
    expect(session.ok).toBe(true);
    if (!session.ok) return;

    const result = await trackEvent("shop_open", session.data, DEFAULT_REMOTE_CONFIG, { screen: "hub" }, providers);

    expect(result.ok).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const call = fetchMock.mock.calls[0];
    expect(call?.[0]).toBe("/api/platform/analytics");
    const body = JSON.parse(String((call?.[1] as RequestInit).body));
    expect(body.events[0]).toMatchObject({ name: "shop_open", source: "client", userId: session.data.profile.userId });
    expect(readCache(PLATFORM_STORAGE_KEYS.analyticsQueue, [])).toEqual([]);
  });

  it("buffers failed analytics events and flushes them later", async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce({ ok: false }).mockResolvedValueOnce({ ok: true });
    vi.stubGlobal("fetch", fetchMock);
    const providers = createMockPlatformProviders();
    const session = await providers.auth.ensureGuestSession();
    expect(session.ok).toBe(true);
    if (!session.ok) return;

    await trackEvent("shop_open", session.data, DEFAULT_REMOTE_CONFIG, { screen: "hub" }, providers);
    expect(readCache(PLATFORM_STORAGE_KEYS.analyticsQueue, [])).toHaveLength(1);

    const flushed = await providers.analytics.flush();

    expect(flushed.ok).toBe(true);
    if (!flushed.ok) return;
    expect(flushed.data).toBe(1);
    expect(readCache(PLATFORM_STORAGE_KEYS.analyticsQueue, [])).toEqual([]);
  });
});
