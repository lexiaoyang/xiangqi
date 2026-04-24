import { describe, expect, it } from "vitest";
import { CAMPAIGN_PACK_VERSION } from "./constants";
import { getLevelSpec, layoutSeedForLevel } from "./levelSpec";

describe("campaign levelSpec", () => {
  it("同 levelId 同 pack 下 layoutSeed 稳定", () => {
    expect(layoutSeedForLevel(42)).toBe(layoutSeedForLevel(42));
    expect(getLevelSpec(42).packVersion).toBe(CAMPAIGN_PACK_VERSION);
  });

  it("高关卡使用更高难度档", () => {
    expect(getLevelSpec(1).difficulty).toBe("easy");
    expect(getLevelSpec(900).difficulty).toBe("expert");
  });
});
