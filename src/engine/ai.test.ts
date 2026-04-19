import { describe, expect, it } from "vitest";
import { DIFFICULTY_CONFIG, RECOMMEND_CONFIG, searchBestMove } from "./ai";
import { createInitialState } from "./rules";

describe("ai difficulty", () => {
  it("三档难度都能给出可行走法", () => {
    const base = createInitialState();
    expect(searchBestMove(base, "red", DIFFICULTY_CONFIG.easy)?.move).toBeDefined();
    expect(searchBestMove(base, "red", DIFFICULTY_CONFIG.hard)?.move).toBeDefined();
    expect(searchBestMove(base, "red", DIFFICULTY_CONFIG.hell)?.move).toBeDefined();
  });

  it("推荐配置强于地狱配置", () => {
    expect(RECOMMEND_CONFIG.depth).toBeGreaterThan(DIFFICULTY_CONFIG.hell.depth);
    expect(RECOMMEND_CONFIG.timeMs).toBeGreaterThan(DIFFICULTY_CONFIG.hell.timeMs);
  });
});
