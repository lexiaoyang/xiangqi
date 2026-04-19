import { useEffect, useMemo, useRef, useState } from "react";
import type { Difficulty, GameState, Move, Position, Side } from "./types";
import { createInitialState, evaluateTerminal, generateLegalMoves, isInCheck, toFen, applyMove } from "./engine/rules";
import { buildReplay, exportRecord, importRecord } from "./engine/replay";
import { createTurnTimer, getRemainingMs, isTimeout } from "./engine/timer";
import { logEvent, withPerf } from "./telemetry/logger";
import { bindGuestAccount, ensureSession, getOrCreateDeviceId, getSession, refreshTokenIfNeeded, rollbackBind } from "./auth/guestAccountService";
import { AuthError } from "./auth/types";
import type { ProviderType, SessionSnapshot } from "./auth/types";

const difficultyName: Record<Difficulty, string> = { easy: "简单", hard: "困难", hell: "地狱" };
type BattleMode = "human-vs-ai" | "ai-vs-ai";
type AppTab = "mode" | "battle" | "settings";
const pieceText: Record<string, string> = {
  "red-king": "帅",
  "red-advisor": "仕",
  "red-elephant": "相",
  "red-horse": "马",
  "red-rook": "车",
  "red-cannon": "炮",
  "red-pawn": "兵",
  "black-king": "将",
  "black-advisor": "士",
  "black-elephant": "象",
  "black-horse": "馬",
  "black-rook": "車",
  "black-cannon": "炮",
  "black-pawn": "卒"
};

const toKey = (p: Position) => `${p.row}-${p.col}`;
const equalPos = (a: Position, b: Position) => a.row === b.row && a.col === b.col;

