import { describe, expect, it } from "vitest";
import { buildReplay, exportRecord, importRecord } from "./replay";
import { createInitialState, generateLegalMoves, toFen } from "./rules";

describe("replay and record", () => {
  it("复盘快照数量等于步数+1", () => {
    const state = createInitialState();
    const move = generateLegalMoves(state)[0];
    const snapshots = buildReplay(state.board, state.turn, [move]);
    expect(snapshots).toHaveLength(2);
  });

  it("导出后导入可恢复结构", () => {
    const state = createInitialState();
    const move = generateLegalMoves(state)[0];
    const payload = exportRecord(toFen(state), [move]);
    const restored = importRecord(payload);
    expect(restored.moves).toHaveLength(1);
    expect(restored.version).toBe("1.0");
  });
});
