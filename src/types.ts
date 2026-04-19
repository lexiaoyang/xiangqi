export type Side = "red" | "black";
export type PieceType = "king" | "advisor" | "elephant" | "horse" | "rook" | "cannon" | "pawn";
export type Difficulty = "easy" | "hard" | "hell";

export interface Piece {
  side: Side;
  type: PieceType;
}

export type Board = (Piece | null)[][];

export interface Position {
  row: number;
  col: number;
}

export interface Move {
  from: Position;
  to: Position;
}

export interface EvaluatedMove {
  move: Move;
  score: number;
  pv?: Move[];
}

export interface GameState {
  board: Board;
  turn: Side;
  history: Move[];
  winner: Side | "draw" | null;
  inCheck: Side | null;
}

export interface ReplaySnapshot {
  board: Board;
  turn: Side;
  moveNumber: number;
  move?: Move;
  fen: string;
}

export interface DifficultyConfig {
  depth: number;
  timeMs: number;
  randomness: number;
}
