import { useCallback, useEffect, useRef, useState } from "react";
import { computeStars } from "./campaign/stars";
import { TOOL_META } from "./campaign/mechanics";
import { nextStepTowardGoal } from "./campaign/pathHint";
import type { CampaignSaveV1, LevelSpec, ObstacleId } from "./campaign/types";
import { applyDirection, buildGameBundleSeeded, equalPos } from "./maze/gameState";
import { gridDimensions } from "./maze/generate";
import { sceneById } from "./maze/scenes";
import type { Dir, GameBundle, Pos } from "./maze/types";

function cloneG(g: GameBundle): GameBundle {
  return {
    maze: g.maze,
    player: { ...g.player },
    goal: { ...g.goal },
    mechanic: g.mechanic,
    treatsRemaining: new Set(g.treatsRemaining),
    gustMap: new Map(g.gustMap),
    portalPair: g.portalPair ? { a: { ...g.portalPair.a }, b: { ...g.portalPair.b } } : null
  };
}

const SWIPE_MIN = 28;

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

function manhattan(a: Pos, b: Pos): number {
  return Math.abs(a.row - b.row) + Math.abs(a.col - b.col);
}

export type PlayResolve = {
  action: "exit" | "next" | "retry";
  won: boolean;
  stars: 0 | 1 | 2 | 3;
  steps: number;
  durationMs: number;
};

type Props = {
  spec: LevelSpec;
  save: CampaignSaveV1;
  activeObstacles: ObstacleId[];
  onResolve: (r: PlayResolve) => void;
};

