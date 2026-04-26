export type ISODateString = string;
export type PlatformId = string;

export type CommercialModule = "account" | "payments" | "ads" | "rewards" | "analytics" | "experiments" | "audio" | "events" | "homePopups" | "adOffers";
export type CommercialMode = "enabled" | "disabled" | "restricted";
export type SyncState = "online" | "cached" | "syncing" | "failed" | "restricted";

export type AssetKind = "coins" | "stamina" | "hint" | "undo" | "ticket" | "premium";

export type AssetAmount = {
  kind: AssetKind;
  amount: number;
};

export type WalletBalances = Record<AssetKind, number>;

export type LedgerSource =
  | "campaign_clear"
  | "daily_sign_in"
  | "task"
  | "achievement"
  | "mail"
  | "gift_code"
  | "event"
  | "purchase"
  | "ad_reward"
  | "manual_grant"
  | "refund_reversal"
  | "stamina_spend"
  | "shop_spend";

export type LedgerEntry = {
  id: PlatformId;
  userId: PlatformId;
  idempotencyKey: string;
  source: LedgerSource;
  sourceId: string;
  deltas: AssetAmount[];
  balanceAfter: WalletBalances;
  createdAt: ISODateString;
  auditId?: PlatformId;
};

export type WalletSnapshot = {
  userId: PlatformId;
  balances: WalletBalances;
  ledgerCursor: string;
  syncState: SyncState;
  reconciliation: {
    state: "clean" | "pending" | "issue";
    issueCount: number;
    lastCheckedAt?: ISODateString;
  };
  updatedAt: ISODateString;
};

export type BindingState = "guest" | "bound" | "deleted" | "restricted";
export type LoginProvider = "guest" | "phone" | "wechat" | "apple" | "google";

export type UserProfile = {
  userId: PlatformId;
  guestId: PlatformId;
  nickname: string;
  bindingState: BindingState;
  provider?: LoginProvider;
  providerUid?: string;
  createdAt: ISODateString;
  boundAt?: ISODateString;
  deletionRequestedAt?: ISODateString;
};

export type SessionToken = {
  accessToken: string;
  refreshToken: string;
  accessExpiresAt: number;
  refreshExpiresAt: number;
};

export type DeviceInfo = {
  deviceId: PlatformId;
  platform: "web" | "webview" | "wechat" | "ios" | "android";
  appVersion: string;
  firstSeenAt: ISODateString;
  lastSeenAt: ISODateString;
  revokedAt?: ISODateString;
};

export type UserSession = {
  profile: UserProfile;
  token: SessionToken;
  device: DeviceInfo;
  wallet: WalletSnapshot;
  updatedAt: ISODateString;
};

export type CampaignCloudProgress = {
  maxUnlockedLevel: number;
  perLevelStars: Record<string, 0 | 1 | 2 | 3>;
  settings?: Record<string, unknown>;
  updatedAt: ISODateString;
};

export type PaymentProviderName = "mock" | "iap" | "wechat_pay" | "alipay" | "stripe";
export type OrderStatus =
  | "created"
  | "payment_started"
  | "paid"
  | "verification_failed"
  | "fulfilled"
  | "refunded"
  | "cancelled"
  | "review_required";

export type PurchaseLimit = {
  kind: "none" | "once" | "daily" | "weekly" | "monthly";
  max: number;
};

export type ProductSku = {
  id: string;
  title: string;
  description: string;
  priceLabel: string;
  amount: number;
  currency: string;
  provider: PaymentProviderName;
  contents: AssetAmount[];
  enabled: boolean;
  tags: string[];
  limit: PurchaseLimit;
  channel?: string;
  regionAllowList?: string[];
};

export type SkuEligibility = {
  skuId: string;
  purchasable: boolean;
  reason?: "disabled" | "sold_out" | "region_restricted" | "limit_reached" | "provider_unavailable" | "compliance_restricted";
};

export type ProductCatalog = {
  version: string;
  currency: string;
  skus: ProductSku[];
  eligibility: Record<string, SkuEligibility>;
  fetchedAt: ISODateString;
};

export type Order = {
  id: PlatformId;
  userId: PlatformId;
  skuId: string;
  amount: number;
  currency: string;
  provider: PaymentProviderName;
  status: OrderStatus;
  idempotencyKey: string;
  providerTransactionId?: string;
  fulfillmentLedgerId?: PlatformId;
  createdAt: ISODateString;
  updatedAt: ISODateString;
};

export type PaymentClientAction =
  | { kind: "none"; message: string }
  | { kind: "redirect"; url: string }
  | { kind: "sdk"; provider: PaymentProviderName; payload: Record<string, unknown> };

export type AdFormat = "rewarded" | "interstitial" | "banner" | "native";

export type AdPlacement = {
  id: string;
  format: AdFormat;
  enabled: boolean;
  label: string;
  rewards: AssetAmount[];
  cooldownSec: number;
  dailyCap: number;
  sessionCap: number;
};

export type AdShowToken = {
  token: string;
  placementId: string;
  userId: PlatformId;
  rewardId: string;
  expiresAt: number;
  consumedAt?: ISODateString;
};

export type AdShowResult = {
  placementId: string;
  showId: PlatformId;
  loaded: boolean;
  completed: boolean;
  errorCode?: string;
};

export type AudioContextKey = "home" | "lobby" | "activity" | "shop" | "rewards" | "gameplay";
export type AudioCueId = "tap" | "reward_claim" | "purchase_success" | "ad_start" | "ad_complete" | "popup_open" | "failure";

export type AudioSettings = {
  musicEnabled: boolean;
  sfxEnabled: boolean;
  muted: boolean;
  volume: number;
  unlocked: boolean;
  updatedAt: ISODateString;
};

