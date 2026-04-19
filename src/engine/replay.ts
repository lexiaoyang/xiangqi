import type { Board, Move, ReplaySnapshot, Side } from "../types";
import { applyMove, fromFen, toFen } from "./rules";

const cloneBoard = (board: Board): Board => board.map((r) => r.map((c) => (c ? { ...c } : null)));

export const buildReplay = (initial: Board, initialTurn: Side, history: Move[]): ReplaySnapshot[] => {
  const snapshots: ReplaySnapshot[] = [];
  let board = cloneBoard(initial);
  let turn = initialTurn;
  snapshots.push({ board: cloneBoard(board), turn, moveNumber: 0, fen: toFen({ board, turn }) });
  history.forEach((move, idx) => {
    board = applyMove(board, move);
    turn = turn === "red" ? "black" : "red";
    snapshots.push({
      board: cloneBoard(board),
      turn,
      moveNumber: idx + 1,
      move,
      fen: toFen({ board, turn })
    });
  });
  return snapshots;
};

export interface ExportedRecord {
  version: "1.0";
  initialFen: string;
  moves: Move[];
  createdAt: string;
}

export const exportRecord = (initialFen: string, moves: Move[]): string =>
  JSON.stringify({ version: "1.0", initialFen, moves, createdAt: new Date().toISOString() } satisfies ExportedRecord, null, 2);

export const importRecord = (raw: string): ExportedRecord => {
  const parsed = JSON.parse(raw) as ExportedRecord;
  if (parsed.version !== "1.0" || !Array.isArray(parsed.moves) || typeof parsed.initialFen !== "string") {
    throw new Error("invalid record");
  }
  fromFen(parsed.initialFen);
  parsed.moves.forEach((m) => {
    if (
      !Number.isInteger(m?.from?.row) ||
      !Number.isInteger(m?.from?.col) ||
      !Number.isInteger(m?.to?.row) ||
      !Number.isInteger(m?.to?.col)
    ) {
      throw new Error("invalid move");
    }
  });
  return parsed;
};
