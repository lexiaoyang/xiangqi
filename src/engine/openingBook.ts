import type { Move } from "../types";
import { toFen } from "./rules";
import type { GameState } from "../types";

const openingBook = new Map<string, Move[]>([
  [
    "rheakaehr/9/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/9/RHEAKAEHR w",
    [
      { from: { row: 9, col: 1 }, to: { row: 7, col: 2 } },
      { from: { row: 9, col: 7 }, to: { row: 7, col: 6 } },
      { from: { row: 7, col: 1 }, to: { row: 4, col: 1 } }
    ]
  ]
]);

export const getOpeningMoves = (state: Pick<GameState, "board" | "turn">): Move[] => openingBook.get(toFen(state)) ?? [];
