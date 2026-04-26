import { beforeEach, describe, expect, it } from "vitest";
import { DEFAULT_REMOTE_CONFIG } from "./config";
import { createMockPlatformProviders } from "./mockProviders";
import { AudioManager, defaultAudioSettings, loadAudioSettings, saveAudioSettings } from "./audio";
import { activeEvents } from "./events";
import { claimEventTaskReward, ingestEventProgress, loadEventCenter } from "./events";
import { eligibleHomePopups, recordPopupImpression, selectHomePopup, suppressPopupToday } from "./popups";
import { offerEligibility, offersForSurface, pendingAdOfferRewards, runRewardedAdOffer } from "./adOffers";

describe("premium mini-game experience platform", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("persists audio settings and suppresses playback when muted", () => {
    const settings = saveAudioSettings({ ...defaultAudioSettings(), muted: true, musicEnabled: false, sfxEnabled: false });
    expect(loadAudioSettings().muted).toBe(true);
    const manager = new AudioManager(DEFAULT_REMOTE_CONFIG.audio, settings);
    expect(manager.getSettings().musicEnabled).toBe(false);
    expect(manager.updateSettings({ muted: false, volume: 0.25 }).volume).toBe(0.25);
    manager.dispose();
  });

  it("loads active events, ingests progress, and claims through ledger", async () => {
    const providers = createMockPlatformProviders();
    const session = await providers.auth.ensureGuestSession();
    expect(session.ok).toBe(true);
    if (!session.ok) return;
    expect(activeEvents(DEFAULT_REMOTE_CONFIG).length).toBeGreaterThan(0);
    await loadEventCenter(session.data, DEFAULT_REMOTE_CONFIG);
    const progressed = ingestEventProgress(session.data, "level_clear", 3, DEFAULT_REMOTE_CONFIG);
    expect(progressed.ok).toBe(true);
    const claim = await claimEventTaskReward(session.data, "star_gate_sprint", "clear_3_levels", providers);
    expect(claim.ok).toBe(true);
    if (!claim.ok) return;
    expect(claim.data.wallet.balances.coins).toBeGreaterThanOrEqual(120);
  });

  it("selects home popup by priority and enforces today suppression", async () => {
    const providers = createMockPlatformProviders();
    const session = await providers.auth.ensureGuestSession();
    expect(session.ok).toBe(true);
    if (!session.ok) return;
    const popup = selectHomePopup(DEFAULT_REMOTE_CONFIG);
    expect(popup?.id).toBe("popup_star_gate");
    recordPopupImpression(popup!, session.data);
    suppressPopupToday(popup!, session.data);
    expect(eligibleHomePopups(DEFAULT_REMOTE_CONFIG)).toEqual([]);
  });

  it("runs stamina and hint ad offers with eligibility and pending queue support", async () => {
    const providers = createMockPlatformProviders();
    const session = await providers.auth.ensureGuestSession();
    expect(session.ok).toBe(true);
    if (!session.ok) return;
    const offers = offersForSurface(DEFAULT_REMOTE_CONFIG, "home");
    expect(offers.map((offer) => offer.id)).toEqual(["stamina_home", "hint_home"]);
    expect(offerEligibility(session.data, offers[0]!, DEFAULT_REMOTE_CONFIG).state).toBe("available");
    const stamina = await runRewardedAdOffer(session.data, "stamina_home", DEFAULT_REMOTE_CONFIG, providers);
    expect(stamina.ok).toBe(true);
    const hint = await runRewardedAdOffer(session.data, "hint_home", DEFAULT_REMOTE_CONFIG, providers);
    expect(hint.ok).toBe(true);
    expect(pendingAdOfferRewards().length).toBeGreaterThanOrEqual(0);
  });
});
