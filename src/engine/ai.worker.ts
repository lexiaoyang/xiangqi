import { DIFFICULTY_CONFIG, RECOMMEND_CONFIG, searchBestMove } from "./ai";
import type { Board, Difficulty, Side } from "../types";

interface ComputePayload {
  kind: "move" | "recommend";
  board: Board;
  turn: Side;
  difficulty: Difficulty;
}

self.onmessage = (event: MessageEvent<ComputePayload>) => {
  const payload = event.data;
  const config = payload.kind === "recommend" ? RECOMMEND_CONFIG : DIFFICULTY_CONFIG[payload.difficulty];
  const result = searchBestMove(
    {
      board: payload.board,
      turn: payload.turn
    },
    payload.turn,
    config
  );
  self.postMessage({ kind: payload.kind, result });
};

export {};