export default function App() {
  const [state, setState] = useState<GameState>(() => createInitialState());
  const [selected, setSelected] = useState<Position | null>(null);
  const [activeTab, setActiveTab] = useState<AppTab>("mode");
  const [hasStarted, setHasStarted] = useState(false);
  const [battleMode, setBattleMode] = useState<BattleMode>("human-vs-ai");
  const [difficulty, setDifficulty] = useState<Difficulty>("hell");
  const [redAiDifficulty, setRedAiDifficulty] = useState<Difficulty>("hard");
  const [blackAiDifficulty, setBlackAiDifficulty] = useState<Difficulty>("hell");
  const [aiStepDelayMs, setAiStepDelayMs] = useState<number>(900);
  const [events, setEvents] = useState<string[]>([]);
  const [authSession, setAuthSession] = useState<SessionSnapshot | null>(null);
  const [bindProvider, setBindProvider] = useState<ProviderType>("phone");
  const [bindIdentifier, setBindIdentifier] = useState("");
  const [bindCode, setBindCode] = useState("");
  const [bindMergeConfirmed, setBindMergeConfirmed] = useState(false);
  const [bindLoading, setBindLoading] = useState(false);
  const [bindMessage, setBindMessage] = useState("");
  const [timer, setTimer] = useState(() => createTurnTimer("red"));
  const [remaining, setRemaining] = useState(60_000);
  const [recommendMove, setRecommendMove] = useState<Move | null>(null);
  const [recommendScore, setRecommendScore] = useState<number>(0);
  const [replayStep, setReplayStep] = useState<number | null>(null);
  const [dragging, setDragging] = useState<Position | null>(null);
  const [deviceTier, setDeviceTier] = useState<"high" | "low">("high");
  const workerRef = useRef<Worker | null>(null);
  const pendingAiSideRef = useRef<Side>("black");
  const aiThinkingRef = useRef(false);
  const aiDispatchTimerRef = useRef<number | null>(null);
  const repetitionRef = useRef<Map<string, number>>(new Map());

  const legalMoves = useMemo(() => generateLegalMoves({ board: state.board, turn: state.turn }), [state.board, state.turn]);
  const selectedMoves = useMemo(
    () => legalMoves.filter((m) => selected && equalPos(m.from, selected)).map((m) => m.to),
    [legalMoves, selected]
  );

  const replay = useMemo(() => buildReplay(createInitialState().board, "red", state.history), [state.history]);
  const replayState = replayStep === null ? null : replay[replayStep];
  const displayBoard = replayState ? replayState.board : state.board;

  useEffect(() => {
    const session = ensureSession();
    setAuthSession(session);
    logEvent({ name: "auth_guest_session_ready", data: { guestId: session.profile.guestId, deviceId: getOrCreateDeviceId() } });
  }, []);

  useEffect(() => {
    const id = window.setInterval(() => {
      const current = getSession();
      if (!current) return;
      try {
        const refreshed = refreshTokenIfNeeded(current);
        if (refreshed.token.accessToken !== current.token.accessToken) setAuthSession(refreshed);
      } catch (error) {
        if (error instanceof AuthError) {
          setBindMessage(error.message);
          const recreated = ensureSession();
          setAuthSession(recreated);
        }
      }
    }, 20_000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    workerRef.current = new Worker(new URL("./engine/ai.worker.ts", import.meta.url), { type: "module" });
    workerRef.current.onmessage = (event: MessageEvent<{ kind: "move" | "recommend"; result: { move: Move; score: number } | null }>) => {
      const payload = event.data;
      if (payload.kind === "recommend") {
        setRecommendMove(payload.result?.move ?? null);
        setRecommendScore(payload.result?.score ?? 0);
      } else {
        aiThinkingRef.current = false;
        if (payload.result?.move) {
          commitMove(payload.result.move, pendingAiSideRef.current);
        }
      }
    };
    return () => {
      if (aiDispatchTimerRef.current !== null) {
        window.clearTimeout(aiDispatchTimerRef.current);
      }
      workerRef.current?.terminate();
    };
  }, []);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const recompute = () => {
      const lowByScreen = window.innerWidth < 900;
      const lowByMotion = mq.matches;
      setDeviceTier(lowByScreen || lowByMotion ? "low" : "high");
    };
    recompute();
    window.addEventListener("resize", recompute);
    mq.addEventListener("change", recompute);
    return () => {
      window.removeEventListener("resize", recompute);
      mq.removeEventListener("change", recompute);
    };
  }, []);

  useEffect(() => {
    const id = window.setInterval(() => {
      setRemaining(getRemainingMs(timer));
    }, 100);
    return () => window.clearInterval(id);
  }, [timer]);

  const clearAiPending = () => {
    if (aiDispatchTimerRef.current !== null) {
      window.clearTimeout(aiDispatchTimerRef.current);
      aiDispatchTimerRef.current = null;
    }
    aiThinkingRef.current = false;
  };

  useEffect(() => {
    if (!hasStarted || state.winner || replayStep !== null) return;
    const fen = toFen({ board: state.board, turn: state.turn });
    const nextMap = new Map(repetitionRef.current);
    const count = (nextMap.get(fen) ?? 0) + 1;
    nextMap.set(fen, count);
    repetitionRef.current = nextMap;
    if (count >= 3) {
      clearAiPending();
      setEvents((x) => ["同一局面三次重复，自动判和。", ...x].slice(0, 14));
      setState((prev) => ({ ...prev, winner: "draw" }));
    }
  }, [state.board, state.turn, state.winner, replayStep, hasStarted]);

  useEffect(() => {
    if (!hasStarted || state.winner || replayStep !== null) return;
    if (isTimeout(timer)) {
      clearAiPending();
      setEvents((x) => [`${state.turn === "red" ? "红方" : "黑方"}超时，判负。`, ...x].slice(0, 12));
      setState((prev) => ({ ...prev, winner: state.turn === "red" ? "black" : "red" }));
      return;
    }
    const aiTurn = battleMode === "ai-vs-ai" || state.turn === "black";
    if (aiTurn) {
      if (aiThinkingRef.current) return;
      const side = state.turn;
      const aiDifficulty =
        battleMode === "ai-vs-ai"
          ? side === "red"
            ? redAiDifficulty
            : blackAiDifficulty
          : difficulty;
      pendingAiSideRef.current = side;
      aiThinkingRef.current = true;
      const delay = battleMode === "ai-vs-ai" ? aiStepDelayMs : Math.min(aiStepDelayMs, 700);
      aiDispatchTimerRef.current = window.setTimeout(() => {
        workerRef.current?.postMessage({
          kind: "move",
          board: state.board,
          turn: side,
          difficulty: aiDifficulty,
          seenFens: Array.from(repetitionRef.current.keys())
        });
        aiDispatchTimerRef.current = null;
      }, delay);
    } else {
      clearAiPending();
      workerRef.current?.postMessage({
        kind: "recommend",
        board: state.board,
        turn: "red",
        difficulty,
        seenFens: Array.from(repetitionRef.current.keys())
      });
    }
  }, [state.turn, state.board, state.winner, difficulty, redAiDifficulty, blackAiDifficulty, battleMode, timer, replayStep, aiStepDelayMs, hasStarted]);

  const pushEvent = (line: string) => setEvents((x) => [line, ...x].slice(0, 14));
  const canHumanOperate =
    hasStarted && battleMode === "human-vs-ai" && state.turn === "red" && !state.winner && replayStep === null;

  const commitMove = (move: Move, actor: Side) => {
    setState((prev) =>
      withPerf("move_commit", () => {
        const nextBoard = applyMove(prev.board, move);
        const nextTurn: Side = prev.turn === "red" ? "black" : "red";
        const terminal = evaluateTerminal({ board: nextBoard, turn: nextTurn });
        const checkSide = isInCheck(nextBoard, nextTurn) ? nextTurn : null;
        logEvent({
          name: "move",
          data: { actor, from: move.from, to: move.to, difficulty, fen: toFen({ board: nextBoard, turn: nextTurn }) }
        });
        setTimer(createTurnTimer(nextTurn));
        setSelected(null);
        setRecommendMove(null);
        pushEvent(`${actor === "red" ? "红方" : "黑方"}: (${move.from.row},${move.from.col}) -> (${move.to.row},${move.to.col})`);
        return {
          board: nextBoard,
          turn: nextTurn,
          history: [...prev.history, move],
          winner: terminal.winner,
          inCheck: checkSide
        };
      })
    );
  };

  const tryMove = (to: Position) => {
    if (!selected || !canHumanOperate) return;
    const found = legalMoves.find((m) => equalPos(m.from, selected) && equalPos(m.to, to));
    if (!found) return;
    commitMove(found, "red");
  };

  const onCellClick = (row: number, col: number) => {
    const piece = state.board[row][col];
    if (selected) {
      tryMove({ row, col });
      if (piece?.side === "red" && canHumanOperate) setSelected({ row, col });
      return;
    }
    if (piece?.side === "red" && canHumanOperate) setSelected({ row, col });
  };

  const applyRecommend = () => {
    if (!recommendMove || !canHumanOperate) return;
    commitMove(recommendMove, "red");
    pushEvent("已采用推荐走法。");
  };

  const resetGame = () => {
    clearAiPending();
    repetitionRef.current = new Map();
    setHasStarted(false);
    setState(createInitialState());
    setSelected(null);
    setTimer(createTurnTimer("red"));
    setRecommendMove(null);
    setReplayStep(null);
    setEvents(["新对局开始。"]);
  };

  const startGame = () => {
    clearAiPending();
    repetitionRef.current = new Map();
    setHasStarted(true);
    setTimer(createTurnTimer(state.turn));
    setEvents((x) => ["对局已开始。", ...x].slice(0, 14));
    setActiveTab("battle");
  };

  const executeBindWithRetry = (session: SessionSnapshot, mergeConfirmed: boolean) => {
    const idempotencyKey = `bind_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    let attempt = 0;
    let rollbackSnapshot: SessionSnapshot | null = null;
    while (attempt < 3) {
      attempt += 1;
      try {
        const result = bindGuestAccount(session, {
          provider: bindProvider,
          identifier: bindIdentifier.trim(),
          verifyCode: bindCode.trim(),
          idempotencyKey,
          mergeConfirmed
        });
        rollbackSnapshot = result.rollback;
        return { session: result.session, rollbackSnapshot };
      } catch (error) {
        if (!(error instanceof AuthError)) throw error;
        if (!error.retryable || attempt >= 3) throw error;
      }
    }
    throw new Error("unreachable");
  };

  const onBindAccount = () => {
    if (!authSession) return;
    setBindLoading(true);
    setBindMessage("");
    try {
      const result = executeBindWithRetry(authSession, bindMergeConfirmed);
      setAuthSession(result.session);
      setBindCode("");
      setBindMessage("绑定成功，账号已升级为正式用户。");
    } catch (error) {
      if (error instanceof AuthError) {
        if (error.code === "BIND_CONFLICT") {
          setBindMessage("检测到账号冲突，请勾选“允许合并”后重试。");
        } else {
          setBindMessage(error.message);
        }
        const snapshot = getSession();
        if (snapshot && snapshot.profile.bindingState === "guest") {
          setAuthSession(snapshot);
        } else if (authSession.profile.bindingState === "guest") {
          setAuthSession(rollbackBind(authSession));
        }
      } else {
        setBindMessage("绑定失败，请稍后重试。");
        setAuthSession(rollbackBind(authSession));
      }
    } finally {
      setBindLoading(false);
    }
  };

  const downloadRecord = () => {
    const raw = exportRecord(toFen({ board: createInitialState().board, turn: "red" }), state.history);
    const blob = new Blob([raw], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `xiangqi-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    pushEvent("棋谱已导出。");
  };

  const importFromFile = async (file: File) => {
    const raw = await file.text();
    const rec = importRecord(raw);
    const base = createInitialState();
    const importedHistory = rec.moves;
    let board = base.board;
    let turn: Side = "red";
    importedHistory.forEach((mv) => {
      board = applyMove(board, mv);
      turn = turn === "red" ? "black" : "red";
    });
    const terminal = evaluateTerminal({ board, turn });
    clearAiPending();
    repetitionRef.current = new Map();
    setHasStarted(true);
    setState({ board, turn, history: importedHistory, winner: terminal.winner, inCheck: terminal.inCheck });
    setTimer(createTurnTimer(turn));
    setReplayStep(null);
    pushEvent("棋谱已导入。");
  };

  const evalPercent = Math.max(5, Math.min(95, 50 + recommendScore / 200));
  const latestEvent = events[0] ?? "暂无事件";
  const modeText = battleMode === "ai-vs-ai" ? "AI 对战" : "人机对战";

  const renderModeSettings = () => (
    <>
      <label>
        对战模式
        <select
          value={battleMode}
          onChange={(e) => {
            const mode = e.target.value as BattleMode;
            clearAiPending();
            repetitionRef.current = new Map();
            setBattleMode(mode);
            setSelected(null);
            setRecommendMove(null);
            setEvents((x) => [`已切换为${mode === "ai-vs-ai" ? "AI 对战" : "人机对战"}。`, ...x].slice(0, 14));
          }}
        >
          <option value="human-vs-ai">人机对战</option>
          <option value="ai-vs-ai">AI 对战</option>
        </select>
      </label>
      <label>
        {battleMode === "human-vs-ai" ? "黑方AI" : "红方AI"}
        {battleMode === "human-vs-ai" ? (
          <select value={difficulty} onChange={(e) => setDifficulty(e.target.value as Difficulty)}>
            <option value="easy">{difficultyName.easy}</option>
            <option value="hard">{difficultyName.hard}</option>
            <option value="hell">{difficultyName.hell}</option>
          </select>
        ) : (
          <select value={redAiDifficulty} onChange={(e) => setRedAiDifficulty(e.target.value as Difficulty)}>
            <option value="easy">{difficultyName.easy}</option>
            <option value="hard">{difficultyName.hard}</option>
            <option value="hell">{difficultyName.hell}</option>
          </select>
        )}
      </label>
      {battleMode === "ai-vs-ai" && (
        <label>
          黑方AI
          <select value={blackAiDifficulty} onChange={(e) => setBlackAiDifficulty(e.target.value as Difficulty)}>
            <option value="easy">{difficultyName.easy}</option>
            <option value="hard">{difficultyName.hard}</option>
            <option value="hell">{difficultyName.hell}</option>
          </select>
        </label>
      )}
      <label>
        步间延时
        <select value={aiStepDelayMs} onChange={(e) => setAiStepDelayMs(Number(e.target.value))}>
          <option value={500}>0.5 秒</option>
          <option value={900}>0.9 秒</option>
          <option value={1400}>1.4 秒</option>
        </select>
      </label>
    </>
  );

  return (
    <div className={`app ${deviceTier === "low" ? "low-tier" : ""}`}>
      <header className="app-header">
        <h1>玄枢象棋</h1>
        <p>H5 中国象棋 · AI 对战/人机对战 · 三难度模式</p>
      </header>

      <main className="app-main">
        {activeTab === "mode" && (
          <section className="screen mode-screen">
            <h2>选择模式</h2>
            <div className="card-grid">{renderModeSettings()}</div>
            <div className="primary-actions">
              <button onClick={startGame} className="primary-btn">
                开始对局（{modeText}）
              </button>
              <button onClick={() => setActiveTab("settings")}>更多设置</button>
            </div>
          </section>
        )}

        {activeTab === "battle" && (
          <section className="screen battle-screen">
            <div className="battle-status">
              <span>{hasStarted ? "进行中" : "待开始"}</span>
              <span>{state.turn === "red" ? "红方回合" : "黑方回合"}</span>
              <span>{(remaining / 1000).toFixed(1)}s</span>
              <span>{state.winner ? (state.winner === "draw" ? "和棋" : `${state.winner === "red" ? "红胜" : "黑胜"}`) : "对局中"}</span>
            </div>
            <div className="board-wrap" role="application" aria-label="中国象棋棋盘">
              <div className="board-grid">
                <svg className="board-svg" viewBox="0 0 800 900" aria-hidden="true">
                  <rect x="0" y="0" width="800" height="900" className="board-border" />
                  {Array.from({ length: 10 }).map((_, idx) => (
                    <line key={`h-${idx}`} x1="0" y1={idx * 100} x2="800" y2={idx * 100} className="board-line" />
                  ))}
                  {Array.from({ length: 9 }).map((_, idx) => {
                    const x = idx * 100;
                    if (idx === 0 || idx === 8) {
                      return <line key={`v-${idx}`} x1={x} y1="0" x2={x} y2="900" className="board-line" />;
                    }
                    return (
                      <g key={`v-${idx}`}>
                        <line x1={x} y1="0" x2={x} y2="400" className="board-line" />
                        <line x1={x} y1="500" x2={x} y2="900" className="board-line" />
                      </g>
                    );
                  })}
                  <line x1="300" y1="0" x2="500" y2="200" className="board-line" />
                  <line x1="500" y1="0" x2="300" y2="200" className="board-line" />
                  <line x1="300" y1="700" x2="500" y2="900" className="board-line" />
                  <line x1="500" y1="700" x2="300" y2="900" className="board-line" />
                </svg>
                <div className="river-text">楚 河　汉 界</div>
                <div className="board-points">
                  {displayBoard.map((row, r) =>
                    row.map((cell, c) => {
                      const pos = { row: r, col: c };
                      const highlighted = selectedMoves.some((m) => equalPos(m, pos));
                      const selectedCell = selected ? equalPos(selected, pos) : false;
                      return (
                        <button
                          key={`${r}-${c}`}
                          className={`point ${highlighted ? "highlight" : ""} ${selectedCell ? "selected" : ""}`}
                          style={{ left: `${(c / 8) * 100}%`, top: `${(r / 9) * 100}%` }}
                          aria-label={`棋位 ${r}-${c}`}
                          onClick={() => hasStarted && onCellClick(r, c)}
                          onDrop={(e) => {
                            e.preventDefault();
                            if (hasStarted && dragging) {
                              setSelected(dragging);
                              tryMove(pos);
                              setDragging(null);
                            }
                          }}
                          onDragOver={(e) => e.preventDefault()}
                        >
                          {cell && (
                            <span
                              draggable={cell.side === "red" && canHumanOperate}
                              onDragStart={() => setDragging({ row: r, col: c })}
                              className={`piece ${cell.side} ${deviceTier === "low" ? "simple" : ""}`}
                            >
                              {pieceText[`${cell.side}-${cell.type}`]}
                            </span>
                          )}
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
            <div className="battle-actions">
              <button onClick={startGame} disabled={hasStarted || !!state.winner}>开始</button>
              <button onClick={resetGame}>新局</button>
              <button onClick={applyRecommend} disabled={!recommendMove || !canHumanOperate}>推荐</button>
              <button onClick={() => setActiveTab("settings")}>设置</button>
            </div>
          </section>
        )}

        {activeTab === "settings" && (
          <section className="screen settings-screen">
            <h2>设置</h2>
            <div className="card-grid">{renderModeSettings()}</div>
            <div className="auth-card">
              <h3>账号与绑定</h3>
              <div className="auth-row">
                <span>设备ID</span>
                <strong>{authSession?.profile.deviceId ?? "-"}</strong>
              </div>
              <div className="auth-row">
                <span>游客ID</span>
                <strong>{authSession?.profile.guestId ?? "-"}</strong>
              </div>
              <div className="auth-row">
                <span>绑定状态</span>
                <strong>{authSession?.profile.bindingState === "bound" ? "已绑定" : "游客态"}</strong>
              </div>
              {authSession?.profile.bindingState !== "bound" && (
                <div className="auth-bind-form">
                  <label>
                    绑定方式
                    <select value={bindProvider} onChange={(e) => setBindProvider(e.target.value as ProviderType)}>
                      <option value="phone">手机号</option>
                      <option value="wechat">微信</option>
                    </select>
                  </label>
                  <label>
                    {bindProvider === "phone" ? "手机号" : "微信标识"}
                    <input value={bindIdentifier} onChange={(e) => setBindIdentifier(e.target.value)} placeholder={bindProvider === "phone" ? "13800138000" : "wechat_open_id"} />
                  </label>
                  <label>
                    验证码
                    <input value={bindCode} onChange={(e) => setBindCode(e.target.value)} placeholder={bindProvider === "phone" ? "6位数字验证码" : "授权校验码"} />
                  </label>
                  <label className="checkbox-line">
                    <input type="checkbox" checked={bindMergeConfirmed} onChange={(e) => setBindMergeConfirmed(e.target.checked)} />
                    允许冲突时合并账号数据
                  </label>
                  <button onClick={onBindAccount} disabled={bindLoading || !bindIdentifier.trim() || !bindCode.trim()}>
                    {bindLoading ? "绑定中..." : "绑定正式账号"}
                  </button>
                </div>
              )}
              {bindMessage && <div className="settings-note">{bindMessage}</div>}
            </div>
            <div className="primary-actions">
              <button onClick={downloadRecord}>导出棋谱</button>
              <label className="import-button">
                导入棋谱
                <input type="file" accept=".json" onChange={(e) => e.target.files?.[0] && importFromFile(e.target.files[0])} />
              </label>
              <button onClick={() => setReplayStep(null)}>退出复盘</button>
            </div>
            <div className="settings-note">
              推荐：{!hasStarted ? "点击开始后计算" : battleMode === "ai-vs-ai" ? "AI 对战模式关闭推荐" : recommendMove ? `${toKey(recommendMove.from)} -> ${toKey(recommendMove.to)}` : "计算中..."}
            </div>
            <div className="settings-note">局势评估：{evalPercent.toFixed(0)} / 100</div>
            <div className="settings-note">最近事件：{latestEvent}</div>
          </section>
        )}
      </main>

      <nav className="bottom-tabs">
        <button className={activeTab === "mode" ? "active" : ""} onClick={() => setActiveTab("mode")}>模式</button>
        <button className={activeTab === "battle" ? "active" : ""} onClick={() => setActiveTab("battle")}>对战</button>
        <button className={activeTab === "settings" ? "active" : ""} onClick={() => setActiveTab("settings")}>设置</button>
      </nav>
    </div>
  );
}
