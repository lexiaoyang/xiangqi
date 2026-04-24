import { useCallback, useEffect, useRef, useState } from "react";
import type { MazeDifficulty, WallGrid } from "./maze/generate";
import { defaultStartGoal, gridDimensions, isWall, mazeForDifficulty } from "./maze/generate";

type Dir = "up" | "down" | "left" | "right";

type GameBundle = {
  maze: WallGrid;
  player: { row: number; col: number };
  goal: { row: number; col: number };
};

const difficultyLabel: Record<MazeDifficulty, string> = {
  easy: "简单",
  medium: "中等",
  hard: "挑战"
};

const SWIPE_MIN = 28;

function initGame(d: MazeDifficulty): GameBundle {
  const maze = mazeForDifficulty(d);
  const { start, goal } = defaultStartGoal(maze);
  return { maze, player: { ...start }, goal: { ...goal } };
}

export default function App() {
  const [difficulty, setDifficulty] = useState<MazeDifficulty>("easy");
  const [game, setGame] = useState<GameBundle>(() => initGame("easy"));
  const [steps, setSteps] = useState(0);
  const [won, setWon] = useState(false);
  const pointerStart = useRef<{ x: number; y: number } | null>(null);

  const { maze, player, goal } = game;
  const { rows, cols } = gridDimensions(maze);

  const resetGame = useCallback((d: MazeDifficulty) => {
    setGame(initGame(d));
    setSteps(0);
    setWon(false);
  }, []);

  useEffect(() => {
    resetGame(difficulty);
  }, [difficulty, resetGame]);

  const tryStep = useCallback(
    (dir: Dir) => {
      if (won) return;
      setGame((g) => {
        const dr = dir === "up" ? -1 : dir === "down" ? 1 : 0;
        const dc = dir === "left" ? -1 : dir === "right" ? 1 : 0;
        const nr = g.player.row + dr;
        const nc = g.player.col + dc;
        if (isWall(g.maze, nr, nc)) return g;
        if (nr === g.goal.row && nc === g.goal.col) setWon(true);
        setSteps((s) => s + 1);
        return { ...g, player: { row: nr, col: nc } };
      });
    },
    [won]
  );

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

  const onPointerDown = (e: React.PointerEvent) => {
    pointerStart.current = { x: e.clientX, y: e.clientY };
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  };

  const onPointerUp = (e: React.PointerEvent) => {
    const start = pointerStart.current;
    pointerStart.current = null;
    if (!start || won) return;
    const dx = e.clientX - start.x;
    const dy = e.clientY - start.y;
    if (Math.abs(dx) < SWIPE_MIN && Math.abs(dy) < SWIPE_MIN) return;
    if (Math.abs(dx) >= Math.abs(dy)) tryStep(dx > 0 ? "right" : "left");
    else tryStep(dy > 0 ? "down" : "up");
  };

  const sameCell = (r: number, c: number) => player.row === r && player.col === c;
  const isGoalCell = (r: number, c: number) => goal.row === r && goal.col === c;

  return (
    <div className="maze-app">
      <header className="maze-header">
        <h1>走迷宫</h1>
        <p>用手指在迷宫上滑动，或点下面的大箭头移动</p>
      </header>

      <section className="maze-toolbar">
        <label className="maze-field">
          难度
          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value as MazeDifficulty)}
            aria-label="选择难度"
          >
            <option value="easy">{difficultyLabel.easy}</option>
            <option value="medium">{difficultyLabel.medium}</option>
            <option value="hard">{difficultyLabel.hard}</option>
          </select>
        </label>
        <div className="maze-stats">
          <span>步数：{steps}</span>
        </div>
        <button type="button" className="maze-btn-secondary" onClick={() => resetGame(difficulty)}>
          换一张迷宫
        </button>
      </section>

      <div
        className="maze-board-wrap"
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onPointerCancel={() => {
          pointerStart.current = null;
        }}
        role="application"
        aria-label="迷宫场地，可滑动控制小人"
      >
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
              const cheese = isGoalCell(r, c);
              return (
                <div
                  key={`${r}-${c}`}
                  className={`maze-cell ${wall ? "maze-wall" : "maze-path"} ${here ? "maze-player-cell" : ""} ${cheese ? "maze-goal-cell" : ""}`}
                  aria-hidden
                >
                  {here && <span className="maze-player">我</span>}
                  {!here && cheese && <span className="maze-goal-mark">终</span>}
                </div>
              );
            })
          )}
        </div>
      </div>

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

      {won && (
        <div className="maze-win-overlay" role="dialog" aria-modal aria-labelledby="maze-win-title">
          <div className="maze-win-card">
            <h2 id="maze-win-title">到终点啦！</h2>
            <p>一共走了 {steps} 步</p>
            <button type="button" className="maze-btn-primary" onClick={() => resetGame(difficulty)}>
              再玩一次
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
