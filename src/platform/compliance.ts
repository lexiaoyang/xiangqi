import { createRequestId, err, ok, type ApiResult } from "./api";
import { isModuleEnabled } from "./config";
import type { PlatformProviders } from "./providers";
import { runtimePlatformProviders } from "./runtimeProviders";
import { PLATFORM_STORAGE_KEYS, readCache, readConsentCache, writeCache, writeConsentCache } from "./storage";
import type { AuditEvent, ConsentState, RemoteConfig, UserSession } from "./types";

export const DEFAULT_PRIVACY_TERMS_VERSION = "privacy-2026-04";

export function defaultConsent(locale = "zh-CN"): ConsentState {
  return {
    privacyTermsVersion: DEFAULT_PRIVACY_TERMS_VERSION,
    analyticsConsent: false,
    adsPersonalizationConsent: false,
    locale,
    ageStatus: "unknown",
    updatedAt: new Date().toISOString()
  };
}

export function acceptPrivacy(consent: ConsentState = defaultConsent()): ConsentState {
  return writeConsentCache({
    ...consent,
    privacyAcceptedAt: new Date().toISOString(),
    analyticsConsent: true,
    adsPersonalizationConsent: true,
    updatedAt: new Date().toISOString()
  });
}

export function revokeOptionalConsent(consent: ConsentState): ConsentState {
  return writeConsentCache({
    ...consent,
    analyticsConsent: false,
    adsPersonalizationConsent: false,
    updatedAt: new Date().toISOString()
  });
}

export function canInitializeCommercialSdk(consent: ConsentState | null): boolean {
  return Boolean(consent?.privacyAcceptedAt);
}

export function minorRestrictedModules(consent: ConsentState | null): Array<"payments" | "ads" | "analytics"> {
  if (!consent || consent.ageStatus === "minor" || consent.ageStatus === "unknown") return ["payments", "ads", "analytics"];
  return [];
}

export function commercialGate(module: keyof RemoteConfig["flags"], session: UserSession | null, config: RemoteConfig, consent = readConsentCache()): ApiResult<{ allowed: boolean; reason?: string }> {
  if (!isModuleEnabled(config, module)) return ok({ allowed: false, reason: "feature_disabled" });
  if (!canInitializeCommercialSdk(consent) && module !== "account") return ok({ allowed: false, reason: "consent_required" });
  if (minorRestrictedModules(consent).includes(module as "payments" | "ads" | "analytics")) return ok({ allowed: false, reason: "minor_or_unknown_age" });
  if (session?.profile.bindingState === "deleted" || session?.profile.bindingState === "restricted") return ok({ allowed: false, reason: "account_restricted" });
  return ok({ allowed: true });
}

export function auditCommercialEvent(event: Omit<AuditEvent, "id" | "createdAt">): AuditEvent {
  const audit: AuditEvent = { ...event, id: createRequestId("audit"), createdAt: new Date().toISOString() };
  writeCache(PLATFORM_STORAGE_KEYS.audits, [...readCache<AuditEvent[]>(PLATFORM_STORAGE_KEYS.audits, []), audit]);
  return audit;
}

export function recordFraudSignal(userId: string, kind: string, payload: Record<string, unknown>) {
  const signals = readCache<Array<{ id: string; userId: string; kind: string; payload: Record<string, unknown>; createdAt: string }>>("platform:fraud-signals:v1", []);
  const signal = { id: createRequestId("fraud"), userId, kind, payload, createdAt: new Date().toISOString() };
  writeCache("platform:fraud-signals:v1", [...signals, signal]);
  return signal;
}

export function rateLimit(key: string, limit: number, windowMs: number, now = Date.now()): ApiResult<{ remaining: number; resetAt: number }> {
  const all = readCache<Record<string, number[]>>("platform:rate-limits:v1", {});
  const threshold = now - windowMs;
  const hits = (all[key] ?? []).filter((ts) => ts >= threshold);
  if (hits.length >= limit) {
    return err("RATE_LIMITED", "请求过于频繁，请稍后再试。", true, { resetAt: hits[0]! + windowMs });
  }
  const nextHits = [...hits, now];
  writeCache("platform:rate-limits:v1", { ...all, [key]: nextHits });
  return ok({ remaining: limit - nextHits.length, resetAt: now + windowMs });
}

export function exportUserData(session: UserSession, consent = readConsentCache()) {
  return {
    profile: session.profile,
    wallet: session.wallet,
    consent,
    exportedAt: new Date().toISOString()
  };
}

export async function updateConsentState(
  session: UserSession | null,
  consent: ConsentState,
  providers: PlatformProviders = runtimePlatformProviders
): Promise<ApiResult<ConsentState>> {
  auditCommercialEvent({
    type: "consent_changed",
    userId: session?.profile.userId,
    deviceId: session?.device.deviceId,
    requestId: createRequestId("consent"),
    payload: { privacyTermsVersion: consent.privacyTermsVersion, analyticsConsent: consent.analyticsConsent }
  });
  return providers.compliance.updateConsent(session, consent, { requestId: createRequestId("consent") });
}
