import { describe, expect, it } from "vitest";
import { DEFAULT_REMOTE_CONFIG, isModuleEnabled } from "./config";
import { createRequestId, err, ok, unwrap } from "./api";
import { createMockPlatformProviders } from "./mockProviders";
import { PLATFORM_STORAGE_KEYS, readCache, writeCache } from "./storage";

describe("platform foundations", () => {
  it("wraps normalized API results", () => {
    expect(unwrap(ok({ value: 1 }))).toEqual({ value: 1 });
    const failed = err("FEATURE_DISABLED", "disabled");
    expect(failed.ok).toBe(false);
    expect(() => unwrap(failed)).toThrow("disabled");
    expect(createRequestId("x")).toMatch(/^x_/);
  });

  it("provides local cache namespaces", () => {
    writeCache(PLATFORM_STORAGE_KEYS.sync, { cloudSaveStatus: "idle" });
    expect(readCache(PLATFORM_STORAGE_KEYS.sync, null)).toEqual({ cloudSaveStatus: "idle" });
  });

  it("evaluates feature flags and kill switches", () => {
    expect(isModuleEnabled(DEFAULT_REMOTE_CONFIG, "payments")).toBe(true);
    expect(isModuleEnabled({ ...DEFAULT_REMOTE_CONFIG, killSwitches: { payments: true } }, "payments")).toBe(false);
  });

  it("creates a reusable mock provider bundle", async () => {
    const providers = createMockPlatformProviders();
    const sessionResult = await providers.auth.ensureGuestSession();
    expect(sessionResult.ok).toBe(true);
    if (!sessionResult.ok) return;

    const config = await providers.config.getConfig(sessionResult.data);
    expect(config.ok).toBe(true);
    if (!config.ok) return;

    const catalog = await providers.payment.getCatalog(sessionResult.data, config.data);
    expect(catalog.ok).toBe(true);
    if (!catalog.ok) return;
    expect(catalog.data.skus.length).toBeGreaterThan(0);
  });
});
