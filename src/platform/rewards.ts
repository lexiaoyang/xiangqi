import { createRequestId, type ApiResult } from "./api";
import { mockPlatformProviders } from "./mockProviders";
import type { PlatformProviders } from "./providers";
import type { RewardCenterSnapshot, RewardDefinition, UserSession, WalletSnapshot } from "./types";

export type ClaimRewardResult = {
  reward: RewardDefinition;
  wallet: WalletSnapshot;
};

export async function loadRewardCenter(session: UserSession, providers: PlatformProviders = mockPlatformProviders): Promise<ApiResult<RewardCenterSnapshot>> {
  const config = await providers.config.getConfig(session);
  if (!config.ok) return config;
  return providers.rewards.getRewardCenter(session, config.data, { requestId: createRequestId("rewardcenter") });
}

export async function claimRewardCenterItem(
  session: UserSession,
  rewardId: string,
  providers: PlatformProviders = mockPlatformProviders
): Promise<ApiResult<ClaimRewardResult>> {
  return providers.rewards.claimReward(session, rewardId, {
    requestId: createRequestId("claim"),
    idempotencyKey: `reward:${session.profile.userId}:${rewardId}`
  });
}

export async function ingestRewardProgress(
  session: UserSession,
  event: { kind: string; amount?: number; refId?: string },
  providers: PlatformProviders = mockPlatformProviders
): Promise<ApiResult<RewardCenterSnapshot>> {
  return providers.rewards.ingestProgress(session, event, { requestId: createRequestId("rewardprogress"), idempotencyKey: `progress:${event.kind}:${event.refId ?? Date.now()}` });
}

export function rewardKindLabel(kind: RewardDefinition["kind"]): string {
  const labels: Record<RewardDefinition["kind"], string> = {
    sign_in: "签到",
    daily_task: "每日任务",
    weekly_task: "每周任务",
    progression_task: "成长任务",
    achievement: "成就",
    mail: "邮件",
    gift_code: "礼包码",
    event: "限时活动",
    ad: "广告奖励",
    purchase: "购买奖励"
  };
  return labels[kind];
}

export function rewardStateLabel(state: RewardDefinition["state"]): string {
  const labels: Record<RewardDefinition["state"], string> = {
    locked: "未解锁",
    in_progress: "进行中",
    claimable: "可领取",
    claimed: "已领取",
    expired: "已过期"
  };
  return labels[state];
}
