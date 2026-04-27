import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MAX_LEVEL_ID } from "./campaign/constants";
import { filterObstaclesForRun } from "./campaign/mechanics";
import { getLevelSpec } from "./campaign/levelSpec";
import { applyToolUnlocksFromProgress, consumeToolCharge, grantToolCharges, loadCampaignSave, regenStamina, saveCampaignSave } from "./campaign/persist";
import {
  ACHIEVEMENTS,
  MODIFIER_COPY,
  achievementUnlocks,
  applyAchievementUnlocks,
  dailyChallengeFor,
  ensureDailyState,
  evaluateMastery,
  recordCodexSeen,
  recordMastery,
  streakReward,
  totalMasteryScore,
  updateStreakAfterClear
} from "./campaign/retention";
import { nextVipTier, rewardWithVipBonus, serverDay, TACTICAL_TOOL_META, vipStaminaCap, vipTierFor } from "./campaign/strategy";
import type { CampaignSaveV1, RewardProfile, StrategicModifierId, ToolId } from "./campaign/types";
import { MazeLevelPlay, type PlayResolve } from "./MazeLevelPlay";
import { offersForSurface, offerEligibility, offerRewardText, runRewardedAdOffer } from "./platform/adOffers";
import { AudioManager, loadAudioSettings } from "./platform/audio";
import { fallbackCatalog, loadCatalog, purchasableSkus, runMockPurchase } from "./platform/commerce";
import { acceptPrivacy, defaultConsent, revokeOptionalConsent, updateConsentState } from "./platform/compliance";
import { DEFAULT_REMOTE_CONFIG } from "./platform/config";
import { claimEventTaskReward, eventTimeLeftLabel, ingestEventProgress, loadEventCenter } from "./platform/events";
import { loadLiveConfig, trackEvent } from "./platform/liveops";
import { usePageAnalytics } from "./platform/pageAnalytics";
import { closePopup, popupRewardText, recordPopupImpression, selectHomePopup, suppressPopupToday } from "./platform/popups";
import { claimRewardCenterItem, ingestRewardProgress, loadRewardCenter, rewardKindLabel, rewardStateLabel } from "./platform/rewards";
import type { AudioSettings, ConsentState, EventCenterSnapshot, HomePopupConfig, LiveEventDefinition, ProductCatalog, RemoteConfig, RewardCenterSnapshot, RewardedAdOffer, UserSession } from "./platform/types";
import { bindPlatformAccount, bootstrapPlatformUser, getWalletSummary, summarizeAccount, syncCampaignProgress } from "./platform/user";

type Screen = "hub" | "play" | "shop" | "settings" | "rewards" | "activity";

