import type { FeatureFlags, RemoteConfig } from "./types";

export const PLATFORM_CONFIG_SCHEMA_VERSION = 1;

export const DEFAULT_FEATURE_FLAGS: FeatureFlags = {
  account: "enabled",
  payments: "enabled",
  ads: "enabled",
  rewards: "enabled",
  analytics: "enabled",
  experiments: "enabled",
  audio: "enabled",
  events: "enabled",
  homePopups: "enabled",
  adOffers: "enabled"
};

const longFuture = "2099-12-31T23:59:59.000Z";

export const DEFAULT_REMOTE_CONFIG: RemoteConfig = {
  version: "platform-default-v1",
  schemaVersion: PLATFORM_CONFIG_SCHEMA_VERSION,
  flags: DEFAULT_FEATURE_FLAGS,
  killSwitches: {},
  catalog: [
    {
      id: "coins_pack_small",
      title: "金币小袋",
      description: "立即获得 300 金币",
      priceLabel: "¥6",
      amount: 6,
      currency: "CNY",
      provider: "mock",
      contents: [{ kind: "coins", amount: 300 }],
      enabled: true,
      tags: ["coins", "starter"],
      limit: { kind: "none", max: 0 }
    },
    {
      id: "stamina_bundle",
      title: "体力补给",
      description: "获得 10 点体力和 1 个提示",
      priceLabel: "¥8",
      amount: 8,
      currency: "CNY",
      provider: "mock",
      contents: [
        { kind: "stamina", amount: 10 },
        { kind: "hint", amount: 1 }
      ],
      enabled: true,
      tags: ["stamina"],
      limit: { kind: "daily", max: 3 }
    }
  ],
  adPlacements: [
    {
      id: "reward_stamina",
      format: "rewarded",
      enabled: true,
      label: "看广告领体力",
      rewards: [{ kind: "stamina", amount: 3 }],
      cooldownSec: 120,
      dailyCap: 8,
      sessionCap: 3
    },
    {
      id: "reward_hint",
      format: "rewarded",
      enabled: true,
      label: "看广告得提示",
      rewards: [{ kind: "hint", amount: 1 }],
      cooldownSec: 120,
      dailyCap: 6,
      sessionCap: 3
    },
    {
      id: "after_level_interstitial",
      format: "interstitial",
      enabled: true,
      label: "关后插屏",
      rewards: [],
      cooldownSec: 180,
      dailyCap: 12,
      sessionCap: 4
    }
  ],
  audio: {
    enabled: true,
    defaultVolume: 0.42,
    bgm: {
      home: "home_lobby_synth",
      lobby: "lobby_synth",
      activity: "activity_synth",
      shop: "shop_synth",
      rewards: "reward_synth",
      gameplay: "gameplay_synth"
    },
    sfx: {
      tap: "tap_blip",
      reward_claim: "reward_chime",
      purchase_success: "purchase_fanfare",
      ad_start: "ad_start",
      ad_complete: "ad_complete",
      popup_open: "popup_open",
      failure: "failure_buzz"
    }
  },
  events: [
    {
      id: "star_gate_sprint",
      title: "星门冲刺",
      subtitle: "限时闯关赢补给",
      description: "完成闯关任务，领取体力、金币和提示补给。",
      visual: { emoji: "🚀", theme: "violet" },
      startsAt: "2020-01-01T00:00:00.000Z",
      endsAt: longFuture,
      priority: 100,
      enabled: true,
      tasks: [
        {
          id: "clear_3_levels",
          kind: "level_clear",
          title: "通关 3 次",
          target: 3,
          progress: 0,
          rewards: [{ kind: "coins", amount: 120 }],
          state: "in_progress"
        },
        {
          id: "watch_1_ad",
          kind: "ad_watch",
          title: "看 1 次广告补给",
          target: 1,
          progress: 0,
          rewards: [{ kind: "hint", amount: 1 }],
          state: "in_progress"
        }
      ],
      rewards: [{ kind: "stamina", amount: 5 }],
      cta: { kind: "ad_offer", targetId: "stamina_home", label: "看广告拿补给" }
    },
    {
      id: "daily_supply_drop",
      title: "每日空投",
      subtitle: "登录即领福利",
      description: "每日进入游戏即可领取基础补给，保持连续活跃奖励更高。",
      visual: { emoji: "🎁", theme: "gold" },
      startsAt: "2020-01-01T00:00:00.000Z",
      endsAt: longFuture,
      priority: 80,
      enabled: true,
      tasks: [
        {
          id: "daily_login",
          kind: "login",
          title: "今日登录",
          target: 1,
          progress: 1,
          rewards: [{ kind: "coins", amount: 60 }],
          state: "claimable"
        }
      ],
      rewards: [{ kind: "coins", amount: 60 }],
      cta: { kind: "activity", targetId: "daily_supply_drop", label: "领取空投" }
    }
  ],
  homePopups: [
    {
      id: "popup_star_gate",
      campaignId: "star_gate_sprint",
      title: "星门冲刺开启",
      subtitle: "看广告领体力，冲击更高关卡",
      visualEmoji: "🚀",
      rewardPreview: [
        { kind: "stamina", amount: 3 },
        { kind: "hint", amount: 1 }
      ],
      priority: 100,
      startsAt: "2020-01-01T00:00:00.000Z",
      endsAt: longFuture,
      dailyCap: 1,
      enabled: true,
      ctaLabel: "立即领补给",
      target: { kind: "ad_offer", offerId: "stamina_home" },
      disclosure: "ad"
    }
  ],
  rewardedAdOffers: [
    {
      id: "stamina_home",
      placementId: "reward_stamina",
      surface: "home",
      title: "看广告领体力",
      subtitle: "补充 3 点体力，继续闯关",
      icon: "⚡",
      ctaText: "看广告 +3",
      disclosureText: "观看完整广告后获得体力",
      rewards: [{ kind: "stamina", amount: 3 }],
      cooldownSec: 120,
      dailyCap: 8,
      sessionCap: 3,
      priority: 100,
      enabled: true
    },
    {
      id: "hint_home",
      placementId: "reward_hint",
      surface: "home",
      title: "看广告得提示",
      subtitle: "迷路时拿 1 个提示",
      icon: "💡",
      ctaText: "看广告 +1",
      disclosureText: "观看完整广告后获得提示",
      rewards: [{ kind: "hint", amount: 1 }],
      cooldownSec: 120,
      dailyCap: 6,
      sessionCap: 3,
      priority: 90,
      enabled: true
    }
  ],
  rewards: [
    {
      id: "daily_signin_1",
      kind: "sign_in",
      title: "每日签到",
      description: "每天登录领取金币",
      rewards: [{ kind: "coins", amount: 50 }],
      state: "claimable"
    },
    {
      id: "task_clear_3",
      kind: "daily_task",
      title: "闯关 3 次",
      description: "完成 3 个关卡",
      rewards: [{ kind: "coins", amount: 80 }],
      state: "in_progress",
      progress: { current: 0, target: 3 }
    }
  ],
  experiments: [],
  fetchedAt: new Date(0).toISOString()
};