export type AudioConfig = {
  enabled: boolean;
  defaultVolume: number;
  bgm: Record<AudioContextKey, string>;
  sfx: Record<AudioCueId, string>;
};

export type EventTaskKind = "level_clear" | "stars_earned" | "ad_watch" | "reward_claim" | "shop_visit" | "purchase" | "login";
export type EventStatus = "upcoming" | "active" | "ended" | "disabled";

export type LiveEventTask = {
  id: string;
  kind: EventTaskKind;
  title: string;
  target: number;
  progress: number;
  rewards: AssetAmount[];
  state: RewardState;
};

export type LiveEventDefinition = {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  visual: {
    emoji: string;
    theme: "gold" | "violet" | "cyan" | "rose";
  };
  startsAt: ISODateString;
  endsAt: ISODateString;
  priority: number;
  enabled: boolean;
  tasks: LiveEventTask[];
  rewards: AssetAmount[];
  cta: { kind: "activity" | "ad_offer" | "shop" | "reward_center"; targetId?: string; label: string };
};

export type EventCenterSnapshot = {
  userId: PlatformId;
  events: LiveEventDefinition[];
  claimableCount: number;
  updatedAt: ISODateString;
};

export type HomePopupTarget =
  | { kind: "activity"; eventId: string }
  | { kind: "ad_offer"; offerId: string }
  | { kind: "shop"; skuId?: string }
  | { kind: "reward_center" }
  | { kind: "settings" };

export type HomePopupConfig = {
  id: string;
  campaignId: string;
  title: string;
  subtitle: string;
  visualEmoji: string;
  rewardPreview: AssetAmount[];
  priority: number;
  startsAt: ISODateString;
  endsAt: ISODateString;
  dailyCap: number;
  enabled: boolean;
  ctaLabel: string;
  target: HomePopupTarget;
  disclosure?: "ad" | "paid" | "reward";
};

export type PopupDisplayRecord = {
  popupId: string;
  day: string;
  impressions: number;
  suppressedToday: boolean;
  lastShownAt?: ISODateString;
};

export type RewardedAdOfferSurface = "home" | "stamina_shortage" | "hint_shortage" | "reward_center" | "activity_detail" | "result";
export type RewardedAdOfferState = "available" | "loading" | "showing" | "cooldown" | "cap_reached" | "no_fill" | "failed" | "disabled" | "restricted" | "rewarded";

export type RewardedAdOffer = {
  id: string;
  placementId: string;
  surface: RewardedAdOfferSurface;
  title: string;
  subtitle: string;
  icon: string;
  ctaText: string;
  disclosureText: string;
  rewards: AssetAmount[];
  cooldownSec: number;
  dailyCap: number;
  sessionCap: number;
  priority: number;
  enabled: boolean;
};

export type RewardKind = "sign_in" | "daily_task" | "weekly_task" | "progression_task" | "achievement" | "mail" | "gift_code" | "event" | "ad" | "purchase";
export type RewardState = "locked" | "in_progress" | "claimable" | "claimed" | "expired";

export type RewardDefinition = {
  id: string;
  kind: RewardKind;
  title: string;
  description: string;
  rewards: AssetAmount[];
  state: RewardState;
  progress?: { current: number; target: number };
  expiresAt?: ISODateString;
};

export type RewardCenterSnapshot = {
  userId: PlatformId;
  rewards: RewardDefinition[];
  claimableCount: number;
  serverDay: string;
  updatedAt: ISODateString;
};

export type SegmentRule = {
  id: string;
  kind: "all" | "channel" | "version" | "region" | "progress" | "payer" | "lifecycle";
  operator: "eq" | "neq" | "gte" | "lte" | "in";
  value: string | number | boolean | Array<string | number | boolean>;
};

export type ExperimentAssignment = {
  experimentId: string;
  variantId: string;
  assignedAt: ISODateString;
};

export type FeatureFlags = Record<CommercialModule, CommercialMode>;

export type RemoteConfig = {
  version: string;
  schemaVersion: 1;
  flags: FeatureFlags;
  killSwitches: Partial<Record<CommercialModule, boolean>>;
  catalog: ProductSku[];
  adPlacements: AdPlacement[];
  audio: AudioConfig;
  events: LiveEventDefinition[];
  homePopups: HomePopupConfig[];
  rewardedAdOffers: RewardedAdOffer[];
  rewards: RewardDefinition[];
  experiments: Array<{ id: string; variants: string[]; rollout: number; segment?: SegmentRule[] }>;
  fetchedAt: ISODateString;
};

export type ConsentState = {
  privacyTermsVersion: string;
  privacyAcceptedAt?: ISODateString;
  analyticsConsent: boolean;
  adsPersonalizationConsent: boolean;
  locale: string;
  ageStatus: "unknown" | "minor" | "adult";
  updatedAt: ISODateString;
};

export type AuditEvent = {
  id: PlatformId;
  userId?: PlatformId;
  deviceId?: PlatformId;
  type:
    | "account_created"
    | "session_refreshed"
    | "account_bound"
    | "account_deleted"
    | "order_state_changed"
    | "reward_claimed"
    | "manual_grant"
    | "consent_changed"
    | "commercial_restricted";
  requestId: string;
  payload: Record<string, unknown>;
  createdAt: ISODateString;
};

export type AnalyticsEvent = {
  name: string;
  source: "client" | "page" | "economy" | "audio" | "popup" | "ad" | "reward" | "commerce" | "event" | string;
  userId?: PlatformId;
  deviceId?: PlatformId;
  sessionId?: PlatformId;
  configVersion?: string;
  page?: string;
  data: Record<string, string | number | boolean | null | undefined>;
  createdAt: ISODateString;
};
