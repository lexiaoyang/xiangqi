import { useCallback, useEffect, useRef, useState } from "react";
import { appendLocalRun, fetchLeaderboard, getOrCreatePlayerId, newClientRunId, postRunRemote } from "./history/client";
import { RUN_SCHEMA_VERSION, type LeaderboardRow, type RunRecordV1 } from "./history/types";
import { applyDirection, buildGameBundle, equalPos } from "./maze/gameState";
import { gridDimensions } from "./maze/generate";
import { ENCOURAGEMENT, SCENES, WIN_PHRASES, sceneById, type SceneId } from "./maze/scenes";
import type { Dir, GameBundle, MazeDifficulty, RunMode } from "./maze/types";

const difficultyLabel: Record<MazeDifficulty, string> = {
  easy: "简单",
  medium: "中等",
  hard: "挑战",
  expert: "达人"
};

const SWIPE_MIN = 28;

const CONFETTI_COLORS = ["#ff6b6b", "#ffd93d", "#6bcb77", "#4d96ff", "#c084fc", "#fb7185", "#38bdf8", "#f472b6", "#fbbf24", "#34d399", "#a78bfa", "#f97316", "#22d3ee", "#e879f9"];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

function gustArrow(d: Dir): string {
  const m: Record<Dir, string> = { up: "↑", down: "↓", left: "←", right: "→" };
  return m[d];
}