export function isModuleEnabled(config: RemoteConfig, module: keyof FeatureFlags): boolean {
  if (config.killSwitches[module]) return false;
  return config.flags[module] === "enabled";
}

export function isModuleRestricted(config: RemoteConfig, module: keyof FeatureFlags): boolean {
  if (config.killSwitches[module]) return true;
  return config.flags[module] === "restricted";
}

export function validateRemoteConfig(value: RemoteConfig): boolean {
  return (
    value.schemaVersion === PLATFORM_CONFIG_SCHEMA_VERSION &&
    typeof value.version === "string" &&
    value.version.length > 0 &&
    validateAudioConfig(value.audio) &&
    Array.isArray(value.events) &&
    Array.isArray(value.homePopups) &&
    Array.isArray(value.rewardedAdOffers)
  );
}

export function validateAudioConfig(value: RemoteConfig["audio"]): boolean {
  return Boolean(value && typeof value.enabled === "boolean" && value.defaultVolume >= 0 && value.defaultVolume <= 1);
}

export function validateEventConfig(value: RemoteConfig["events"]): boolean {
  return Array.isArray(value) && value.every((event) => Boolean(event.id && event.title && event.startsAt && event.endsAt));
}

export function validatePopupConfig(value: RemoteConfig["homePopups"]): boolean {
  return Array.isArray(value) && value.every((popup) => Boolean(popup.id && popup.title && popup.target && popup.dailyCap >= 0));
}

export function validateRewardedAdOfferConfig(value: RemoteConfig["rewardedAdOffers"]): boolean {
  return Array.isArray(value) && value.every((offer) => Boolean(offer.id && offer.placementId && offer.ctaText && offer.rewards.length));
}