export function MazeLevelPlay({ spec, save, activeObstacles, onResolve }: Props) {
  const scene = sceneById(spec.sceneId);
  const [game, setGame] = useState<GameBundle>(() => buildGameBundleSeeded(spec.sceneId, spec.difficulty, spec.layoutSeed));
  const [steps, setSteps] = useState(0);
  const [won, setWon] = useState(false);
  const [givenUp, setGivenUp] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [hintFlash, setHintFlash] = useState<Pos | null>(null);
  const [hintLeft, setHintLeft] = useState(() => (save.toolsUnlocked.hint ? TOOL_META.hint.defaultCharges : 0));
  const [undoLeft, setUndoLeft] = useState(() => (save.toolsUnlocked.undo ? TOOL_META.undo.defaultCharges : 0));
  const historyRef = useRef<GameBundle[]>([]);
  const zoomRef = useRef(1);
  const pointerStart = useRef<{ x: number; y: number } | null>(null);
  const boardPointers = useRef(new Map<number, { x: number; y: number }>());
  const pinchBase = useRef<{ dist: number; zoom: number } | null>(null);
  const pinchUsed = useRef(false);
  const gameStartMs = useRef(Date.now());
  const [elapsedMs, setElapsedMs] = useState(0);

  const fogOn = activeObstacles.includes("fog");
  const timerOn = activeObstacles.includes("timer_pressure") && spec.timeLimitSec != null;

  const { maze, player, goal, mechanic, treatsRemaining, gustMap, portalPair } = game;
  const { rows, cols } = gridDimensions(maze);

  useEffect(() => {
    zoomRef.current = zoom;
  }, [zoom]);

  useEffect(() => {
    const id = window.setInterval(() => setElapsedMs(Date.now() - gameStartMs.current), 250);
    return () => window.clearInterval(id);
  }, []);

  const pushHistory = useCallback((g: GameBundle) => {
    historyRef.current.push(cloneG(g));
    if (historyRef.current.length > 45) historyRef.current.shift();
  }, []);

  const tryStep = useCallback(
    (dir: Dir) => {
      if (won || givenUp) return;
      setGame((g) => {
        pushHistory(g);
        const res = applyDirection(g, dir);
        if (!res.moved) {
          historyRef.current.pop();
          return g;
        }
        setSteps((s) => s + 1);
        if (res.won) setWon(true);
        return res.game;
      });
    },
    [won, givenUp, pushHistory]
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (won || givenUp) return;
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
  }, [tryStep, won, givenUp]);

  const finishStats = () => {
    const durationMs = Date.now() - gameStartMs.current;
    const stars = won
      ? computeStars(spec, {
          won: true,
          steps,
          durationMs,
          hadTimerObstacle: timerOn
        })
      : (0 as const);
    return { durationMs, stars };
  };

  const emit = (action: PlayResolve["action"]) => {
    const { durationMs, stars } = finishStats();
    onResolve({ action, won, stars, steps, durationMs });
  };

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
    if (!start || won || givenUp || pinchUsed.current) {
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

  const onHint = () => {
    if (won || givenUp || hintLeft < 1) return;
    const next = nextStepTowardGoal(maze, player, goal);
    if (!next) return;
    setHintLeft((n) => n - 1);
    setHintFlash(next);
    window.setTimeout(() => setHintFlash(null), 900);
  };

  const onUndo = () => {
    if (won || givenUp || undoLeft < 1) return;
    const prev = historyRef.current.pop();
    if (!prev) return;
    setUndoLeft((n) => n - 1);
    setGame(prev);
    setSteps((s) => Math.max(0, s - 1));
  };

  const sameCell = (r: number, c: number) => player.row === r && player.col === c;
  const isGoalCell = (r: number, c: number) => goal.row === r && goal.col === c;
  const onPortal = (r: number, c: number) =>
    portalPair && (equalPos(portalPair.a, { row: r, col: c }) || equalPos(portalPair.b, { row: r, col: c }));

  const collectDone = mechanic === "collect" && treatsRemaining.size === 0;

  const { durationMs: endMs, stars: endStars } = won || givenUp ? finishStats() : { durationMs: elapsedMs, stars: 0 as 0 | 1 | 2 | 3 };

  return (
    <div className="campaign-play-root">
      <header className="c-play-topbar">
        <button type="button" className="c-play-back" onClick={() => emit("exit")}>
          ←
        </button>
        <div className="c-play-meta">
          <span className="c-badge">第 {spec.levelId} 关</span>
          {timerOn && spec.timeLimitSec != null && (
            <span className={`c-timer ${elapsedMs > spec.timeLimitSec * 1000 ? "c-timer--warn" : ""}`}>
              {Math.floor(elapsedMs / 1000)}s / {spec.timeLimitSec}s
            </span>
          )}
        </div>
        <div className="c-play-tools">
          <button type="button" className="c-tool-btn" disabled={hintLeft < 1 || won || givenUp} onClick={onHint} title="提示一步">
            💡×{hintLeft}
          </button>
          <button type="button" className="c-tool-btn" disabled={undoLeft < 1 || won || givenUp || historyRef.current.length === 0} onClick={onUndo} title="撤销一步">
            ↩×{undoLeft}
          </button>
        </div>
      </header>

      <div className="maze-app campaign-play-inner" data-theme={spec.sceneId}>
        <p className="c-play-hint">{scene.label}</p>
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
            aria-label="迷宫场地"
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
                        const fogCell = fogOn && !wall && manhattan(player, { row: r, col: c }) > 2;
                        const flash = hintFlash && hintFlash.row === r && hintFlash.col === c;
                        return (
                          <div
                            key={pk}
                            className={`maze-cell ${wall ? "maze-wall" : "maze-path"} ${here ? "maze-player-cell" : ""} ${goalHere ? "maze-goal-cell" : ""} ${treat ? "maze-treat-cell" : ""} ${gust ? "maze-gust-cell" : ""} ${portal ? "maze-portal-cell" : ""} ${fogCell ? "maze-fog-cell" : ""} ${flash ? "maze-hint-flash" : ""}`}
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
          <div className="maze-zoom-bar c-zoom-inline">
            <button type="button" className="maze-zoom-btn" aria-label="缩小" onClick={() => setZoom((z) => clamp(z - 0.12, 0.55, 2.85))}>
              −
            </button>
            <span className="maze-zoom-val">{Math.round(zoom * 100)}%</span>
            <button type="button" className="maze-zoom-btn" aria-label="放大" onClick={() => setZoom((z) => clamp(z + 0.12, 0.55, 2.85))}>
              +
            </button>
          </div>
        </div>

        <div className="maze-dpad-panel">
          <div className="maze-dpad" aria-label="方向">
            <div className="maze-dpad-row">
              <span className="maze-dpad-spacer" />
              <button type="button" className="maze-dpad-btn" onClick={() => tryStep("up")}>
                ↑
              </button>
              <span className="maze-dpad-spacer" />
            </div>
            <div className="maze-dpad-row">
              <button type="button" className="maze-dpad-btn" onClick={() => tryStep("left")}>
                ←
              </button>
              <span className="maze-dpad-center" />
              <button type="button" className="maze-dpad-btn" onClick={() => tryStep("right")}>
                →
              </button>
            </div>
            <div className="maze-dpad-row">
              <span className="maze-dpad-spacer" />
              <button type="button" className="maze-dpad-btn" onClick={() => tryStep("down")}>
                ↓
              </button>
              <span className="maze-dpad-spacer" />
            </div>
          </div>
        </div>

        <div className="c-play-footer">
          <button type="button" className="maze-btn-secondary" onClick={() => setGivenUp(true)}>
            放弃本关
          </button>
        </div>
      </div>

      {(won || givenUp) && (
        <div className="c-result-overlay" role="dialog" aria-modal>
          <div className="c-result-card">
            <h2 className="c-result-title">{won ? "闯关成功！" : "再试一次"}</h2>
            {won && (
              <div className="c-stars-row" aria-label={`${endStars} 星`}>
                {[1, 2, 3].map((i) => (
                  <span key={i} className={`c-star ${i <= endStars ? "c-star--on" : ""}`}>
                    ★
                  </span>
                ))}
              </div>
            )}
            <p className="c-result-sub">
              {steps} 步 · {(endMs / 1000).toFixed(1)} 秒
            </p>
            <div className="c-result-actions">
              {won && spec.levelId < 1000 && (
                <button type="button" className="maze-btn-primary" onClick={() => emit("next")}>
                  下一关
                </button>
              )}
              <button type="button" className="maze-btn-secondary" onClick={() => emit("exit")}>
                回大厅
              </button>
              <button type="button" className="maze-btn-secondary" onClick={() => emit("retry")}>
                重开本关
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
