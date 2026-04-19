import { describe, expect, it } from "vitest";
import { applyMove, createInitialState, evaluateTerminal, fromFen, generateLegalMoves, toFen } from "./rules";

describe("rules engine", () => {
  it("初始局面可生成合法走法", () => {
    const state = createInitialState();
    const moves = generateLegalMoves(state);
    expect(moves.length).toBeGreaterThan(0);
  });

  it("FEN 序列化与反序列化一致", () => {
    const state = createInitialState();
    const fen = toFen(state);
    const restored = fromFen(fen);
    expect(toFen(restored)).toBe(fen);
  });

  it("普通将军局面未必立即终局", () => {
    const state = fromFen("4k4/9/9/9/9/9/9/9/4R4/4K4 b");
    const terminal = evaluateTerminal(state);
    expect(terminal.winner).toBe(null);
  });

  it("走子后回合切换", () => {
    const state = createInitialState();
    const move = generateLegalMoves(state)[0];
    const board = applyMove(state.board, move);
    const next = evaluateTerminal({ board, turn: "black" });
    expect(next.winner).toBe(null);
  });
});
