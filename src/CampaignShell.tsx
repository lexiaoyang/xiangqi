import { useCallback, useMemo, useState } from "react";
import { MAX_LEVEL_ID } from "./campaign/constants";
import { filterObstaclesForRun } from "./campaign/mechanics";
import { getLevelSpec } from "./campaign/levelSpec";
import { applyToolUnlocksFromProgress, loadCampaignSave, regenStamina, saveCampaignSave } from "./campaign/persist";
import type { CampaignSaveV1 } from "./campaign/types";
import { MazeLevelPlay, type PlayResolve } from "./MazeLevelPlay";

type Screen = "hub" | "play" | "shop" | "settings";

export function CampaignShell() {
  const [save, setSave] = useState<CampaignSaveV1>(() => applyToolUnlocksFromProgress(regenStamina(loadCampaignSave())));
  const [screen, setScreen] = useState<Screen>("hub");
  const [playLevelId, setPlayLevelId] = useState<number | null>(null);
  const [retryKey, setRetryKey] = useState(0);
  const [shopConfirm, setShopConfirm] = useState<string | null>(null);

  const persist = useCallback((next: CampaignSaveV1) => {
    const merged = applyToolUnlocksFromProgress(regenStamina(next));
    setSave(merged);
    saveCampaignSave(merged);
  }, []);

  const summary = useMemo(() => {
    let stars = 0;
    for (const r of Object.values(save.perLevel)) {
      stars += r.stars;
    }
    return { stars, max: save.maxUnlockedLevel };
  }, [save]);

  const startLevel = (levelId: number) => {
    if (save.stamina < 1) {
      window.alert("体力不足，稍后再来或去商店看看～");
      return;
    }
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

  const onPlayResolve = (r: PlayResolve) => {
    if (!playLevelId || !activeSpec) return;
    let next = { ...save };

    if (r.action === "retry") {
      if (next.stamina < 1) {
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
      next.coins += 8 + r.stars * 6;
    }

    persist(next);

    if (r.action === "next" && r.won && playLevelId < MAX_LEVEL_ID) {
      if (next.stamina < 1) {
        setPlayLevelId(null);
        setScreen("hub");
        window.alert("体力不足，先回大厅休息一下吧");
        return;
      }
      const n2 = { ...next, stamina: next.stamina - 1 };
      persist(n2);
      setPlayLevelId(playLevelId + 1);
      setRetryKey((k) => k + 1);
      return;
    }

    setPlayLevelId(null);
    setScreen("hub");
  };

  const buyMock = (sku: string, price: number) => {
    setShopConfirm(sku);
    if (save.coins < price) {
      window.alert("金币不足");
      setShopConfirm(null);
      return;
    }
    if (!window.confirm(`花费 ${price} 金币购买「${sku}」？（演示）`)) {
      setShopConfirm(null);
      return;
    }
    if (sku.includes("体力")) persist({ ...save, coins: save.coins - price, stamina: Math.min(30, save.stamina + 5) });
    else persist({ ...save, coins: save.coins - price });
    setShopConfirm(null);
  };

  const levelWindow = useMemo(() => {
    const hi = Math.min(MAX_LEVEL_ID, save.maxUnlockedLevel + 1);
    const lo = Math.max(1, hi - 40);
    const arr: number[] = [];
    for (let i = lo; i <= hi; i++) arr.push(i);
    return arr;
  }, [save.maxUnlockedLevel]);

  if (screen === "play" && playLevelId != null && activeSpec) {
    return (
      <MazeLevelPlay
        key={`${playLevelId}-${retryKey}`}
        spec={activeSpec}
        save={save}
        activeObstacles={activeObstacles}
        onResolve={onPlayResolve}
      />
    );
  }

  if (screen === "shop") {
    return (
      <div className="campaign-hub c-shop-screen">
        <header className="c-hub-top">
          <button type="button" className="c-icon-btn" onClick={() => setScreen("hub")}>
            ←
          </button>
          <h1 className="c-hub-title">宝石商店</h1>
          <span />
        </header>
        <p className="c-shop-lead">演示占位 · 后续可接真实 IAP / 广告券</p>
        <div className="c-sku-grid">
          <button type="button" className="c-sku-card" onClick={() => buyMock("体力小包 +5", 50)}>
            <span className="c-sku-ico">⚡</span>
            <span className="c-sku-name">体力 +5</span>
            <span className="c-sku-price">50 币</span>
          </button>
          <button type="button" className="c-sku-card" onClick={() => buyMock("金币福袋", 30)}>
            <span className="c-sku-ico">🪙</span>
            <span className="c-sku-name">金币福袋</span>
            <span className="c-sku-price">30 币</span>
          </button>
          <button type="button" className="c-sku-card" onClick={() => buyMock("提示礼包", 80)}>
            <span className="c-sku-ico">💡</span>
            <span className="c-sku-name">提示礼包</span>
            <span className="c-sku-price">80 币</span>
          </button>
        </div>
        {shopConfirm && <p className="c-shop-note">已选择：{shopConfirm}</p>}
      </div>
    );
  }

  if (screen === "settings") {
    return (
      <div className="campaign-hub">
        <header className="c-hub-top">
          <button type="button" className="c-icon-btn" onClick={() => setScreen("hub")}>
            ←
          </button>
          <h1 className="c-hub-title">设置</h1>
          <span />
        </header>
        <div className="c-settings-body">
          <p>音效、振动、隐私政策链接等占位。</p>
          <p className="c-muted">战役存档键：<code>campaign:save:v1</code>，与旧迷宫战绩 <code>maze:runs:v1</code> 共存。</p>
        </div>
      </div>
    );
  }

  return (
    <div className="campaign-hub">
      <div className="c-hub-sky" aria-hidden />
      <header className="c-hub-top c-resource-bar">
        <div className="c-res">
          <span className="c-res-ico">🪙</span>
          <span className="c-res-val">{save.coins}</span>
        </div>
        <div className="c-res">
          <span className="c-res-ico">⚡</span>
          <span className="c-res-val">
            {save.stamina}/30
          </span>
        </div>
        <button type="button" className="c-icon-btn" onClick={() => setScreen("settings")} aria-label="设置">
          ⚙
        </button>
      </header>

      <section className="c-hub-hero">
        <h1 className="c-brand-title">迷宫大冒险</h1>
        <p className="c-brand-sub">闯关模式 · {MAX_LEVEL_ID} 关 · 越往后越刺激</p>
        <div className="c-hub-stats">
          <div className="c-stat-chip">
            <span className="c-stat-k">最高关卡</span>
            <span className="c-stat-v">{summary.max}</span>
          </div>
          <div className="c-stat-chip">
            <span className="c-stat-k">累计星数</span>
            <span className="c-stat-v">{summary.stars}</span>
          </div>
        </div>
      </section>

      <section className="c-hub-actions">
        <button type="button" className="c-cta-primary" onClick={() => startLevel(Math.min(save.maxUnlockedLevel, MAX_LEVEL_ID))}>
          继续闯关（第 {Math.min(save.maxUnlockedLevel, MAX_LEVEL_ID)} 关）
        </button>
        <button type="button" className="c-cta-secondary" onClick={() => setScreen("shop")}>
          商店
        </button>
      </section>

      <section className="c-level-map" aria-label="关卡地图">
        <h2 className="c-section-title">关卡</h2>
        <p className="c-muted">已解锁至 {save.maxUnlockedLevel}，每关消耗 1 体力</p>
        <div className="c-level-grid">
          {levelWindow.map((id) => {
            const locked = id > save.maxUnlockedLevel;
            const rec = save.perLevel[String(id)];
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
                {rec && rec.stars > 0 && <span className="c-level-stars">{"★".repeat(rec.stars)}</span>}
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}
