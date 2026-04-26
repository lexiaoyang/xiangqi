import { describe, expect, it } from "vitest";
import { createMockPlatformProviders } from "./mockProviders";
import { claimRewardCenterItem, ingestRewardProgress, loadRewardCenter, rewardKindLabel, rewardStateLabel } from "./rewards";

describe("platform rewards", () => {
  it("loads reward center and labels states", async () => {
    const providers = createMockPlatformProviders();
    const session = await providers.auth.ensureGuestSession();
    expect(session.ok).toBe(true);
    if (!session.ok) return;

    const center = await loadRewardCenter(session.data, providers);
    expect(center.ok).toBe(true);
    if (!center.ok) return;
    expect(center.data.rewards.length).toBeGreaterThan(0);
    expect(rewardKindLabel("sign_in")).toBe("签到");
    expect(rewardStateLabel("claimable")).toBe("可领取");
  });

  it("claims sign-in reward once and rejects duplicate claim", async () => {
    const providers = createMockPlatformProviders();
    const session = await providers.auth.ensureGuestSession();
    expect(session.ok).toBe(true);
    if (!session.ok) return;
    await loadRewardCenter(session.data, providers);
    const first = await claimRewardCenterItem(session.data, "daily_signin_1", providers);
    expect(first.ok).toBe(true);
    const second = await claimRewardCenterItem(session.data, "daily_signin_1", providers);
    expect(second.ok).toBe(false);
  });

  it("ingests task progress and unlocks claimable tasks", async () => {
    const providers = createMockPlatformProviders();
    const session = await providers.auth.ensureGuestSession();
    expect(session.ok).toBe(true);
    if (!session.ok) return;
    await loadRewardCenter(session.data, providers);
    await ingestRewardProgress(session.data, { kind: "level_clear", amount: 3, refId: "level-3" }, providers);
    const center = await loadRewardCenter(session.data, providers);
    expect(center.ok).toBe(true);
    if (!center.ok) return;
    expect(center.data.rewards.some((reward) => reward.id === "task_clear_3" && reward.state === "claimable")).toBe(true);
  });
});
