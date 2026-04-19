import type { Side } from "../types";

export interface TurnTimer {
  side: Side;
  deadline: number;
  timeoutMs: number;
}

export const createTurnTimer = (side: Side, timeoutMs = 60_000): TurnTimer => ({
  side,
  timeoutMs,
  deadline: Date.now() + timeoutMs
});

export const getRemainingMs = (timer: TurnTimer): number => Math.max(0, timer.deadline - Date.now());
export const isTimeout = (timer: TurnTimer): boolean => getRemainingMs(timer) <= 0;
