import type { ApiResult, RequestMeta } from "./api";
import type {
  AdPlacement,
  AdShowResult,
  AdShowToken,
  AnalyticsEvent,
  CampaignCloudProgress,
  ConsentState,
  DeviceInfo,
  ExperimentAssignment,
  Order,
  PaymentClientAction,
  ProductCatalog,
  RemoteConfig,
  RewardCenterSnapshot,
  RewardDefinition,
  UserSession,
  WalletSnapshot
} from "./types";

export type BindAccountInput = {
  provider: "phone" | "wechat" | "apple" | "google";
  identifier: string;
  verifyCode: string;
  mergeConfirmed?: boolean;
};

export interface AuthProvider {
  ensureGuestSession(meta?: RequestMeta): Promise<ApiResult<UserSession>>;
  refreshSession(session: UserSession, meta?: RequestMeta): Promise<ApiResult<UserSession>>;
  bindAccount(session: UserSession, input: BindAccountInput, meta?: RequestMeta): Promise<ApiResult<UserSession>>;
  logout(session: UserSession, meta?: RequestMeta): Promise<ApiResult<void>>;
  requestDeletion(session: UserSession, meta?: RequestMeta): Promise<ApiResult<UserSession>>;
  listDevices(session: UserSession, meta?: RequestMeta): Promise<ApiResult<DeviceInfo[]>>;
  revokeDevice(session: UserSession, deviceId: string, meta?: RequestMeta): Promise<ApiResult<DeviceInfo[]>>;
  uploadCloudProgress(session: UserSession, progress: CampaignCloudProgress, meta?: RequestMeta): Promise<ApiResult<CampaignCloudProgress>>;
  downloadCloudProgress(session: UserSession, meta?: RequestMeta): Promise<ApiResult<CampaignCloudProgress | null>>;
}

export interface WalletProvider {
  getWallet(session: UserSession, meta?: RequestMeta): Promise<ApiResult<WalletSnapshot>>;
  grant(session: UserSession, input: { source: string; sourceId: string; deltas: Array<{ kind: string; amount: number }> }, meta: RequestMeta): Promise<ApiResult<WalletSnapshot>>;
  spend(session: UserSession, input: { source: string; sourceId: string; deltas: Array<{ kind: string; amount: number }> }, meta: RequestMeta): Promise<ApiResult<WalletSnapshot>>;
}

export interface PaymentProvider {
  getCatalog(session: UserSession, config: RemoteConfig, meta?: RequestMeta): Promise<ApiResult<ProductCatalog>>;
  createOrder(session: UserSession, skuId: string, meta: RequestMeta): Promise<ApiResult<{ order: Order; action: PaymentClientAction }>>;
  verifyReceipt(session: UserSession, orderId: string, receipt: Record<string, unknown>, meta?: RequestMeta): Promise<ApiResult<Order>>;
  fulfillOrder(session: UserSession, orderId: string, meta?: RequestMeta): Promise<ApiResult<{ order: Order; wallet: WalletSnapshot }>>;
  restorePurchases(session: UserSession, meta?: RequestMeta): Promise<ApiResult<Order[]>>;
}

export interface AdProvider {
  getPlacements(session: UserSession, config: RemoteConfig, meta?: RequestMeta): Promise<ApiResult<AdPlacement[]>>;
  requestShowToken(session: UserSession, placementId: string, meta?: RequestMeta): Promise<ApiResult<AdShowToken>>;
  showAd(token: AdShowToken, meta?: RequestMeta): Promise<ApiResult<AdShowResult>>;
  claimReward(session: UserSession, token: AdShowToken, result: AdShowResult, meta?: RequestMeta): Promise<ApiResult<WalletSnapshot>>;
}

export interface RewardProvider {
  getRewardCenter(session: UserSession, config: RemoteConfig, meta?: RequestMeta): Promise<ApiResult<RewardCenterSnapshot>>;
  ingestProgress(session: UserSession, event: { kind: string; amount?: number; refId?: string }, meta?: RequestMeta): Promise<ApiResult<RewardCenterSnapshot>>;
  claimReward(session: UserSession, rewardId: string, meta: RequestMeta): Promise<ApiResult<{ reward: RewardDefinition; wallet: WalletSnapshot }>>;
}

export interface ConfigProvider {
  getConfig(session: UserSession | null, meta?: RequestMeta): Promise<ApiResult<RemoteConfig>>;
  assignExperiment(session: UserSession, experimentId: string, meta?: RequestMeta): Promise<ApiResult<ExperimentAssignment | null>>;
}

export interface ComplianceProvider {
  getConsent(session: UserSession | null, meta?: RequestMeta): Promise<ApiResult<ConsentState | null>>;
  updateConsent(session: UserSession | null, consent: ConsentState, meta?: RequestMeta): Promise<ApiResult<ConsentState>>;
  canUseModule(module: string, session: UserSession | null, config: RemoteConfig, meta?: RequestMeta): Promise<ApiResult<{ allowed: boolean; reason?: string }>>;
}

export interface AnalyticsProvider {
  track(event: AnalyticsEvent): Promise<ApiResult<void>>;
  flush(meta?: RequestMeta): Promise<ApiResult<number>>;
}

export type PlatformProviders = {
  auth: AuthProvider;
  wallet: WalletProvider;
  payment: PaymentProvider;
  ads: AdProvider;
  rewards: RewardProvider;
  config: ConfigProvider;
  compliance: ComplianceProvider;
  analytics: AnalyticsProvider;
};
