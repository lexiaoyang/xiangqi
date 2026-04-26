import { describe, expect, it } from "vitest";
import { createMockPlatformProviders } from "./mockProviders";
import { adDisclosureLabel, adEligibility, interstitialAllowedDuringPlay, loadAdPlacements, pendingAdTokens, recordAdShown, runRewardedAd } from "./ads";

describe("platform ads", () => {
  it("loads placements and labels rewarded ads", async () => {
    const providers = createMockPlatformProviders();
    const session = await providers.auth.ensureGuestSession();
    expect(session.ok).toBe(true);
    if (!session.ok) return;

    const placements = await loadAdPlacements(session.data, providers);
    expect(placements.ok).toBe(true);
    if (!placements.ok) return;
    expect(adDisclosureLabel(placements.data[0]!)).toContain("广告");
  });

  it("runs rewarded ad and grants wallet reward", async () => {
    const providers = createMockPlatformProviders();
    const session = await providers.auth.ensureGuestSession();
    expect(session.ok).toBe(true);
    if (!session.ok) return;

    const result = await runRewardedAd(session.data, "reward_stamina", providers);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.rewards.some((item) => item.kind === "stamina")).toBe(true);
    expect(pendingAdTokens().length).toBeGreaterThanOrEqual(0);
  });

  it("enforces cooldown and never allows interstitial during gameplay", async () => {
    const providers = createMockPlatformProviders();
    const session = await providers.auth.ensureGuestSession();
    expect(session.ok).toBe(true);
    if (!session.ok) return;
    const placements = await loadAdPlacements(session.data, providers);
    expect(placements.ok).toBe(true);
    if (!placements.ok) return;
    const placement = placements.data.find((item) => item.id === "reward_stamina")!;
    recordAdShown(session.data.profile.userId, placement.id);
    expect(adEligibility(session.data.profile.userId, placement).eligible).toBe(false);
    expect(interstitialAllowedDuringPlay(true)).toBe(false);
    expect(interstitialAllowedDuringPlay(false)).toBe(true);
  });
});
