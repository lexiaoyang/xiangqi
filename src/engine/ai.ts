import type { Board, Difficulty, DifficultyConfig, EvaluatedMove, Move, Side } from "../types";
import { applyMove, evaluateTerminal, generateLegalMoves, oppositeSide, toFen } from "./rules";
import { getOpeningMoves } from "./openingBook";

const PIECE_VALUE: Record<string, number> = {
  king: 100000,
  advisor: 110,
  elephant: 120,
  horse: 320,
  rook: 620,
  cannon: 350,
  pawn: 80
};

export const DIFFICULTY_CONFIG: Record<Difficulty, DifficultyConfig> = {
  easy: { depth: 2, timeMs: 500, randomness: 0.35 },
  hard: { depth: 3, timeMs: 1200, randomness: 0.12 },
  hell: { depth: 4, timeMs: 2500, randomness: 0.03 }
};

export const RECOMMEND_CONFIG: DifficultyConfig = { depth: 5, timeMs: 4500, randomness: 0 };

const centerBonus = (row: number, col: number): number => {
  const colBonus = 4 - Math.abs(4 - col);
  const rowBonus = 4 - Math.abs(4.5 - row);
  return colBonus * 4 + rowBonus * 2;
};

const evaluateBoard = (board: Board, side: Side): number => {
  let score = 0;
  for (let r = 0; r < 10; r += 1) {
    for (let c = 0; c < 9; c += 1) {
      const piece = board[r][c];
      if (!piece) continue;
      const sign = piece.side === side ? 1 : -1;
      score += sign * (PIECE_VALUE[piece.type] + centerBonus(r, c));
      if (piece.type === "pawn") {
        const crossed = piece.side === "red" ? r <= 4 : r >= 5;
        if (crossed) score += sign * 40;
      }
    }
  }
  return score;
};

const moveKey = (move: Move) => `${move.from.row}${move.from.col}${move.to.row}${move.to.col}`;

const maybeRandomize = (moves: EvaluatedMove[], randomness: number): EvaluatedMove[] => {
  if (randomness <= 0 || moves.length <= 1) return moves;
  const top = moves[0].score;
  return moves.map((m) => ({ ...m, score: m.score - Math.random() * randomness * Math.abs(top || 100) }));
};

export const searchBestMove = (
  state: { board: Board; turn: Side },
  side: Side,
  config: DifficultyConfig
): EvaluatedMove | null => {
  const opening = getOpeningMoves(state).filter((m) =>
    generateLegalMoves(state).some((x) => moveKey(x) === moveKey(m))
  );
  if (opening.length) return { move: opening[0], score: 999 };

  const deadline = Date.now() + config.timeMs;
  const transposition = new Map<string, number>();
  const legal = generateLegalMoves(state);
  if (legal.length === 0) return null;
  let best: EvaluatedMove = { move: legal[0], score: Number.NEGATIVE_INFINITY };

  const negamax = (board: Board, turn: Side, depth: number, alpha: number, beta: number): number => {
    if (Date.now() > deadline) return evaluateBoard(board, side);
    const key = `${toFen({ board, turn })}:${depth}`;
    const cached = transposition.get(key);
    if (cached !== undefined) return cached;

    const terminal = evaluateTerminal({ board, turn });
    if (terminal.winner) {
      if (terminal.winner === "draw") return 0;
      return terminal.winner === side ? 900000 - (config.depth - depth) : -900000 + (config.depth - depth);
    }
    if (depth === 0) return evaluateBoard(board, side) * (turn === side ? 1 : -1);

    let currentBest = Number.NEGATIVE_INFINITY;
    const moves = generateLegalMoves({ board, turn });
    for (const mv of moves) {
      const value = -negamax(applyMove(board, mv), oppositeSide(turn), depth - 1, -beta, -alpha);
      currentBest = Math.max(currentBest, value);
      alpha = Math.max(alpha, value);
      if (alpha >= beta) break;
      if (Date.now() > deadline) break;
    }
    transposition.set(key, currentBest);
    return currentBest;
  };

  const maxDepth = Math.max(1, config.depth);
  for (let depth = 1; depth <= maxDepth; depth += 1) {
    const scored: EvaluatedMove[] = [];
    for (const move of legal) {
      const next = applyMove(state.board, move);
      const score = -negamax(next, oppositeSide(state.turn), depth - 1, Number.NEGATIVE_INFINITY, Number.POSITIVE_INFINITY);
      scored.push({ move, score });
      if (Date.now() > deadline) break;
    }
    const randomized = maybeRandomize(scored.sort((a, b) => b.score - a.score), config.randomness);
    randomized.sort((a, b) => b.score - a.score);
    if (randomized[0]) best = randomized[0];
    if (Date.now() > deadline) break;
  }

  return best;
};
