import { describe, expect, it } from "vitest";
import { DEFAULT_REMOTE_CONFIG } from "./config";
import { createMockPlatformProviders } from "./mockProviders";
import { acceptPrivacy, auditCommercialEvent, canInitializeCommercialSdk, commercialGate, defaultConsent, exportUserData, minorRestrictedModules, rateLimit, recordFraudSignal, revokeOptionalConsent, updateConsentState } from "./compliance";

describe("platform compliance and safety", () => {
  it("gates SDK initialization behind consent", () => {
    expect(canInitializeCommercialSdk(defaultConsent())).toBe(false);
    const accepted = acceptPrivacy(defaultConsent());
    expect(canInitializeCommercialSdk(accepted)).toBe(true);
    expect(revokeOptionalConsent(accepted).analyticsConsent).toBe(false);
  });

  it("restricts minors and unknown age for commercial modules", async () => {
    const providers = createMockPlatformProviders();
    const session = await providers.auth.ensureGuestSession();
    expect(session.ok).toBe(true);
    if (!session.ok) return;
    expect(minorRestrictedModules(defaultConsent())).toContain("payments");
    const gate = commercialGate("payments", session.data, DEFAULT_REMOTE_CONFIG, defaultConsent());
    expect(gate.ok && gate.data.allowed).toBe(false);
  });

  it("records audit, fraud, rate limit, and export data", async () => {
    const providers = createMockPlatformProviders();
    const session = await providers.auth.ensureGuestSession();
    expect(session.ok).toBe(true);
    if (!session.ok) return;
    const audit = auditCommercialEvent({ type: "manual_grant", userId: session.data.profile.userId, requestId: "r", payload: { reason: "test" } });
    expect(audit.id).toMatch(/^audit_/);
    expect(recordFraudSignal(session.data.profile.userId, "wallet_anomaly", {}).kind).toBe("wallet_anomaly");
    expect(rateLimit("claim", 1, 1000).ok).toBe(true);
    expect(rateLimit("claim", 1, 1000).ok).toBe(false);
    expect(exportUserData(session.data).profile.userId).toBe(session.data.profile.userId);
  });

  it("persists consent through provider contract", async () => {
    const providers = createMockPlatformProviders();
    const session = await providers.auth.ensureGuestSession();
    expect(session.ok).toBe(true);
    if (!session.ok) return;
    const result = await updateConsentState(session.data, acceptPrivacy(defaultConsent()), providers);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.privacyAcceptedAt).toBeTruthy();
  });
});
