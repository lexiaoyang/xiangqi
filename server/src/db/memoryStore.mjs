const ASSET_KINDS = ["coins", "stamina", "hint", "undo", "ticket", "premium"];

export function nowIso() {
  return new Date().toISOString();
}

export function id(prefix) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}_${Date.now().toString(36)}`;
}

export function defaultBalances() {
  return { coins: 120, stamina: 24, hint: 0, undo: 0, ticket: 0, premium: 0 };
}

export function createMemoryStore(seed = {}) {
  return {
    users: new Map(seed.users || []),
    devices: new Map(seed.devices || []),
    sessions: new Map(seed.sessions || []),
    cloudSaves: new Map(seed.cloudSaves || []),
    wallets: new Map(seed.wallets || []),
    ledgerEntries: [],
    idempotency: new Map(),
    catalog: seed.catalog || defaultCatalog(),
    orders: new Map(seed.orders || []),
    adTokens: new Map(seed.adTokens || []),
    rewardDefinitions: seed.rewardDefinitions || defaultRewards(),
    rewardClaims: new Map(),
    events: seed.events || defaultEvents(),
    eventProgress: new Map(),
    popupRecords: new Map(),
    remoteConfig: seed.remoteConfig || defaultRemoteConfig(),
    analyticsEvents: [],
    auditEvents: [],
    consents: new Map(seed.consents || []),
    fraudSignals: [],
    rateLimits: new Map()
  };
}

export function walletSnapshot(userId, wallet) {
  return {
    userId,
    balances: { ...wallet.balances },
    ledgerCursor: String(wallet.ledgerCursor),
    syncState: "online",
    reconciliation: { state: "clean", issueCount: 0 },
    updatedAt: wallet.updatedAt
  };
}

export function ensureWallet(store, userId) {
  if (!store.wallets.has(userId)) {
    store.wallets.set(userId, { userId, balances: defaultBalances(), ledgerCursor: 0, updatedAt: nowIso() });
  }
  return store.wallets.get(userId);
}

export function applyDeltas(wallet, deltas) {
  const next = { ...wallet.balances };
  for (const delta of deltas) {
    if (!ASSET_KINDS.includes(delta.kind)) throw new Error(`Unknown asset kind: ${delta.kind}`);
    next[delta.kind] = (next[delta.kind] || 0) + Number(delta.amount || 0);
    if (next[delta.kind] < 0) {
      const err = new Error("INSUFFICIENT_BALANCE");
      err.code = "INSUFFICIENT_BALANCE";
      throw err;
    }
  }
  wallet.balances = next;
  wallet.ledgerCursor += 1;
  wallet.updatedAt = nowIso();
  return wallet;
}

export function defaultCatalog() {
  return [
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
      limit: { kind: "none", max: 0 },
      category: "resources",
      valueCopy: "适合补齐一次关卡前准备"
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
      limit: { kind: "daily", max: 3 },
      category: "starter",
      valueCopy: "连续挑战失败时的恢复包"
    },
    {
      id: "scanner_tool_pack",
      title: "战术扫描包",
      description: "扫描×5，提前识别陷阱、巡逻和遗物位置",
      priceLabel: "¥12",
      amount: 12,
      currency: "CNY",
      provider: "mock",
      contents: [{ kind: "coins", amount: 80 }],
      tacticalContents: [{ toolId: "scanner", amount: 5 }],
      enabled: true,
      tags: ["scanner", "tool"],
      limit: { kind: "daily", max: 4 },
      category: "tactical_tools",
      valueCopy: "适合巡逻、陷阱、遗物章节"
    },
    {
      id: "systems_prep_pack",
      title: "机关破解包",
      description: "冻结×2、架桥×2、万能钥匙×1，处理机关复合关",
      priceLabel: "¥18",
      amount: 18,
      currency: "CNY",
      provider: "mock",
      contents: [{ kind: "coins", amount: 160 }],
      tacticalContents: [
        { toolId: "freeze", amount: 2 },
        { toolId: "bridge", amount: 2 },
        { toolId: "key_forge", amount: 1 }
      ],
      enabled: true,
      tags: ["chapter", "tools"],
      limit: { kind: "daily", max: 2 },
      category: "chapter_prep",
      valueCopy: "给开关、相位门、不稳定地块准备容错"
    },
    {
      id: "relic_master_pack",
      title: "遗物大师包",
      description: "脉冲×2、回卷×2、诱饵×2，追求高星撤离路线",
      priceLabel: "¥28",
      amount: 28,
      currency: "CNY",
      provider: "mock",
      contents: [{ kind: "premium", amount: 10 }],
      tacticalContents: [
        { toolId: "reveal_pulse", amount: 2 },
        { toolId: "rewind", amount: 2 },
        { toolId: "decoy", amount: 2 }
      ],
      enabled: true,
      tags: ["relic", "master"],
      limit: { kind: "weekly", max: 3 },
      category: "limited",
      valueCopy: "高难遗物关的收益/撤离工具组"
    },
    {
      id: "vip_strategy_pass",
      title: "VIP 策略通行证",
      description: "获得 180 VIP 点、300 金币和每日战术权益",
      priceLabel: "¥30",
      amount: 30,
      currency: "CNY",
      provider: "mock",
      contents: [{ kind: "coins", amount: 300 }],
      vipPoints: 180,
      enabled: true,
      tags: ["vip", "pass"],
      limit: { kind: "monthly", max: 1 },
      category: "vip",
      valueCopy: "解锁体力上限、奖励加成、扫描半径、每日工具包和额外战术槽"
    }
  ];
}

export function defaultRewards() {
  return [
    { id: "daily_signin_1", kind: "sign_in", title: "每日签到", description: "每天登录领取金币", rewards: [{ kind: "coins", amount: 50 }], state: "claimable" },
    { id: "task_clear_3", kind: "daily_task", title: "闯关 3 次", description: "完成 3 个关卡", rewards: [{ kind: "coins", amount: 80 }], state: "in_progress", progress: { current: 0, target: 3 } }
  ];
}

export function defaultEvents() {
  return [
    {
      id: "star_gate_sprint",
      title: "星门冲刺",
      startsAt: "2020-01-01T00:00:00.000Z",
      endsAt: "2099-12-31T23:59:59.000Z",
      enabled: true,
      priority: 100,
      tasks: [
        { id: "clear_3_levels", kind: "level_clear", title: "通关 3 次", target: 3, progress: 0, rewards: [{ kind: "coins", amount: 120 }], state: "in_progress" },
        { id: "watch_1_ad", kind: "ad_watch", title: "看 1 次广告补给", target: 1, progress: 0, rewards: [{ kind: "hint", amount: 1 }], state: "in_progress" }
      ],
      rewards: [{ kind: "stamina", amount: 5 }]
    }
  ];
}

export function defaultRemoteConfig() {
  return {
    version: "backend-default-v1",
    schemaVersion: 1,
    catalog: defaultCatalog(),
    adPlacements: [
      { id: "reward_stamina", format: "rewarded", enabled: true, label: "看广告领体力", rewards: [{ kind: "stamina", amount: 3 }], cooldownSec: 120, dailyCap: 8, sessionCap: 3 },
      { id: "reward_hint", format: "rewarded", enabled: true, label: "看广告得提示", rewards: [{ kind: "hint", amount: 1 }], cooldownSec: 120, dailyCap: 6, sessionCap: 3 }
    ],
    rewards: defaultRewards(),
    events: defaultEvents(),
    homePopups: [],
    rewardedAdOffers: [],
    audio: {
      enabled: true,
      defaultVolume: 0.42,
      bgm: { home: "home_lobby_synth", lobby: "lobby_synth", activity: "activity_synth", shop: "shop_synth", rewards: "reward_synth", gameplay: "gameplay_synth" },
      sfx: { tap: "tap_blip", reward_claim: "reward_chime", purchase_success: "purchase_fanfare", ad_start: "ad_start", ad_complete: "ad_complete", popup_open: "popup_open", failure: "failure_buzz" }
    },
    flags: { account: "enabled", payments: "enabled", ads: "enabled", rewards: "enabled", analytics: "enabled", experiments: "enabled", audio: "enabled", events: "enabled", homePopups: "enabled", adOffers: "enabled" },
    killSwitches: {},
    experiments: [],
    fetchedAt: new Date(0).toISOString()
  };
}
