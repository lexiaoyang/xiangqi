import type { Board, GameState, Move, Piece, Position, Side } from "../types";

const EMPTY_ROW = () => Array.from({ length: 9 }, () => null as Piece | null);

const inBoard = (row: number, col: number) => row >= 0 && row < 10 && col >= 0 && col < 9;
const insidePalace = (side: Side, row: number, col: number) =>
  col >= 3 && col <= 5 && (side === "red" ? row >= 7 && row <= 9 : row >= 0 && row <= 2);

export const cloneBoard = (board: Board): Board => board.map((r) => r.map((c) => (c ? { ...c } : null)));

export const createInitialBoard = (): Board => {
  const board: Board = Array.from({ length: 10 }, () => EMPTY_ROW());
  const place = (row: number, col: number, side: Side, type: Piece["type"]) => {
    board[row][col] = { side, type };
  };

  ["rook", "horse", "elephant", "advisor", "king", "advisor", "elephant", "horse", "rook"].forEach((t, c) =>
    place(0, c, "black", t as Piece["type"])
  );
  place(2, 1, "black", "cannon");
  place(2, 7, "black", "cannon");
  [0, 2, 4, 6, 8].forEach((c) => place(3, c, "black", "pawn"));

  ["rook", "horse", "elephant", "advisor", "king", "advisor", "elephant", "horse", "rook"].forEach((t, c) =>
    place(9, c, "red", t as Piece["type"])
  );
  place(7, 1, "red", "cannon");
  place(7, 7, "red", "cannon");
  [0, 2, 4, 6, 8].forEach((c) => place(6, c, "red", "pawn"));

  return board;
};

export const oppositeSide = (side: Side): Side => (side === "red" ? "black" : "red");

const locateKing = (board: Board, side: Side): Position | null => {
  for (let r = 0; r < 10; r += 1) {
    for (let c = 0; c < 9; c += 1) {
      if (board[r][c]?.side === side && board[r][c]?.type === "king") return { row: r, col: c };
    }
  }
  return null;
};

const isKingFacing = (board: Board): boolean => {
  const red = locateKing(board, "red");
  const black = locateKing(board, "black");
  if (!red || !black || red.col !== black.col) return false;
  for (let r = Math.min(red.row, black.row) + 1; r < Math.max(red.row, black.row); r += 1) {
    if (board[r][red.col]) return false;
  }
  return true;
};

const linearMoves = (board: Board, from: Position, side: Side, cannon: boolean): Position[] => {
  const out: Position[] = [];
  const dirs = [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1]
  ];
  for (const [dr, dc] of dirs) {
    let r = from.row + dr;
    let c = from.col + dc;
    let jumped = false;
    while (inBoard(r, c)) {
      const cell = board[r][c];
      if (!cannon) {
        if (!cell) out.push({ row: r, col: c });
        else {
          if (cell.side !== side) out.push({ row: r, col: c });
          break;
        }
      } else if (!jumped) {
        if (!cell) out.push({ row: r, col: c });
        else jumped = true;
      } else if (cell) {
        if (cell.side !== side) out.push({ row: r, col: c });
        break;
      }
      r += dr;
      c += dc;
    }
  }
  return out;
};

const pseudoMoves = (board: Board, from: Position): Position[] => {
  const piece = board[from.row][from.col];
  if (!piece) return [];
  const { side } = piece;
  const forward = side === "red" ? -1 : 1;
  const out: Position[] = [];
  const push = (r: number, c: number) => {
    if (!inBoard(r, c)) return;
    const target = board[r][c];
    if (!target || target.side !== side) out.push({ row: r, col: c });
  };

  switch (piece.type) {
    case "king":
      [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1]
      ].forEach(([dr, dc]) => {
        const r = from.row + dr;
        const c = from.col + dc;
        if (insidePalace(side, r, c)) push(r, c);
      });
      break;
    case "advisor":
      [
        [1, 1],
        [1, -1],
        [-1, 1],
        [-1, -1]
      ].forEach(([dr, dc]) => {
        const r = from.row + dr;
        const c = from.col + dc;
        if (insidePalace(side, r, c)) push(r, c);
      });
      break;
    case "elephant":
      [
        [2, 2],
        [2, -2],
        [-2, 2],
        [-2, -2]
      ].forEach(([dr, dc]) => {
        const eye = board[from.row + dr / 2]?.[from.col + dc / 2];
        const r = from.row + dr;
        const c = from.col + dc;
        const crossedRiver = side === "red" ? r < 5 : r > 4;
        if (!crossedRiver && !eye) push(r, c);
      });
      break;
    case "horse":
      [
        [-2, -1, -1, 0],
        [-2, 1, -1, 0],
        [2, -1, 1, 0],
        [2, 1, 1, 0],
        [-1, -2, 0, -1],
        [-1, 2, 0, 1],
        [1, -2, 0, -1],
        [1, 2, 0, 1]
      ].forEach(([dr, dc, br, bc]) => {
        if (!board[from.row + br]?.[from.col + bc]) push(from.row + dr, from.col + dc);
      });
      break;
    case "rook":
      return linearMoves(board, from, side, false);
    case "cannon":
      return linearMoves(board, from, side, true);
    case "pawn":
      push(from.row + forward, from.col);
      if ((side === "red" && from.row <= 4) || (side === "black" && from.row >= 5)) {
        push(from.row, from.col + 1);
        push(from.row, from.col - 1);
      }
      break;
  }
  return out;
};