function dist2(a: { x: number; y: number }, b: { x: number; y: number }): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export default function LegacyMazeApp() {
  const [sceneId, setSceneId] = useState<SceneId>("forest");
  const [difficulty, setDifficulty] = useState<MazeDifficulty>("easy");
  const [runMode, setRunMode] = useState<RunMode>("practice");
  const scene = sceneById(sceneId);
  const [game, setGame] = useState<GameBundle>(() => buildGameBundle("forest", "easy"));
  const [steps, setSteps] = useState(0);
  const [won, setWon] = useState(false);
  const [motto, setMotto] = useState(() => pick(ENCOURAGEMENT));
  const [winHeadline, setWinHeadline] = useState("");
  const [zoom, setZoom] = useState(1);
  const [lbRows, setLbRows] = useState<LeaderboardRow[]>([]);
  const [lbSort, setLbSort] = useState<"durationMs" | "steps">("durationMs");
  const zoomRef = useRef(1);
  const pointerStart = useRef<{ x: number; y: number } | null>(null);
  const boardPointers = useRef(new Map<number, { x: number; y: number }>());
  const pinchBase = useRef<{ dist: number; zoom: number } | null>(null);
  const pinchUsed = useRef(false);
  const gameStartMs = useRef(Date.now());
  const treatGoalRef = useRef(0);
  const submittedWin = useRef(false);
  const [winDurationMs, setWinDurationMs] = useState(0);

  const { maze, player, goal, mechanic, treatsRemaining, gustMap, portalPair } = game;
  const { rows, cols } = gridDimensions(maze);

  const resetGame = useCallback(() => {
    const g = buildGameBundle(sceneId, difficulty);
    setGame(g);
    setSteps(0);
    setWon(false);
    setWinHeadline("");
    setWinDurationMs(0);
    submittedWin.current = false;
    setMotto(pick(ENCOURAGEMENT));
    gameStartMs.current = Date.now();
    const s = sceneById(sceneId);
    treatGoalRef.current = s.mechanic === "collect" ? g.treatsRemaining.size : 0;
  }, [sceneId, difficulty]);

  useEffect(() => {
    zoomRef.current = zoom;
  }, [zoom]);

  useEffect(() => {
    resetGame();
  }, [resetGame]);

  const tryStep = useCallback(
    (dir: Dir) => {
      if (won) return;
      setGame((g) => {
        const res = applyDirection(g, dir);
        if (!res.moved) return g;
        setSteps((s) => s + 1);
        if (res.won) {
          setWon(true);
          setWinHeadline(pick(WIN_PHRASES));
        }
        return res.game;
      });
    },
    [won]
  );

  useEffect(() => {
    if (!won) {
      submittedWin.current = false;
      return;
    }
    if (submittedWin.current) return;
    submittedWin.current = true;
    const durationMs = Math.max(0, Date.now() - gameStartMs.current);
    setWinDurationMs(durationMs);
    const treatsTotal = treatGoalRef.current;
    const record: RunRecordV1 = {
      schemaVersion: RUN_SCHEMA_VERSION,
      clientRunId: newClientRunId(),
      clientPlayerId: getOrCreatePlayerId(),
      playedAt: new Date().toISOString(),
      durationMs,
      steps,
      difficulty,
      sceneId,
      mode: runMode,
      mechanic,
      won: true,
      extras:
        mechanic === "collect"
          ? { treatsTotal, treatsRemainingEnd: treatsRemaining.size }
          : mechanic === "portal"
            ? { portalPair: portalPair ? true : false }
            : undefined
    };
    appendLocalRun(record);
    void postRunRemote(record);
    if (runMode === "ranked") {
      void fetchLeaderboard({ sceneId, difficulty, mode: "ranked", sort: lbSort, limit: 15 }).then(setLbRows);
    }
  }, [won, steps, difficulty, sceneId, runMode, mechanic, treatsRemaining.size, portalPair, lbSort]);

  const refreshLb = useCallback(() => {
    void fetchLeaderboard({ sceneId, difficulty, mode: "ranked", sort: lbSort, limit: 15 }).then(setLbRows);
  }, [sceneId, difficulty, lbSort]);

  useEffect(() => {
    refreshLb();
  }, [refreshLb]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (won) return;
      const map: Record<string, Dir> = {
        ArrowUp: "up",
        ArrowDown: "down",
        ArrowLeft: "left",
        ArrowRight: "right"
      };
      const d = map[e.key];
      if (!d) return;
      e.preventDefault();
      tryStep(d);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [tryStep, won]);

  const onBoardPointerDown = (e: React.PointerEvent) => {
    boardPointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (boardPointers.current.size === 2) {
      const [a, b] = [...boardPointers.current.values()];
      pinchBase.current = { dist: dist2(a, b), zoom: zoomRef.current };
      pinchUsed.current = false;
    }
    pointerStart.current = { x: e.clientX, y: e.clientY };
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
  };

  const onBoardPointerMove = (e: React.PointerEvent) => {
    if (!boardPointers.current.has(e.pointerId)) return;
    boardPointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (boardPointers.current.size === 2 && pinchBase.current) {
      const [a, b] = [...boardPointers.current.values()];
      const d = dist2(a, b);
      if (d > 8 && pinchBase.current.dist > 8) {
        pinchUsed.current = true;
        const ratio = d / pinchBase.current.dist;
        const next = clamp(pinchBase.current.zoom * ratio, 0.55, 2.85);
        setZoom(next);
        pinchBase.current = { dist: d, zoom: next };
      }
    }
  };

  const onBoardPointerUp = (e: React.PointerEvent) => {
    boardPointers.current.delete(e.pointerId);
    if (boardPointers.current.size < 2) pinchBase.current = null;

    const start = pointerStart.current;
    pointerStart.current = null;
    if (!start || won || pinchUsed.current) {
      pinchUsed.current = false;
      return;
    }
    const dx = e.clientX - start.x;
    const dy = e.clientY - start.y;
    if (Math.abs(dx) < SWIPE_MIN && Math.abs(dy) < SWIPE_MIN) return;
    if (Math.abs(dx) >= Math.abs(dy)) tryStep(dx > 0 ? "right" : "left");
    else tryStep(dy > 0 ? "down" : "up");
  };

  const onWheelZoom = (e: React.WheelEvent) => {
    if (!e.ctrlKey && !e.metaKey) return;
    e.preventDefault();
    setZoom((z) => clamp(z - e.deltaY * 0.0025, 0.55, 2.85));
  };

  const sameCell = (r: number, c: number) => player.row === r && player.col === c;
  const isGoalCell = (r: number, c: number) => goal.row === r && goal.col === c;
  const onPortal = (r: number, c: number) =>
    portalPair && (equalPos(portalPair.a, { row: r, col: c }) || equalPos(portalPair.b, { row: r, col: c }));

  const collectLeft = mechanic === "collect" ? treatsRemaining.size : 0;
  const collectDone = mechanic === "collect" && treatsRemaining.size === 0;

  return (
    <div className="maze-shell">
      <div className="maze-sky" aria-hidden />
      <div className="maze-app" data-theme={sceneId}>
        <div className="maze-float maze-float--1" aria-hidden />
        <div className="maze-float maze-float--2" aria-hidden />
        <div className="maze-float maze-float--3" aria-hidden />

        <header className="maze-hero">
          <div className="maze-hero-badge" aria-hidden>
            <span className="maze-hero-ico">{scene.playerEmoji}</span>
          </div>
          <div className="maze-hero-text">
            <p className="maze-hero-kicker">小小冒险 · 迷宫练习</p>
            <h1>
              <span className="maze-title-gradient">走迷宫</span>
              <span className="maze-title-sub">大冒险</span>
            </h1>
            <p className="maze-hero-theme-line">
              <strong>{scene.label}</strong>
              <span className="maze-dot">·</span>
              {scene.tagline}
            </p>
            <p className="maze-hero-tip">“{motto}”</p>
          </div>
        </header>

        <section className="maze-dashboard" aria-label="游戏设置">
          <div className="maze-card maze-card--settings">
            <h2 className="maze-card-title">场景与难度</h2>
            <p className="maze-mechanic-hint">
              {mechanic === "standard" && "玩法：经典路线，直达终点。"}
              {mechanic === "collect" && "玩法：先收集所有糖果，终点才会解锁。"}
              {mechanic === "gust" && "玩法：带箭头的是洋流格，踩上去会再滑一步。"}
              {mechanic === "portal" && "玩法：两处星门成对传送，规划跳跃顺序。"}
            </p>
            <div className="maze-theme-chips" role="group" aria-label="选择场景">
              {SCENES.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  className={`maze-chip ${sceneId === s.id ? "maze-chip--on" : ""}`}
                  onClick={() => setSceneId(s.id)}
                  aria-pressed={sceneId === s.id}
                  aria-label={`场景：${s.label}`}
                >
                  <span className="maze-chip-emoji" aria-hidden>
                    {s.playerEmoji}
                  </span>
                  <span className="maze-chip-label">{s.short}</span>
                </button>
              ))}
            </div>
            <label className="maze-field">
              迷宫难度
              <select value={difficulty} onChange={(e) => setDifficulty(e.target.value as MazeDifficulty)} aria-label="选择难度">
                <option value="easy">{difficultyLabel.easy}</option>
                <option value="medium">{difficultyLabel.medium}</option>
                <option value="hard">{difficultyLabel.hard}</option>
                <option value="expert">{difficultyLabel.expert}</option>
              </select>
            </label>
            <div className="maze-mode-row">
              <span className="maze-mode-label">对局模式</span>
              <div className="maze-mode-toggle" role="group" aria-label="对局模式">
                <button type="button" className={runMode === "practice" ? "on" : ""} onClick={() => setRunMode("practice")}>
                  自由练习
                </button>
                <button type="button" className={runMode === "ranked" ? "on" : ""} onClick={() => setRunMode("ranked")}>
                  挑战计时
                </button>
              </div>
              <p className="maze-mode-note">{runMode === "ranked" ? "通关成绩会计入排行榜（同场景+难度）。" : "不计榜，随便重开。"}</p>
            </div>
          </div>

          <div className="maze-card maze-card--stats">
            <h2 className="maze-card-title">本局进度</h2>
            <div className="maze-stat-pills">
              <div className="maze-pill">
                <span className="maze-pill-label">步数</span>
                <span className="maze-pill-value">{steps}</span>
              </div>
              <div className="maze-pill maze-pill--soft">
                <span className="maze-pill-label">地图</span>
                <span className="maze-pill-value">
                  {rows}×{cols}
                </span>
              </div>
              {mechanic === "collect" && (
                <div className="maze-pill maze-pill--accent">
                  <span className="maze-pill-label">糖果剩余</span>
                  <span className="maze-pill-value">{collectLeft}</span>
                </div>
              )}
            </div>
            <div className="maze-zoom-bar">
              <span className="maze-zoom-label">缩放</span>
              <button type="button" className="maze-zoom-btn" aria-label="缩小" onClick={() => setZoom((z) => clamp(z - 0.12, 0.55, 2.85))}>
                −
              </button>
              <span className="maze-zoom-val">{Math.round(zoom * 100)}%</span>
              <button type="button" className="maze-zoom-btn" aria-label="放大" onClick={() => setZoom((z) => clamp(z + 0.12, 0.55, 2.85))}>
                +
              </button>
              <span className="maze-zoom-hint">双指捏合 · 桌面可按住 Ctrl 滚轮</span>
            </div>
            <button type="button" className="maze-btn-secondary maze-btn-wide" onClick={resetGame}>
              换一张迷宫地图
            </button>
          </div>

          <div className="maze-card maze-card--lb">
            <div className="maze-lb-head">
              <h2 className="maze-card-title">挑战榜</h2>
              <button type="button" className="maze-btn-ghost" onClick={refreshLb}>
                刷新
              </button>
            </div>
            <p className="maze-lb-sub">当前筛选：{scene.short} · {difficultyLabel[difficulty]} · 挑战计时</p>
            <div className="maze-lb-sort">
              <button type="button" className={lbSort === "durationMs" ? "on" : ""} onClick={() => setLbSort("durationMs")}>
                按用时
              </button>
              <button type="button" className={lbSort === "steps" ? "on" : ""} onClick={() => setLbSort("steps")}>
                按步数
              </button>
            </div>
            <div className="maze-lb-table-wrap">
              <table className="maze-lb-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>用时</th>
                    <th>步数</th>
                    <th>玩家</th>
                  </tr>
                </thead>
                <tbody>
                  {lbRows.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="maze-lb-empty">
                        暂无记录。开启「挑战计时」通关后写入；本地需先运行 <code>npm run dev:server</code> 并 <code>npm run dev</code> 走代理。
                      </td>
                    </tr>
                  ) : (
                    lbRows.map((r) => (
                      <tr key={`${r.rank}-${r.clientPlayerId}-${r.playedAt}`}>
                        <td>{r.rank}</td>
                        <td>{(r.durationMs / 1000).toFixed(2)}s</td>
                        <td>{r.steps}</td>
                        <td className="maze-mono">{r.clientPlayerId.slice(0, 6)}…</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <div className="maze-board-stage">
          <div className="maze-board-ribbon" aria-hidden>
            <span>起点</span>
            <span className="maze-ribbon-mid">{scene.playerEmoji}</span>
            <span>→</span>
            <span className="maze-ribbon-mid">{collectDone || mechanic !== "collect" ? scene.goalEmoji : "🔒"}</span>
            <span>终点</span>
          </div>
          <div
            className="maze-board-wrap"
            onPointerDown={onBoardPointerDown}
            onPointerMove={onBoardPointerMove}
            onPointerUp={onBoardPointerUp}
            onPointerCancel={onBoardPointerUp}
            onWheel={onWheelZoom}
            role="application"
            aria-label="迷宫场地，单指滑动移动，双指缩放"
          >
            <div className="maze-zoom-viewport">
              <div className="maze-zoom-surface" style={{ transform: `scale(${zoom})`, transformOrigin: "center top" }}>
                <div className="maze-board-inner">
                  <div
                    className="maze-grid"
                    style={{
                      gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
                      gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))`,
                      aspectRatio: `${cols} / ${rows}`
                    }}
                  >
                    {maze.map((row, r) =>
                      row.map((wall, c) => {
                        const here = sameCell(r, c);
                        const goalHere = isGoalCell(r, c);
                        const pk = `${r}-${c}`;
                        const treat = !wall && treatsRemaining.has(pk);
                        const gust = gustMap.get(pk);
                        const portal = onPortal(r, c);
                        return (
                          <div
                            key={pk}
                            className={`maze-cell ${wall ? "maze-wall" : "maze-path"} ${here ? "maze-player-cell" : ""} ${goalHere ? "maze-goal-cell" : ""} ${treat ? "maze-treat-cell" : ""} ${gust ? "maze-gust-cell" : ""} ${portal ? "maze-portal-cell" : ""}`}
                            aria-hidden
                          >
                            {!wall && treat && <span className="maze-treat">{scene.collectEmoji ?? "🍬"}</span>}
                            {!wall && gust && <span className="maze-gust-arrow">{gustArrow(gust)}</span>}
                            {!wall && portal && <span className="maze-portal-mark">✧</span>}
                            {here && (
                              <span className="maze-player" title="你">
                                <span className="maze-player-emoji">{scene.playerEmoji}</span>
                              </span>
                            )}
                            {!here && goalHere && (
                              <span className="maze-goal-mark" title="终点">
                                <span className="maze-goal-emoji">{scene.goalEmoji}</span>
                              </span>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
          <p className="maze-board-hint">
            单指<strong>滑动</strong>走路，双指<strong>捏合缩放</strong>；下方有<strong>大箭头</strong>。
          </p>
        </div>

        <div className="maze-dpad-panel">
          <h2 className="maze-dpad-heading">方向控制台</h2>
          <div className="maze-dpad" aria-label="方向按钮">
            <div className="maze-dpad-row">
              <span className="maze-dpad-spacer" />
              <button type="button" className="maze-dpad-btn" onClick={() => tryStep("up")} aria-label="向上">
                ↑
              </button>
              <span className="maze-dpad-spacer" />
            </div>
            <div className="maze-dpad-row">
              <button type="button" className="maze-dpad-btn" onClick={() => tryStep("left")} aria-label="向左">
                ←
              </button>
              <span className="maze-dpad-center" />
              <button type="button" className="maze-dpad-btn" onClick={() => tryStep("right")} aria-label="向右">
                →
              </button>
            </div>
            <div className="maze-dpad-row">
              <span className="maze-dpad-spacer" />
              <button type="button" className="maze-dpad-btn" onClick={() => tryStep("down")} aria-label="向下">
                ↓
              </button>
              <span className="maze-dpad-spacer" />
            </div>
          </div>
        </div>
      </div>

      {won && (
        <div className="maze-win-overlay" role="dialog" aria-modal aria-labelledby="maze-win-title">
          <div className="maze-confetti" aria-hidden>
            {CONFETTI_COLORS.map((bg, i) => (
              <span
                key={i}
                className="maze-confetti-bit"
                style={{
                  left: `${4 + i * 6.8}%`,
                  animationDelay: `${i * 0.12}s`,
                  animationDuration: `${2.4 + (i % 4) * 0.35}s`,
                  background: bg
                }}
              />
            ))}
          </div>
          <div className="maze-win-card">
            <div className="maze-win-stars" aria-hidden>
              ✦ ✦ ✦
            </div>
            <h2 id="maze-win-title">{winHeadline || "到终点啦！"}</h2>
            <p className="maze-win-sub">
              {steps} 步 · {(winDurationMs / 1000).toFixed(2)} 秒 · {scene.label} · {difficultyLabel[difficulty]} · {runMode === "ranked" ? "挑战计时" : "自由练习"}
            </p>
            <button
              type="button"
              className="maze-btn-primary"
              onClick={() => {
                resetGame();
              }}
            >
              再玩一局
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