export function CampaignShell() {
  const [save, setSave] = useState<CampaignSaveV1>(() => applyToolUnlocksFromProgress(regenStamina(loadCampaignSave())));
  const [screen, setScreen] = useState<Screen>("hub");
  const [playLevelId, setPlayLevelId] = useState<number | null>(null);
  const [retryKey, setRetryKey] = useState(0);
  const [shopConfirm, setShopConfirm] = useState<string | null>(null);
  const [prepLevelId, setPrepLevelId] = useState<number | null>(null);
  const [platformSession, setPlatformSession] = useState<UserSession | null>(null);
  const [platformSyncText, setPlatformSyncText] = useState("平台初始化中");
  const [catalog, setCatalog] = useState<ProductCatalog>(fallbackCatalog);
  const [rewardCenter, setRewardCenter] = useState<RewardCenterSnapshot | null>(null);
  const [liveConfig, setLiveConfig] = useState<RemoteConfig>(DEFAULT_REMOTE_CONFIG);
  const [consent, setConsent] = useState<ConsentState>(() => defaultConsent());
  const [audioSettings, setAudioSettings] = useState<AudioSettings>(() => loadAudioSettings(DEFAULT_REMOTE_CONFIG.audio));
  const [eventCenter, setEventCenter] = useState<EventCenterSnapshot | null>(null);
  const [homePopup, setHomePopup] = useState<HomePopupConfig | null>(null);
  const [adPreviewOffer, setAdPreviewOffer] = useState<RewardedAdOffer | null>(null);
  const [hintCredits, setHintCredits] = useState(0);
  const [toast, setToast] = useState<string | null>(null);
  const audioRef = useRef<AudioManager | null>(null);
  const accountSummary = summarizeAccount(platformSession);
  const vipTier = vipTierFor(save.vip.points);
  const nextVip = nextVipTier(save.vip.points);
  const staminaCap = vipStaminaCap(save.vip);
  const today = serverDay();
  const dailyState = save.daily.day === today ? save.daily : dailyChallengeFor(today, save.maxUnlockedLevel);
  const dailySpec = getLevelSpec(dailyState.levelId);
  const dailyReward = streakReward(Math.max(1, save.streak.count + (save.streak.lastClearDay === today ? 0 : 1)));
  const unlockedAchievementCount = Object.keys(save.achievements).length;
  const discoveredCodexCount = Object.keys(save.codex).length;
  const masteryScore = totalMasteryScore(save);
  usePageAnalytics({ screen, session: platformSession, config: liveConfig });

  const persist = useCallback((next: CampaignSaveV1) => {
    const merged = applyToolUnlocksFromProgress(regenStamina(next));
    setSave(merged);
    saveCampaignSave(merged);
  }, []);

  useEffect(() => {
    audioRef.current = new AudioManager(liveConfig.audio, audioSettings);
    return () => audioRef.current?.dispose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    audioRef.current?.updateSettings(audioSettings);
  }, [audioSettings]);

  useEffect(() => {
    const context = screen === "activity" ? "activity" : screen === "shop" ? "shop" : screen === "rewards" ? "rewards" : screen === "play" ? "gameplay" : "home";
    audioRef.current?.playBgm(context, { homeLayer: screen === "hub" });
  }, [screen]);

  useEffect(() => {
    let alive = true;
    bootstrapPlatformUser().then(async (result) => {
      if (!alive) return;
      if (!result.ok) {
        setPlatformSyncText("离线模式");
        return;
      }
      setPlatformSession(result.data);
      const liveConfigResult = await loadLiveConfig(result.data);
      if (alive && liveConfigResult.ok) {
        setLiveConfig(liveConfigResult.data);
        const popup = selectHomePopup(liveConfigResult.data);
        if (popup) {
          setHomePopup(popup);
          recordPopupImpression(popup, result.data);
          audioRef.current?.playSfx("popup_open");
        }
      }
      const catalogResult = await loadCatalog(result.data);
      if (alive && catalogResult.ok) setCatalog(catalogResult.data);
      const rewardResult = await loadRewardCenter(result.data);
      if (alive && rewardResult.ok) setRewardCenter(rewardResult.data);
      const eventResult = await loadEventCenter(result.data, liveConfigResult.ok ? liveConfigResult.data : DEFAULT_REMOTE_CONFIG);
      if (alive && eventResult.ok) setEventCenter(eventResult.data);
      const wallet = await getWalletSummary(result.data);
      if (!alive) return;
      setPlatformSyncText(wallet.ok ? "钱包已就绪" : "钱包离线缓存");
    });
    return () => {
      alive = false;
    };
  }, []);

  const playTap = () => {
    audioRef.current?.unlock();
    audioRef.current?.playSfx("tap");
  };

  const trackCampaign = useCallback(
    (name: string, data: Record<string, unknown> = {}) => {
      if (!platformSession) return;
      void trackEvent(name, platformSession, liveConfig, { screen, ...data });
    },
    [liveConfig, platformSession, screen]
  );

  const goScreen = (next: Screen) => {
    playTap();
    trackCampaign("screen_change", { from: screen, to: next });
    setScreen(next);
  };

  const summary = useMemo(() => {
    let stars = 0;
    for (const r of Object.values(save.perLevel)) {
      stars += r.stars;
    }
    return { stars, max: save.maxUnlockedLevel };
  }, [save]);

  const startLevel = (levelId: number) => {
    const spec = getLevelSpec(levelId);
    if (spec.complexity > 1) {
      setPrepLevelId(levelId);
      trackCampaign("level_prep_open", { levelId, archetype: spec.archetype, complexity: spec.complexity });
      return;
    }
    beginLevel(levelId);
  };

  const beginLevel = (levelId: number) => {
    if (save.stamina < 1) {
      trackCampaign("level_start_blocked", { levelId, reason: "stamina_shortage" });
      const offer = offersForSurface(liveConfig, "home").find((item) => item.id === "stamina_home");
      if (offer) {
        setAdPreviewOffer(offer);
        audioRef.current?.playSfx("failure");
      } else {
        window.alert("体力不足，稍后再来或去商店看看～");
      }
      return;
    }
    playTap();
    setPrepLevelId(null);
    trackCampaign("level_start", { levelId, staminaBefore: save.stamina });
    const next = { ...save, stamina: save.stamina - 1, lastStaminaTs: Date.now() };
    persist(next);
    setPlayLevelId(levelId);
    setScreen("play");
    setRetryKey((k) => k + 1);
  };

  const activeSpec = playLevelId != null ? getLevelSpec(playLevelId) : null;
  const activeObstacles = useMemo(() => {
    if (!activeSpec) return [];
    return filterObstaclesForRun(activeSpec.obstacleIds, save.maxUnlockedLevel);
  }, [activeSpec, save.maxUnlockedLevel]);

  const applyRewardProfile = useCallback((base: CampaignSaveV1, profile: RewardProfile): CampaignSaveV1 => {
    let next = { ...base };
    next.coins += profile.coins ?? 0;
    if (profile.stamina) next.stamina = Math.min(vipStaminaCap(next.vip), next.stamina + profile.stamina);
    if (profile.vipPoints) next.vip = { ...next.vip, points: next.vip.points + profile.vipPoints };
    if (profile.toolCharges) next = grantToolCharges(next, profile.toolCharges);
    return next;
  }, []);

  const grantSkuToSave = useCallback(
    (base: CampaignSaveV1, sku: ProductCatalog["skus"][number]): CampaignSaveV1 => {
      let next = { ...base };
      for (const item of sku.contents) {
        if (item.kind === "coins") next.coins += item.amount;
        if (item.kind === "stamina") next.stamina = Math.min(vipStaminaCap(next.vip), next.stamina + item.amount);
        if (item.kind === "hint" || item.kind === "undo") next = grantToolCharges(next, { [item.kind]: item.amount });
        if (item.kind === "premium") next.vip = { ...next.vip, points: next.vip.points + item.amount };
      }
      const tactical = Object.fromEntries((sku.tacticalContents ?? []).map((item) => [item.toolId, item.amount])) as Partial<Record<ToolId, number>>;
      if (sku.tacticalContents?.length) next = grantToolCharges(next, tactical);
      if (sku.vipPoints) next.vip = { ...next.vip, points: next.vip.points + sku.vipPoints };
      return next;
    },
    []
  );

  const onPlayResolve = (r: PlayResolve) => {
    if (!playLevelId || !activeSpec) return;
    let next = { ...save };
    trackCampaign("level_resolve", {
      levelId: playLevelId,
      action: r.action,
      won: r.won,
      stars: r.stars,
      steps: r.steps,
      durationMs: r.durationMs
    });

    if (r.action === "retry") {
      if (next.stamina < 1) {
        trackCampaign("level_retry_blocked", { levelId: playLevelId, reason: "stamina_shortage" });
        window.alert("体力不足");
        return;
      }
      next = { ...next, stamina: next.stamina - 1 };
      persist(next);
      setRetryKey((k) => k + 1);
      return;
    }

    if (r.won) {
      const key = String(playLevelId);
      const prev = next.perLevel[key]?.stars ?? 0;
      const mergedStars = Math.max(prev, r.stars) as 0 | 1 | 2 | 3;
      next.perLevel = { ...next.perLevel, [key]: { stars: mergedStars, cleared: true } };
      next.maxUnlockedLevel = Math.min(MAX_LEVEL_ID, Math.max(next.maxUnlockedLevel, playLevelId + 1));
      next = applyRewardProfile(next, {
        ...activeSpec.rewardProfile,
        coins: rewardWithVipBonus(activeSpec.rewardProfile.coins + r.stars * 6, next.vip)
      });
      const clearStats = {
        stars: r.stars,
        steps: r.steps,
        durationMs: r.durationMs,
        dangerHits: r.dangerHits,
        toolUses: r.toolUses,
        relicsCollected: r.relicsCollected,
        requiredRelics: r.requiredRelics
      };
      const mastery = evaluateMastery(activeSpec, clearStats, next.vip.points);
      next = recordMastery(next, playLevelId, mastery, clearStats);

      const messages: string[] = [`${mastery.label} ${mastery.score} 分`];
      const codexResult = recordCodexSeen(next, activeSpec.modifierIds);
      next = codexResult.save;
      if (codexResult.reward) {
        next = applyRewardProfile(next, codexResult.reward);
        messages.push(`图鉴发现 +${codexResult.reward.coins} 金币`);
      }

      next = ensureDailyState(next, today);
      if (next.daily.day === today && next.daily.levelId === playLevelId && !next.daily.completedAt) {
        const reward: RewardProfile = { coins: 120, stamina: 1, toolCharges: { scanner: 1 } };
        next = applyRewardProfile({ ...next, daily: { ...next.daily, completedAt: new Date().toISOString() } }, reward);
        messages.push("每日挑战完成");
      }

      const streak = updateStreakAfterClear(next, today);
      next = streak.save;
      if (streak.reward) {
        next = applyRewardProfile(next, streak.reward);
        messages.push(`连续挑战 ${next.streak.count} 天`);
      }

      const unlocks = achievementUnlocks(next, clearStats);
      if (unlocks.length) {
        next = applyAchievementUnlocks(next, unlocks);
        for (const unlock of unlocks) next = applyRewardProfile(next, unlock.reward);
        messages.push(`成就解锁：${unlocks.map((item) => item.title).join("、")}`);
        audioRef.current?.playSfx("reward_claim");
      }
      if (messages.length) {
        setToast(messages.join(" · "));
        window.setTimeout(() => setToast(null), 2600);
      }
      if (platformSession) {
        trackEvent("level_complete", platformSession, liveConfig, {
          levelId: playLevelId,
          stars: r.stars,
          steps: r.steps,
          durationMs: r.durationMs,
          won: r.won,
          masteryScore: mastery.score,
          masteryBadge: mastery.badge,
          dangerHits: r.dangerHits,
          toolUses: r.toolUses
        });
        ingestRewardProgress(platformSession, { kind: "level_clear", amount: 1, refId: `level:${playLevelId}` }).then((result) => {
          if (result.ok) setRewardCenter(result.data);
        });
        const eventResult = ingestEventProgress(platformSession, "level_clear", 1, liveConfig);
        if (eventResult.ok) setEventCenter(eventResult.data);
      }
    }

    persist(next);

    if (r.action === "next" && r.won && playLevelId < MAX_LEVEL_ID) {
      setPlayLevelId(playLevelId + 1);
      setRetryKey((k) => k + 1);
      return;
    }

    setPlayLevelId(null);
    setScreen("hub");
  };

  const buyMock = async (skuId: string) => {
    const sku = catalog.skus.find((item) => item.id === skuId);
    if (!sku) return;
    trackCampaign("purchase_intent", { skuId, priceLabel: sku.priceLabel });
    setShopConfirm(sku.title);
    if (!platformSession) {
      window.alert("账号初始化中，请稍后再试");
      setShopConfirm(null);
      return;
    }
    const tacticalText = (sku.tacticalContents ?? []).map((item) => `${TACTICAL_TOOL_META[item.toolId as ToolId]?.shortName ?? item.toolId}×${item.amount}`);
    const contentsText = [...sku.contents.map((item) => `${item.kind}×${item.amount}`), ...tacticalText, ...(sku.vipPoints ? [`VIP点×${sku.vipPoints}`] : [])].join("、");
    if (!window.confirm(`购买「${sku.title}」？\n价格：${sku.priceLabel}\n内容：${contentsText}\n用途：${sku.valueCopy ?? sku.description}`)) {
      trackCampaign("purchase_cancelled", { skuId });
      setShopConfirm(null);
      return;
    }
    const result = await runMockPurchase(platformSession, sku.id);
    if (!result.ok) {
      trackCampaign("purchase_failed", { skuId, errorCode: result.error.code });
      window.alert(result.error.message);
      setShopConfirm(null);
      return;
    }
    const nextSave = grantSkuToSave(save, result.data.sku);
    persist(nextSave);
    audioRef.current?.playSfx("purchase_success");
    trackCampaign("purchase_success", { skuId, amount: sku.amount, currency: sku.currency });
    setPlatformSyncText("钱包资产已入账");
    setShopConfirm(null);
  };

  const bindAccountMock = async () => {
    if (!platformSession) return;
    trackCampaign("account_bind_start");
    const result = await bindPlatformAccount(platformSession, {
      provider: "phone",
      identifier: `1380000${String(save.maxUnlockedLevel).padStart(4, "0")}`,
      verifyCode: "123456",
      mergeConfirmed: false
    });
    if (!result.ok) {
      trackCampaign("account_bind_failed", { errorCode: result.error.code });
      window.alert(result.error.message);
      return;
    }
    setPlatformSession(result.data);
    const synced = await syncCampaignProgress(result.data, save);
    trackCampaign("account_bind_success", { syncOk: synced.ok });
    setPlatformSyncText(synced.ok ? "云同步已开启" : "云同步待重试");
  };

  const runOffer = async (offer: RewardedAdOffer) => {
    if (!platformSession) {
      window.alert("账号初始化中，请稍后再试");
      return;
    }
    trackCampaign("ad_offer_start", { offerId: offer.id, placementId: offer.placementId, surface: offer.surface });
    audioRef.current?.playSfx("ad_start");
    const result = await runRewardedAdOffer(platformSession, offer.id, liveConfig);
    if (!result.ok) {
      trackCampaign("ad_offer_failed", { offerId: offer.id, errorCode: result.error.code });
      audioRef.current?.playSfx("failure");
      window.alert(result.error.message);
      return;
    }
    let next = { ...save };
    for (const reward of result.data.rewards) {
      if (reward.kind === "stamina") next = { ...next, stamina: Math.min(vipStaminaCap(next.vip), next.stamina + reward.amount) };
      if (reward.kind === "coins") next = { ...next, coins: next.coins + reward.amount };
      if (reward.kind === "hint") {
        next = grantToolCharges(next, { hint: reward.amount });
        setHintCredits((n) => n + reward.amount);
      }
    }
    persist(next);
    audioRef.current?.playSfx("ad_complete");
    audioRef.current?.playSfx("reward_claim");
    const eventResult = ingestEventProgress(platformSession, "ad_watch", 1, liveConfig);
    if (eventResult.ok) setEventCenter(eventResult.data);
    trackCampaign("ad_offer_rewarded", { offerId: offer.id, placementId: offer.placementId, rewards: offerRewardText(offer) });
    setPlatformSyncText("广告奖励已入账");
    setToast(`${offer.title} 奖励已到账：${offerRewardText(offer)}`);
    window.setTimeout(() => setToast(null), 2200);
  };

  const claimReward = async (rewardId: string) => {
    if (!platformSession) return;
    trackCampaign("reward_claim_start", { rewardId });
    const result = await claimRewardCenterItem(platformSession, rewardId);
    if (!result.ok) {
      trackCampaign("reward_claim_failed", { rewardId, errorCode: result.error.code });
      window.alert(result.error.message);
      return;
    }
    const next = { ...save };
    for (const item of result.data.reward.rewards) {
      if (item.kind === "coins") next.coins += item.amount;
      if (item.kind === "stamina") next.stamina = Math.min(vipStaminaCap(next.vip), next.stamina + item.amount);
      if (item.kind === "hint" || item.kind === "undo") Object.assign(next, grantToolCharges(next, { [item.kind]: item.amount }));
    }
    persist(next);
    audioRef.current?.playSfx("reward_claim");
    const refreshed = await loadRewardCenter(platformSession);
    if (refreshed.ok) setRewardCenter(refreshed.data);
    trackCampaign("reward_claim_success", { rewardId });
    setPlatformSyncText("奖励已领取");
  };

  const claimEventTask = async (eventId: string, taskId: string) => {
    if (!platformSession) return;
    trackCampaign("event_task_claim_start", { eventId, taskId });
    const result = await claimEventTaskReward(platformSession, eventId, taskId);
    if (!result.ok) {
      trackCampaign("event_task_claim_failed", { eventId, taskId, errorCode: result.error.code });
      audioRef.current?.playSfx("failure");
      window.alert(result.error.message);
      return;
    }
    const next = { ...save };
    for (const item of result.data.task.rewards) {
      if (item.kind === "coins") next.coins += item.amount;
      if (item.kind === "stamina") next.stamina = Math.min(vipStaminaCap(next.vip), next.stamina + item.amount);
      if (item.kind === "hint") {
        Object.assign(next, grantToolCharges(next, { hint: item.amount }));
        setHintCredits((n) => n + item.amount);
      }
      if (item.kind === "undo") Object.assign(next, grantToolCharges(next, { undo: item.amount }));
    }
    persist(next);
    audioRef.current?.playSfx("reward_claim");
    const refreshed = await loadEventCenter(platformSession, liveConfig);
    if (refreshed.ok) setEventCenter(refreshed.data);
    trackCampaign("event_task_claim_success", { eventId, taskId });
    setToast("活动奖励已到账");
    window.setTimeout(() => setToast(null), 2200);
  };

  const acceptConsent = async () => {
    trackCampaign("consent_accept");
    const next = acceptPrivacy(consent);
    const result = await updateConsentState(platformSession, next);
    if (result.ok) setConsent(result.data);
  };

  const updateAudio = (next: Partial<AudioSettings>) => {
    const updated = audioRef.current?.updateSettings(next) ?? { ...audioSettings, ...next, updatedAt: new Date().toISOString() };
    setAudioSettings(updated);
  };

  const closeHomePopup = () => {
    if (homePopup) trackCampaign("home_popup_close", { popupId: homePopup.id, campaignId: homePopup.campaignId });
    if (homePopup) closePopup(homePopup, platformSession);
    setHomePopup(null);
  };

  const suppressHomePopup = () => {
    if (homePopup) trackCampaign("home_popup_suppress", { popupId: homePopup.id, campaignId: homePopup.campaignId });
    if (homePopup) suppressPopupToday(homePopup, platformSession);
    setHomePopup(null);
  };

  const runPopupCta = () => {
    if (!homePopup) return;
    playTap();
    trackCampaign("home_popup_cta", { popupId: homePopup.id, campaignId: homePopup.campaignId, targetKind: homePopup.target.kind });
    const target = homePopup.target;
    setHomePopup(null);
    if (target.kind === "activity") setScreen("activity");
    if (target.kind === "shop") setScreen("shop");
    if (target.kind === "reward_center") setScreen("rewards");
    if (target.kind === "settings") setScreen("settings");
    if (target.kind === "ad_offer") {
      const offer = liveConfig.rewardedAdOffers.find((item) => item.id === target.offerId);
      if (offer) setAdPreviewOffer(offer);
    }
  };

  const revokeConsent = async () => {
    trackCampaign("consent_revoke_optional");
    const next = revokeOptionalConsent(consent);
    const result = await updateConsentState(platformSession, next);
    if (result.ok) setConsent(result.data);
  };

  const claimVipDaily = () => {
    if (vipTier.level < 1) {
      setScreen("shop");
      return;
    }
    const today = serverDay();
    if (save.vip.dailyClaimedAt === today) {
      setToast("今日 VIP 战术包已领取");
      window.setTimeout(() => setToast(null), 1800);
      return;
    }
    const next = applyRewardProfile(save, vipTier.dailyPack);
    persist({ ...next, vip: { ...next.vip, dailyClaimedAt: today } });
    audioRef.current?.playSfx("reward_claim");
    setToast(`VIP 每日战术包已到账：金币×${vipTier.dailyPack.coins}${vipTier.dailyPack.stamina ? ` / 体力×${vipTier.dailyPack.stamina}` : ""}`);
    window.setTimeout(() => setToast(null), 2200);
  };

  const levelWindow = useMemo(() => {
    const hi = Math.min(MAX_LEVEL_ID, save.maxUnlockedLevel + 1);
    const lo = Math.max(1, hi - 40);
    const arr: number[] = [];
    for (let i = lo; i <= hi; i++) arr.push(i);
    return arr;
  }, [save.maxUnlockedLevel]);

  const currentLevel = Math.min(save.maxUnlockedLevel, MAX_LEVEL_ID);
  const progressPct = Math.min(100, Math.round((currentLevel / MAX_LEVEL_ID) * 100));
  const homeOffers = offersForSurface(liveConfig, "home");
  const staminaOffer = liveConfig.rewardedAdOffers.find((item) => item.id === "stamina_home");
  const hintOffer = liveConfig.rewardedAdOffers.find((item) => item.id === "hint_home");
  const staminaEligibility = staminaOffer ? offerEligibility(platformSession, staminaOffer, liveConfig) : null;
  const hintEligibility = hintOffer ? offerEligibility(platformSession, hintOffer, liveConfig) : null;
  const shopGroups = [
    { id: "resources", title: "资源补给", subtitle: "金币、体力和基础恢复" },
    { id: "tactical_tools", title: "战术工具", subtitle: "扫描、冻结、架桥等解题工具" },
    { id: "chapter_prep", title: "章节备战", subtitle: "针对机关与遗物关的组合包" },
    { id: "vip", title: "VIP 权益", subtitle: "每日包、折扣、体力上限和战术槽" },
    { id: "limited", title: "限时大师包", subtitle: "高难章节的收益与容错" },
    { id: "starter", title: "新手恢复", subtitle: "连续挑战用的低门槛补给" }
  ];

  const overlays = (
    <>
      {toast && <div className="c-toast" role="status">{toast}</div>}
      {prepLevelId != null && (() => {
        const prep = getLevelSpec(prepLevelId);
        return (
          <div className="c-modal-backdrop" role="dialog" aria-modal="true" aria-label={`第${prep.levelId}关战术简报`}>
            <section className="c-level-prep">
              <button type="button" className="c-modal-close" onClick={() => setPrepLevelId(null)} aria-label="关闭战术简报">
                ×
              </button>
              <span className="c-store-kicker">TACTICAL BRIEF</span>
              <h2>{prep.chapter.name} · 第 {prep.levelId} 关</h2>
              <p>{prep.objectiveBrief}</p>
              <div className="c-prep-grid">
                <div><span>复杂度</span><strong>{"★".repeat(prep.complexity)}</strong></div>
                <div><span>类型</span><strong>{prep.masteryLabel}</strong></div>
                <div><span>体力</span><strong>消耗 1 / {staminaCap}</strong></div>
              </div>
              <div className="c-prep-section">
                <strong>目标</strong>
                {prep.objectives.map((objective) => (
                  <span key={objective.id}>{objective.required ? "必做" : "加分"} · {objective.label}</span>
                ))}
              </div>
              <div className="c-prep-section">
                <strong>推荐工具</strong>
                {prep.recommendedTools.map((tool) => (
                  <span key={tool}>{TACTICAL_TOOL_META[tool].shortName} · 库存 {save.toolInventory[tool] ?? 0}</span>
                ))}
              </div>
              {prep.firstTimeMechanic && <p className="c-prep-tip">新机制：{MODIFIER_COPY[prep.firstTimeMechanic].name}。{MODIFIER_COPY[prep.firstTimeMechanic].description}</p>}
              <div className="c-modal-actions">
                <button type="button" className="c-cta-secondary" onClick={() => setScreen("shop")}>
                  补充工具
                </button>
                <button type="button" className="c-cta-primary" onClick={() => beginLevel(prep.levelId)}>
                  <span>进入关卡</span>
                  <strong>START</strong>
                </button>
              </div>
            </section>
          </div>
        );
      })()}
      {adPreviewOffer && (
        <div className="c-modal-backdrop" role="dialog" aria-modal="true" aria-label={adPreviewOffer.title}>
          <section className="c-ad-preview">
            <button type="button" className="c-modal-close" onClick={() => setAdPreviewOffer(null)} aria-label="关闭广告确认">
              ×
            </button>
            <span className="c-ad-preview-icon">{adPreviewOffer.icon}</span>
            <span className="c-store-kicker">REWARDED AD</span>
            <h2>{adPreviewOffer.title}</h2>
            <p>{adPreviewOffer.disclosureText}</p>
            <div className="c-popup-rewards">{offerRewardText(adPreviewOffer)}</div>
            <div className="c-modal-actions">
              <button type="button" className="c-cta-secondary" onClick={() => setAdPreviewOffer(null)}>
                取消
              </button>
              <button
                type="button"
                className="c-cta-primary"
                onClick={() => {
                  const offer = adPreviewOffer;
                  setAdPreviewOffer(null);
                  runOffer(offer);
                }}
              >
                <span>{adPreviewOffer.ctaText}</span>
                <strong>看广告</strong>
              </button>
            </div>
          </section>
        </div>
      )}
      {screen === "hub" && homePopup && (
        <div className="c-modal-backdrop" role="dialog" aria-modal="true" aria-label={homePopup.title}>
          <section className="c-home-popup">
            <button type="button" className="c-modal-close" onClick={closeHomePopup} aria-label="关闭活动弹窗">
              ×
            </button>
            <div className="c-popup-art" aria-hidden>{homePopup.visualEmoji}</div>
            <span className="c-store-kicker">LIMITED EVENT</span>
            <h2>{homePopup.title}</h2>
            <p>{homePopup.subtitle}</p>
            <div className="c-popup-rewards">{popupRewardText(homePopup)}</div>
            {homePopup.disclosure === "ad" && <p className="c-ad-disclosure">需要观看完整广告后发放奖励</p>}
            <div className="c-modal-actions">
              <button type="button" className="c-cta-secondary" onClick={suppressHomePopup}>
                今日不再提示
              </button>
              <button type="button" className="c-cta-primary" onClick={runPopupCta}>
                <span>{homePopup.ctaLabel}</span>
                <strong>GO</strong>
              </button>
            </div>
          </section>
        </div>
      )}
    </>
  );

  if (screen === "play" && playLevelId != null && activeSpec) {
    return (
      <>
        <MazeLevelPlay
          key={`${playLevelId}-${retryKey}`}
          spec={activeSpec}
          save={save}
          activeObstacles={activeObstacles}
          bonusHintCharges={hintCredits}
          onHintShortage={() => hintOffer && setAdPreviewOffer(hintOffer)}
          onGameplayEvent={(name, data) => trackCampaign(name, data)}
          onToolUse={(tool) => persist(consumeToolCharge(save, tool))}
          extraLoadoutSlots={vipTier.benefits.extraLoadoutSlots}
          scannerRadiusBonus={vipTier.benefits.scannerRadiusBonus}
          postLevelOfferLabel={staminaOffer ? "看广告领体力 +3" : undefined}
          onPostLevelOffer={() => staminaOffer && setAdPreviewOffer(staminaOffer)}
          onResolve={onPlayResolve}
        />
        {overlays}
      </>
    );
  }

  if (screen === "shop") {
    return (
      <div className="campaign-hub c-shop-screen">
        <div className="c-hub-sky" aria-hidden />
        <header className="c-hub-top">
          <button type="button" className="c-icon-btn" onClick={() => goScreen("hub")}>
            ←
          </button>
          <h1 className="c-hub-title">战术商店</h1>
          <span />
        </header>
        <section className="c-store-hero">
          <span className="c-store-kicker">STORE</span>
          <h2>不是买数值，是买战术选择</h2>
          <p>商品目录版本：{catalog.version} · VIP {vipTier.level} 的体力、奖励、扫描半径和战术槽已实时生效 · 工具会直接进入关卡库存</p>
        </section>
        {shopGroups.map((group) => {
          const skus = catalog.skus.filter((sku) => (sku.category ?? "resources") === group.id);
          if (skus.length === 0) return null;
          return (
            <section key={group.id} className="c-shop-group">
              <div className="c-shop-group-head">
                <h3>{group.title}</h3>
                <p>{group.subtitle}</p>
              </div>
              <div className="c-sku-grid">
                {skus.map((sku) => {
                  const eligible = catalog.eligibility[sku.id]?.purchasable;
                  const tacticalText = (sku.tacticalContents ?? []).map((item) => `${TACTICAL_TOOL_META[item.toolId as ToolId]?.shortName ?? item.toolId} × ${item.amount}`);
                  const contentText = [...sku.contents.map((item) => `${item.kind} × ${item.amount}`), ...tacticalText, ...(sku.vipPoints ? [`VIP点 × ${sku.vipPoints}`] : [])].join(" / ");
                  return (
                    <button key={sku.id} type="button" className={`c-sku-card c-sku-card--${sku.category ?? "resources"}`} disabled={!eligible} onClick={() => buyMock(sku.id)}>
                      <span className="c-sku-shine" aria-hidden />
                      <span className="c-sku-tag">{sku.tags[0] ?? "HOT"}</span>
                      <span className="c-sku-ico">{sku.category === "vip" ? "👑" : sku.category === "tactical_tools" ? "🧰" : sku.contents.some((item) => item.kind === "stamina") ? "⚡" : "💎"}</span>
                      <span className="c-sku-name">{sku.title}</span>
                      <span className="c-shop-lead">{sku.valueCopy ?? sku.description}</span>
                      <span className="c-sku-content">{contentText}</span>
                      <span className="c-sku-price">{eligible ? sku.priceLabel : "暂不可购"}</span>
                    </button>
                  );
                })}
              </div>
            </section>
          );
        })}
        <p className="c-shop-note">可购商品：{purchasableSkus(catalog).length} / {catalog.skus.length}</p>
        {shopConfirm && <p className="c-shop-note">已选择：{shopConfirm}</p>}
        {overlays}
      </div>
    );
  }

  if (screen === "settings") {
    return (
      <div className="campaign-hub">
        <div className="c-hub-sky" aria-hidden />
        <header className="c-hub-top">
          <button type="button" className="c-icon-btn" onClick={() => goScreen("hub")}>
            ←
          </button>
          <h1 className="c-hub-title">设置</h1>
          <span />
        </header>
        <div className="c-settings-body">
          <p>音频、振动、隐私政策链接等设置。</p>
          <div className="c-audio-panel" aria-label="音频设置">
            <label><input type="checkbox" checked={!audioSettings.muted} onChange={(e) => updateAudio({ muted: !e.currentTarget.checked })} /> 总音频</label>
            <label><input type="checkbox" checked={audioSettings.musicEnabled} onChange={(e) => updateAudio({ musicEnabled: e.currentTarget.checked })} /> 背景音乐</label>
            <label><input type="checkbox" checked={audioSettings.sfxEnabled} onChange={(e) => updateAudio({ sfxEnabled: e.currentTarget.checked })} /> 操作音效</label>
            <label className="c-volume-row">音量 <input type="range" min="0" max="1" step="0.05" value={audioSettings.volume} onChange={(e) => updateAudio({ volume: Number(e.currentTarget.value) })} /></label>
          </div>
          <p className="c-muted">隐私版本：{consent.privacyTermsVersion} · {consent.privacyAcceptedAt ? "已同意" : "待同意"} · 分析 {consent.analyticsConsent ? "开" : "关"}</p>
          <div className="c-settings-actions">
            <button type="button" className="c-cta-secondary" onClick={acceptConsent}>
              同意隐私与商业化条款
            </button>
            <button type="button" className="c-cta-secondary" onClick={revokeConsent}>
              关闭可选数据/个性化广告
            </button>
          </div>
          <p className="c-muted">战役存档键：<code>campaign:save:v1</code>，与旧迷宫战绩 <code>maze:runs:v1</code> 共存。</p>
        </div>
        {overlays}
      </div>
    );
  }

  if (screen === "rewards") {
    return (
      <div className="campaign-hub c-shop-screen">
        <div className="c-hub-sky" aria-hidden />
        <header className="c-hub-top">
          <button type="button" className="c-icon-btn" onClick={() => goScreen("hub")}>
            ←
          </button>
          <h1 className="c-hub-title">奖励中心</h1>
          <span />
        </header>
        <section className="c-store-hero c-store-hero--reward">
          <span className="c-store-kicker">REWARD CENTER</span>
          <h2>今日奖励待领取</h2>
          <p>签到、任务、成就、邮件和活动奖励统一领取。</p>
        </section>
        <div className="c-reward-list">
          {homeOffers.map((offer) => (
            <article key={offer.id} className="c-ad-offer-row">
              <span>{offer.icon}</span>
              <div>
                <strong>{offer.title}</strong>
                <p>{offer.disclosureText}</p>
              </div>
              <button type="button" className="c-account-bind" onClick={() => setAdPreviewOffer(offer)}>
                {offer.ctaText}
              </button>
            </article>
          ))}
          {(rewardCenter?.rewards ?? []).map((reward) => (
            <article key={reward.id} className="c-reward-card">
              <div>
                <span className="c-account-kicker">{rewardKindLabel(reward.kind)}</span>
                <strong>{reward.title}</strong>
                <p>{reward.description}</p>
                {reward.progress && (
                  <div className="c-reward-progress" aria-label={`进度 ${reward.progress.current}/${reward.progress.target}`}>
                    <span style={{ width: `${Math.min(100, (reward.progress.current / reward.progress.target) * 100)}%` }} />
                  </div>
                )}
              </div>
              <button type="button" className="c-account-bind" disabled={reward.state !== "claimable"} onClick={() => claimReward(reward.id)}>
                {rewardStateLabel(reward.state)}
              </button>
            </article>
          ))}
          <section className="c-retention-section" aria-label="成就进度">
            <div className="c-shop-group-head">
              <h3>成就目标</h3>
              <p>把“会通关”变成“会打漂亮仗”。</p>
            </div>
            {ACHIEVEMENTS.map((achievement) => {
              const unlocked = Boolean(save.achievements[achievement.id]);
              return (
                <article key={achievement.id} className={`c-reward-card c-reward-card--achievement ${unlocked ? "c-reward-card--done" : ""}`}>
                  <div>
                    <span className="c-account-kicker">{unlocked ? "已解锁" : "挑战中"}</span>
                    <strong>{achievement.title}</strong>
                    <p>{achievement.description} · 奖励 金币×{achievement.reward.coins}{achievement.reward.stamina ? ` / 体力×${achievement.reward.stamina}` : ""}{achievement.reward.vipPoints ? ` / VIP点×${achievement.reward.vipPoints}` : ""}</p>
                  </div>
                  <button type="button" className="c-account-bind" disabled>
                    {unlocked ? "已领取" : "未完成"}
                  </button>
                </article>
              );
            })}
          </section>
          <section className="c-retention-section" aria-label="机制图鉴">
            <div className="c-shop-group-head">
              <h3>机制图鉴</h3>
              <p>首次遇到机制会解锁说明和小额发现奖励。</p>
            </div>
            {Object.entries(MODIFIER_COPY).map(([id, copy]) => {
              const unlocked = Boolean(save.codex[id as StrategicModifierId]);
              return (
                <article key={id} className={`c-reward-card c-reward-card--codex ${unlocked ? "c-reward-card--done" : ""}`}>
                  <div>
                    <span className="c-account-kicker">{unlocked ? "已发现" : "未发现"}</span>
                    <strong>{copy.name}</strong>
                    <p>{unlocked ? copy.description : "继续推进章节，首次遇到后解锁规则说明。"}</p>
                  </div>
                  <button type="button" className="c-account-bind" disabled>
                    {unlocked ? "已收录" : "探索中"}
                  </button>
                </article>
              );
            })}
          </section>
        </div>
        {overlays}
      </div>
    );
  }

  if (screen === "activity") {
    return (
      <div className="campaign-hub c-shop-screen">
        <div className="c-hub-sky" aria-hidden />
        <header className="c-hub-top">
          <button type="button" className="c-icon-btn" onClick={() => goScreen("hub")}>
            ←
          </button>
          <h1 className="c-hub-title">活动中心</h1>
          <span />
        </header>
        <section className="c-store-hero c-store-hero--event">
          <span className="c-store-kicker">LIVEOPS</span>
          <h2>限时活动进行中</h2>
          <p>完成活动任务，领取体力、金币和提示补给。</p>
        </section>
        <div className="c-event-list">
          {(eventCenter?.events ?? []).map((event: LiveEventDefinition) => (
            <article key={event.id} className={`c-event-card c-event-card--${event.visual.theme}`}>
              <div className="c-event-art" aria-hidden>{event.visual.emoji}</div>
              <div className="c-event-body">
                <span className="c-account-kicker">剩余 {eventTimeLeftLabel(event)}</span>
                <h2>{event.title}</h2>
                <p>{event.description}</p>
                <div className="c-event-tasks">
                  {event.tasks.map((task) => (
                    <div key={task.id} className="c-event-task">
                      <div>
                        <strong>{task.title}</strong>
                        <span>{task.progress}/{task.target} · {task.rewards.map((r) => `${r.kind}×${r.amount}`).join(" / ")}</span>
                      </div>
                      <button type="button" className="c-account-bind" disabled={task.state !== "claimable"} onClick={() => claimEventTask(event.id, task.id)}>
                        {rewardStateLabel(task.state)}
                      </button>
                    </div>
                  ))}
                </div>
                {event.cta.kind === "ad_offer" && event.cta.targetId && (
                  <button type="button" className="c-cta-primary c-event-cta" onClick={() => {
                    const offer = liveConfig.rewardedAdOffers.find((item) => item.id === event.cta.targetId);
                    if (offer) setAdPreviewOffer(offer);
                  }}>
                    <span>{event.cta.label}</span><strong>AD</strong>
                  </button>
                )}
              </div>
            </article>
          ))}
          {eventCenter && eventCenter.events.length === 0 && <div className="c-empty-premium">暂无活动，新的星门补给正在路上。</div>}
        </div>
        {overlays}
      </div>
    );
  }

  return (
    <div className="campaign-hub">
      <div className="c-hub-sky" aria-hidden />
      <div className="c-hub-orbit c-hub-orbit--one" aria-hidden />
      <div className="c-hub-orbit c-hub-orbit--two" aria-hidden />
      <header className="c-hub-top c-resource-bar">
        <div className="c-res">
          <span className="c-res-ico">🪙</span>
          <span className="c-res-val">{save.coins}</span>
        </div>
        <div className="c-res">
          <span className="c-res-ico">⚡</span>
          <span className="c-res-val">
            {save.stamina}/{staminaCap}
          </span>
        </div>
        <button type="button" className="c-icon-btn" onClick={() => goScreen("settings")} aria-label="设置">
          ⚙
        </button>
      </header>

      <section className="c-account-panel" aria-label="账号状态">
        <span className="c-account-avatar" aria-hidden>{accountSummary.state === "bound" ? "👑" : "🧭"}</span>
        <div>
          <span className="c-account-kicker">ACCOUNT</span>
          <strong>{accountSummary.label}</strong>
          <p>{accountSummary.detail} · {platformSyncText}</p>
        </div>
        <button type="button" className="c-account-tier c-account-tier--live" onClick={claimVipDaily} title={vipTier.level > 0 ? "领取 VIP 每日战术包" : "查看 VIP 权益"}>
          {vipTier.name}
        </button>
        {accountSummary.state === "guest" && (
          <button type="button" className="c-account-bind" onClick={bindAccountMock}>
            绑定
          </button>
        )}
      </section>

      <section className="c-hub-hero">
        <div className="c-hero-copy">
          <span className="c-season-pill">S1 星门远征</span>
          <h1 className="c-brand-title">迷宫大冒险</h1>
          <p className="c-brand-sub">成人策略迷宫 · {MAX_LEVEL_ID} 关 · 钥匙、巡逻、机关、遗物多层解题</p>
        </div>
        <div className="c-hero-mascot" aria-hidden>
          <span className="c-mascot-aura" />
          <span className="c-mascot-token">🐼</span>
        </div>
        <div className="c-season-track" aria-label={`战役进度 ${progressPct}%`}>
          <div>
            <span>当前第 {currentLevel} 关</span>
            <strong>{progressPct}%</strong>
          </div>
          <span className="c-season-bar"><span style={{ width: `${progressPct}%` }} /></span>
        </div>
        <div className="c-hub-stats">
          <div className="c-stat-chip c-stat-chip--level">
            <span className="c-stat-k">最高关卡</span>
            <span className="c-stat-v">{summary.max}</span>
          </div>
          <div className="c-stat-chip c-stat-chip--stars">
            <span className="c-stat-k">累计星数</span>
            <span className="c-stat-v">{summary.stars}</span>
          </div>
          <div className="c-stat-chip c-stat-chip--vip">
            <span className="c-stat-k">VIP 权益</span>
            <span className="c-stat-v">{nextVip ? `${save.vip.points}/${nextVip.minPoints}` : "MAX"}</span>
          </div>
        </div>
      </section>
      <section className="c-vip-panel" aria-label="VIP 权益">
        <div>
          <span className="c-store-kicker">VIP BENEFITS</span>
          <h2>{vipTier.name}</h2>
          <p>
            体力上限 +{vipTier.benefits.staminaCapBonus} · 恢复加速 {vipTier.benefits.staminaRegenReductionPct}% · 奖励 +{vipTier.benefits.rewardBonusPct}% · 额外战术槽 {vipTier.benefits.extraLoadoutSlots} · 扫描半径 +{vipTier.benefits.scannerRadiusBonus}
          </p>
        </div>
        <button type="button" className="c-account-bind" onClick={claimVipDaily}>
          {vipTier.level > 0 ? (save.vip.dailyClaimedAt === serverDay() ? "今日已领" : "领每日包") : "去开通"}
        </button>
      </section>

      <section className="c-retention-grid" aria-label="每日目标与长期成长">
        <article className={`c-retention-card c-retention-card--daily ${dailyState.completedAt ? "c-retention-card--done" : ""}`}>
          <span className="c-store-kicker">DAILY CHALLENGE</span>
          <h2>今日战术挑战</h2>
          <p>第 {dailyState.levelId} 关 · {dailySpec.masteryLabel} · {dailySpec.modifierIds.map((modifier) => MODIFIER_COPY[modifier].short).slice(0, 3).join(" / ") || dailySpec.chapter.subtitle}</p>
          <div className="c-retention-reward">
            <span>奖励 金币×120 / 体力×1 / 扫描×1</span>
            <strong>{dailyState.completedAt ? "已完成" : "待挑战"}</strong>
          </div>
          <button type="button" className="c-account-bind" disabled={Boolean(dailyState.completedAt)} onClick={() => startLevel(dailyState.levelId)}>
            {dailyState.completedAt ? "今日完成" : "开始每日"}
          </button>
        </article>
        <article className="c-retention-card c-retention-card--streak">
          <span className="c-store-kicker">STREAK</span>
          <h2>连续挑战 {save.streak.count} 天</h2>
          <p>最佳 {save.streak.best} 天 · 下一次首胜奖励：金币×{dailyReward.coins}{dailyReward.stamina ? ` / 体力×${dailyReward.stamina}` : ""}{dailyReward.vipPoints ? ` / VIP点×${dailyReward.vipPoints}` : ""}</p>
          <div className="c-retention-reward">
            <span>今日状态</span>
            <strong>{save.streak.lastClearDay === today ? "已续签" : "首胜续签"}</strong>
          </div>
        </article>
        <article className="c-retention-card c-retention-card--mastery">
          <span className="c-store-kicker">MASTERY</span>
          <h2>大师总分 {masteryScore}</h2>
          <p>成就 {unlockedAchievementCount}/{ACHIEVEMENTS.length} · 图鉴 {discoveredCodexCount}/{Object.keys(MODIFIER_COPY).length}</p>
          <div className="c-retention-reward">
            <span>长期目标</span>
            <strong>全章节 S 级</strong>
          </div>
        </article>
      </section>

      <section className="c-hub-actions">
        <button type="button" className="c-cta-primary" onClick={() => startLevel(currentLevel)}>
          <span>开始挑战</span>
          <strong>{getLevelSpec(currentLevel).masteryLabel} · 第 {currentLevel} 关</strong>
        </button>
        <div className="c-feature-grid">
          <button type="button" className="c-feature-card c-feature-card--shop" onClick={() => goScreen("shop")} aria-label="商店">
            <span>🧰</span><strong>战术商店</strong><em>{purchasableSkus(catalog).length} 个策略商品</em>
          </button>
          <button type="button" className="c-feature-card c-feature-card--ad" disabled={staminaEligibility?.state !== "available"} onClick={() => staminaOffer && setAdPreviewOffer(staminaOffer)} aria-label="看广告领体力">
            <span>🎬</span><strong>看广告领体力</strong><em>{staminaEligibility?.state === "cooldown" ? `${staminaEligibility.remainingCooldownSec}s 后可用` : staminaOffer ? offerRewardText(staminaOffer) : "补给冷却中"}</em>
          </button>
          <button type="button" className="c-feature-card c-feature-card--hint" disabled={hintEligibility?.state !== "available"} onClick={() => hintOffer && setAdPreviewOffer(hintOffer)} aria-label="看广告得提示">
            <span>💡</span><strong>看广告得提示</strong><em>{hintEligibility?.state === "cooldown" ? `${hintEligibility.remainingCooldownSec}s 后可用` : hintOffer ? offerRewardText(hintOffer) : "提示补给"}</em>
          </button>
          <button type="button" className="c-feature-card c-feature-card--event" onClick={() => goScreen("activity")} aria-label="活动中心">
            <span>🚀</span><strong>活动中心</strong><em>{eventCenter?.claimableCount ? `${eventCenter.claimableCount} 个可领` : "限时任务"}</em>
          </button>
          <button type="button" className="c-feature-card c-feature-card--reward" onClick={() => goScreen("rewards")} aria-label={`奖励中心${rewardCenter?.claimableCount ? `（${rewardCenter.claimableCount}）` : ""}`}>
            <span>🎁</span><strong>奖励中心</strong><em>{rewardCenter?.claimableCount ? `${rewardCenter.claimableCount} 个可领` : "每日任务"}</em>
          </button>
          <button type="button" className="c-feature-card c-feature-card--event" onClick={() => goScreen("settings")}>
            <span>🛡️</span><strong>合规设置</strong><em>{consent.privacyAcceptedAt ? "已同意" : "待同意"}</em>
          </button>
        </div>
      </section>

      <section className="c-level-map" aria-label="关卡地图">
        <h2 className="c-section-title">关卡</h2>
        <p className="c-muted">已解锁至 {save.maxUnlockedLevel}，每关消耗 1 体力</p>
        <div className="c-level-grid">
          {levelWindow.map((id) => {
            const locked = id > save.maxUnlockedLevel;
            const rec = save.perLevel[String(id)];
            const spec = getLevelSpec(id);
            return (
              <button
                key={id}
                type="button"
                className={`c-level-node ${locked ? "c-level-node--locked" : ""}`}
                disabled={locked}
                onClick={() => startLevel(id)}
                aria-label={locked ? `第${id}关未解锁` : `开始第${id}关`}
              >
                <span className="c-level-num">{id}</span>
                <span className="c-level-type">{spec.masteryLabel}</span>
                <span className="c-level-mods">{spec.modifierIds.slice(0, 2).map((modifier) => MODIFIER_COPY[modifier].short).join(" / ") || spec.chapter.subtitle}</span>
                {rec && rec.stars > 0 && <span className="c-level-stars">{"★".repeat(rec.stars)}</span>}
              </button>
            );
          })}
        </div>
      </section>
      {overlays}
    </div>
  );
}
