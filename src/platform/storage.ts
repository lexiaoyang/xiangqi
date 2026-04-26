import { DEFAULT_REMOTE_CONFIG, validateRemoteConfig } from "./config";
import type { AudioSettings, ConsentState, EventCenterSnapshot, PopupDisplayRecord, RemoteConfig, RewardCenterSnapshot, UserSession, WalletSnapshot } from "./types";

export const PLATFORM_STORAGE_KEYS = {
  user: "platform:user:v1",
  wallet: "platform:wallet:v1",
  config: "platform:config:v1",
  rewardCenter: "platform:reward-center:v1",
  sync: "platform:sync:v1",
  consent: "platform:consent:v1",
  ledger: "platform:ledger:v1",
  orders: "platform:orders:v1",
  adCaps: "platform:ad-caps:v1",
  audioSettings: "platform:audio-settings:v1",
  eventCenter: "platform:event-center:v1",
  eventProgress: "platform:event-progress:v1",
  popupHistory: "platform:popup-history:v1",
  pendingAdRewards: "platform:pending-ad-rewards:v1",
  audits: "platform:audit:v1",
  analyticsQueue: "platform:analytics-queue:v1"
} as const;

export type PlatformStorageKey = keyof typeof PLATFORM_STORAGE_KEYS;

export type SyncCache = {
  cloudSaveStatus: "idle" | "syncing" | "failed" | "restricted";
  lastSyncAt?: string;
  lastError?: string;
};

export function readCache<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function writeCache<T>(key: string, value: T): T {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* localStorage can fail in private mode or quota exhaustion. */
  }
  return value;
}

export function removeCache(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}

export function readUserSession(): UserSession | null {
  return readCache<UserSession | null>(PLATFORM_STORAGE_KEYS.user, null);
}

export function writeUserSession(session: UserSession): UserSession {
  return writeCache(PLATFORM_STORAGE_KEYS.user, session);
}

export function readWalletCache(): WalletSnapshot | null {
  return readCache<WalletSnapshot | null>(PLATFORM_STORAGE_KEYS.wallet, null);
}

export function writeWalletCache(wallet: WalletSnapshot): WalletSnapshot {
  return writeCache(PLATFORM_STORAGE_KEYS.wallet, wallet);
}

export function readRemoteConfigCache(): RemoteConfig {
  const cached = readCache<RemoteConfig>(PLATFORM_STORAGE_KEYS.config, DEFAULT_REMOTE_CONFIG);
  return validateRemoteConfig(cached) ? cached : DEFAULT_REMOTE_CONFIG;
}

export function writeRemoteConfigCache(config: RemoteConfig): RemoteConfig {
  return writeCache(PLATFORM_STORAGE_KEYS.config, config);
}

export function readRewardCenterCache(): RewardCenterSnapshot | null {
  return readCache<RewardCenterSnapshot | null>(PLATFORM_STORAGE_KEYS.rewardCenter, null);
}

export function writeRewardCenterCache(snapshot: RewardCenterSnapshot): RewardCenterSnapshot {
  return writeCache(PLATFORM_STORAGE_KEYS.rewardCenter, snapshot);
}

export function readConsentCache(): ConsentState | null {
  return readCache<ConsentState | null>(PLATFORM_STORAGE_KEYS.consent, null);
}

export function writeConsentCache(consent: ConsentState): ConsentState {
  return writeCache(PLATFORM_STORAGE_KEYS.consent, consent);
}

export function readAudioSettingsCache(): AudioSettings | null {
  return readCache<AudioSettings | null>(PLATFORM_STORAGE_KEYS.audioSettings, null);
}

export function writeAudioSettingsCache(settings: AudioSettings): AudioSettings {
  return writeCache(PLATFORM_STORAGE_KEYS.audioSettings, settings);
}

export function readEventCenterCache(): EventCenterSnapshot | null {
  return readCache<EventCenterSnapshot | null>(PLATFORM_STORAGE_KEYS.eventCenter, null);
}

export function writeEventCenterCache(snapshot: EventCenterSnapshot): EventCenterSnapshot {
  return writeCache(PLATFORM_STORAGE_KEYS.eventCenter, snapshot);
}

export function readPopupHistoryCache(): Record<string, PopupDisplayRecord> {
  return readCache<Record<string, PopupDisplayRecord>>(PLATFORM_STORAGE_KEYS.popupHistory, {});
}

export function writePopupHistoryCache(history: Record<string, PopupDisplayRecord>): Record<string, PopupDisplayRecord> {
  return writeCache(PLATFORM_STORAGE_KEYS.popupHistory, history);
}
