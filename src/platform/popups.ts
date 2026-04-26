import { ok, type ApiResult } from "./api";
import { DEFAULT_REMOTE_CONFIG, isModuleEnabled } from "./config";
import { PLATFORM_STORAGE_KEYS, readPopupHistoryCache, writeCache, writePopupHistoryCache } from "./storage";
import type { AnalyticsEvent, HomePopupConfig, PopupDisplayRecord, RemoteConfig, UserSession } from "./types";

const dayKey = () => new Date().toISOString().slice(0, 10);

export function eligibleHomePopups(config: RemoteConfig, now = Date.now()): HomePopupConfig[] {
  if (!isModuleEnabled(config, "homePopups")) return [];
  const history = readPopupHistoryCache();
  return config.homePopups
    .filter((popup) => popup.enabled && Date.parse(popup.startsAt) <= now && now < Date.parse(popup.endsAt))
    .filter((popup) => {
      const record = history[popup.id];
      if (!record || record.day !== dayKey()) return true;
      if (record.suppressedToday) return false;
      return record.impressions < popup.dailyCap;
    })
    .sort((a, b) => b.priority - a.priority);
}

export function selectHomePopup(config: RemoteConfig = DEFAULT_REMOTE_CONFIG): HomePopupConfig | null {
  return eligibleHomePopups(config)[0] ?? null;
}

export function recordPopupImpression(popup: HomePopupConfig, session: UserSession | null): PopupDisplayRecord {
  const history = readPopupHistoryCache();
  const prev = history[popup.id]?.day === dayKey() ? history[popup.id]! : { popupId: popup.id, day: dayKey(), impressions: 0, suppressedToday: false };
  const next = { ...prev, impressions: prev.impressions + 1, lastShownAt: new Date().toISOString() };
  writePopupHistoryCache({ ...history, [popup.id]: next });
  trackPopup("popup_exposed", popup, session, { impressions: next.impressions });
  return next;
}

export function suppressPopupToday(popup: HomePopupConfig, session: UserSession | null): PopupDisplayRecord {
  const history = readPopupHistoryCache();
  const prev = history[popup.id]?.day === dayKey() ? history[popup.id]! : { popupId: popup.id, day: dayKey(), impressions: 0, suppressedToday: false };
  const next = { ...prev, suppressedToday: true };
  writePopupHistoryCache({ ...history, [popup.id]: next });
  trackPopup("popup_suppressed_today", popup, session, {});
  return next;
}

export function closePopup(popup: HomePopupConfig, session: UserSession | null): ApiResult<void> {
  trackPopup("popup_closed", popup, session, {});
  return ok(undefined);
}

export function popupRewardText(popup: HomePopupConfig): string {
  return popup.rewardPreview.map((reward) => `${reward.kind}×${reward.amount}`).join(" / ");
}

function trackPopup(name: string, popup: HomePopupConfig, session: UserSession | null, data: AnalyticsEvent["data"]) {
  const queue = JSON.parse(localStorage.getItem(PLATFORM_STORAGE_KEYS.analyticsQueue) ?? "[]") as AnalyticsEvent[];
  writeCache(PLATFORM_STORAGE_KEYS.analyticsQueue, [
    ...queue,
    {
      name,
      userId: session?.profile.userId,
      deviceId: session?.device.deviceId,
      data: { popupId: popup.id, campaignId: popup.campaignId, priority: popup.priority, ...data },
      createdAt: new Date().toISOString()
    }
  ]);
}
