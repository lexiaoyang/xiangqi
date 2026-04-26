import type { CampaignSaveV1 } from "../campaign/types";
import { createRequestId, type ApiResult, err, ok } from "./api";
import { mockPlatformProviders } from "./mockProviders";
import type { BindAccountInput, PlatformProviders } from "./providers";
import { readUserSession, writeUserSession } from "./storage";
import type { CampaignCloudProgress, UserSession, WalletSnapshot } from "./types";

export type AccountUiState = "guest" | "bound" | "offline" | "restricted" | "deleted";

export type AccountSummary = {
  state: AccountUiState;
  label: string;
  detail: string;
  userId?: string;
  nickname?: string;
};

export function summarizeAccount(session: UserSession | null): AccountSummary {
  if (!session) return { state: "offline", label: "离线游客", detail: "本地游玩中，登录后可同步进度" };
  if (session.profile.bindingState === "deleted") return { state: "deleted", label: "账号删除中", detail: "商业化功能已停用", userId: session.profile.userId };
  if (session.profile.bindingState === "restricted") return { state: "restricted", label: "账号受限", detail: "支付、广告、领奖暂不可用", userId: session.profile.userId };
  if (session.profile.bindingState === "bound") {
    return {
      state: "bound",
      label: session.profile.nickname,
      detail: `已绑定 ${session.profile.provider ?? "账号"} · 云同步开启`,
      userId: session.profile.userId,
      nickname: session.profile.nickname
    };
  }
  return {
    state: "guest",
    label: session.profile.nickname,
    detail: "游客模式 · 可绑定账号保护进度",
    userId: session.profile.userId,
    nickname: session.profile.nickname
  };
}

export async function bootstrapPlatformUser(providers: PlatformProviders = mockPlatformProviders): Promise<ApiResult<UserSession>> {
  const existing = readUserSession();
  if (existing && existing.profile.bindingState !== "deleted") return ok(existing);
  return providers.auth.ensureGuestSession({ requestId: createRequestId("guest") });
}

export function restoreCachedPlatformSession(): UserSession | null {
  return readUserSession();
}

export async function refreshPlatformSession(session: UserSession, providers: PlatformProviders = mockPlatformProviders): Promise<ApiResult<UserSession>> {
  const refreshed = await providers.auth.refreshSession(session, { requestId: createRequestId("refresh") });
  if (refreshed.ok) writeUserSession(refreshed.data);
  return refreshed;
}

export async function bindPlatformAccount(
  session: UserSession,
  input: BindAccountInput,
  providers: PlatformProviders = mockPlatformProviders
): Promise<ApiResult<UserSession>> {
  const bound = await providers.auth.bindAccount(session, input, { requestId: createRequestId("bind"), idempotencyKey: createRequestId("bindidem") });
  if (bound.ok) writeUserSession(bound.data);
  return bound;
}

export async function requestAccountDeletion(session: UserSession, providers: PlatformProviders = mockPlatformProviders): Promise<ApiResult<UserSession>> {
  const deleted = await providers.auth.requestDeletion(session, { requestId: createRequestId("delete") });
  if (deleted.ok) writeUserSession(deleted.data);
  return deleted;
}

export function campaignSaveToCloudProgress(save: CampaignSaveV1): CampaignCloudProgress {
  return {
    maxUnlockedLevel: save.maxUnlockedLevel,
    perLevelStars: Object.fromEntries(Object.entries(save.perLevel).map(([levelId, record]) => [levelId, record.stars])),
    updatedAt: new Date().toISOString()
  };
}

export function mergeCampaignCloudProgress(local: CampaignSaveV1, cloud: CampaignCloudProgress | null): CampaignCloudProgress {
  const localProgress = campaignSaveToCloudProgress(local);
  if (!cloud) return localProgress;

  const perLevelStars: CampaignCloudProgress["perLevelStars"] = { ...cloud.perLevelStars };
  for (const [levelId, stars] of Object.entries(localProgress.perLevelStars)) {
    perLevelStars[levelId] = Math.max(perLevelStars[levelId] ?? 0, stars) as 0 | 1 | 2 | 3;
  }

  return {
    ...cloud,
    maxUnlockedLevel: Math.max(cloud.maxUnlockedLevel, localProgress.maxUnlockedLevel),
    perLevelStars,
    updatedAt: new Date().toISOString()
  };
}

export async function syncCampaignProgress(
  session: UserSession,
  localSave: CampaignSaveV1,
  providers: PlatformProviders = mockPlatformProviders
): Promise<ApiResult<CampaignCloudProgress>> {
  const downloaded = await providers.auth.downloadCloudProgress(session, { requestId: createRequestId("cloudget") });
  if (!downloaded.ok) return downloaded;
  const merged = mergeCampaignCloudProgress(localSave, downloaded.data);
  return providers.auth.uploadCloudProgress(session, merged, { requestId: createRequestId("cloudup"), idempotencyKey: `cloud:${session.profile.userId}:${merged.updatedAt}` });
}

export async function getWalletSummary(session: UserSession | null, providers: PlatformProviders = mockPlatformProviders): Promise<ApiResult<WalletSnapshot | null>> {
  if (!session) return ok(null);
  if (session.profile.bindingState === "deleted" || session.profile.bindingState === "restricted") {
    return err("COMPLIANCE_RESTRICTED", "账号状态限制商业化资产访问。");
  }
  return providers.wallet.getWallet(session, { requestId: createRequestId("wallet") });
}

export function guestRecoveryMessage(session: UserSession | null): string {
  if (!session || session.profile.bindingState === "guest") return "游客账号仅保存在本设备，丢失本地数据后无法远程找回。";
  return "已绑定账号可通过原登录方式恢复进度和资产。";
}
