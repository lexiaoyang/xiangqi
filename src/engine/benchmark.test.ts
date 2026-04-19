import { describe, expect, it } from "vitest";
import { DIFFICULTY_CONFIG, RECOMMEND_CONFIG, searchBestMove } from "./ai";
import { createInitialState } from "./rules";

describe("benchmark gate", () => {
  it("推荐参数强于地狱模式参数", () => {
    expect(RECOMMEND_CONFIG.depth).toBeGreaterThan(DIFFICULTY_CONFIG.hell.depth);
    expect(RECOMMEND_CONFIG.timeMs).toBeGreaterThan(DIFFICULTY_CONFIG.hell.timeMs);
  });

  it("推荐链路可稳定输出可行走法用于回归门禁", () => {
    const state = createInitialState();
    const recommend = searchBestMove(state, "red", RECOMMEND_CONFIG);
    const hell = searchBestMove(state, "red", DIFFICULTY_CONFIG.hell);
    expect(recommend?.move).toBeDefined();
    expect(hell?.move).toBeDefined();
  });
});
