import type { LevelSpec } from "./types";

/** 根据步数、用时与阻碍规则计算 0–3 星 */
export function computeStars(
  spec: LevelSpec,
  opts: { won: boolean; steps: number; durationMs: number; hadTimerObstacle: boolean }
): 0 | 1 | 2 | 3 {
  if (!opts.won) return 0;
  const [s3, s2, s1] = spec.starStepPar;
  let stars: 1 | 2 | 3 = 1;
  if (opts.steps <= s3) stars = 3;
  else if (opts.steps <= s2) stars = 2;
  else if (opts.steps <= s1) stars = 1;

  if (opts.hadTimerObstacle && spec.timeLimitSec != null && opts.durationMs > spec.timeLimitSec * 1000) {
    stars = 1;
  }
  return stars;
}