const attacks = (board: Board, side: Side, target: Position): boolean => {
  for (let r = 0; r < 10; r += 1) {
    for (let c = 0; c < 9; c += 1) {
      if (board[r][c]?.side !== side) continue;
      const moves = pseudoMoves(board, { row: r, col: c });
      if (moves.some((m) => m.row === target.row && m.col === target.col)) return true;
    }
  }
  return false;
};

export const applyMove = (board: Board, move: Move): Board => {
  const next = cloneBoard(board);
  next[move.to.row][move.to.col] = next[move.from.row][move.from.col];
  next[move.from.row][move.from.col] = null;
  return next;
};

export const isInCheck = (board: Board, side: Side): boolean => {
  const king = locateKing(board, side);
  if (!king) return true;
  return attacks(board, oppositeSide(side), king) || isKingFacing(board);
};

export const generateLegalMoves = (state: Pick<GameState, "board" | "turn">): Move[] => {
  const moves: Move[] = [];
  for (let r = 0; r < 10; r += 1) {
    for (let c = 0; c < 9; c += 1) {
      if (state.board[r][c]?.side !== state.turn) continue;
      for (const to of pseudoMoves(state.board, { row: r, col: c })) {
        const move: Move = { from: { row: r, col: c }, to };
        const next = applyMove(state.board, move);
        if (!isInCheck(next, state.turn)) moves.push(move);
      }
    }
  }
  return moves;
};

export const toFen = (state: Pick<GameState, "board" | "turn">): string => {
  const map = new Map<string, string>([
    ["king:red", "K"],
    ["advisor:red", "A"],
    ["elephant:red", "E"],
    ["horse:red", "H"],
    ["rook:red", "R"],
    ["cannon:red", "C"],
    ["pawn:red", "P"],
    ["king:black", "k"],
    ["advisor:black", "a"],
    ["elephant:black", "e"],
    ["horse:black", "h"],
    ["rook:black", "r"],
    ["cannon:black", "c"],
    ["pawn:black", "p"]
  ]);
  const rows = state.board.map((row) => {
    let out = "";
    let empty = 0;
    row.forEach((cell) => {
      if (!cell) empty += 1;
      else {
        if (empty) out += String(empty);
        empty = 0;
        out += map.get(`${cell.type}:${cell.side}`) ?? "?";
      }
    });
    if (empty) out += String(empty);
    return out;
  });
  return `${rows.join("/")} ${state.turn === "red" ? "w" : "b"}`;
};

export const fromFen = (fen: string): Pick<GameState, "board" | "turn"> => {
  const [layout, turnToken] = fen.trim().split(/\s+/);
  if (!layout || !turnToken) throw new Error("invalid fen");
  const reverse = new Map<string, Piece>([
    ["K", { side: "red", type: "king" }],
    ["A", { side: "red", type: "advisor" }],
    ["E", { side: "red", type: "elephant" }],
    ["H", { side: "red", type: "horse" }],
    ["R", { side: "red", type: "rook" }],
    ["C", { side: "red", type: "cannon" }],
    ["P", { side: "red", type: "pawn" }],
    ["k", { side: "black", type: "king" }],
    ["a", { side: "black", type: "advisor" }],
    ["e", { side: "black", type: "elephant" }],
    ["h", { side: "black", type: "horse" }],
    ["r", { side: "black", type: "rook" }],
    ["c", { side: "black", type: "cannon" }],
    ["p", { side: "black", type: "pawn" }]
  ]);
  const rows = layout.split("/");
  if (rows.length !== 10) throw new Error("invalid fen rows");
  const board: Board = Array.from({ length: 10 }, () => EMPTY_ROW());
  rows.forEach((row, r) => {
    let col = 0;
    for (const ch of row) {
      if (/\d/.test(ch)) col += Number(ch);
      else {
        const p = reverse.get(ch);
        if (!p) throw new Error("invalid fen piece");
        board[r][col] = { ...p };
        col += 1;
      }
    }
  });
  return { board, turn: turnToken === "w" ? "red" : "black" };
};

export const evaluateTerminal = (state: Pick<GameState, "board" | "turn">): { winner: Side | "draw" | null; inCheck: Side | null } => {
  const legal = generateLegalMoves(state);
  if (legal.length > 0) return { winner: null, inCheck: isInCheck(state.board, state.turn) ? state.turn : null };
  if (isInCheck(state.board, state.turn)) return { winner: oppositeSide(state.turn), inCheck: state.turn };
  return { winner: "draw", inCheck: null };
};

export const createInitialState = (): GameState => ({
  board: createInitialBoard(),
  turn: "red",
  history: [],
  winner: null,
  inCheck: null
});
