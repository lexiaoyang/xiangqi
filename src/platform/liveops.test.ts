import { describe, expect, it } from "vitest";
import { DEFAULT_REMOTE_CONFIG } from "./config";
import { createMockPlatformProviders } from "./mockProviders";
import { buildAnalyticsEvent, dashboardMetrics, evaluateSegment, isScheduledActive, loadLiveConfig, safeAnalyticsData, stableExperimentAssignment, trackEvent } from "./liveops";

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
});
