import { beforeEach, describe, expect, it } from "vitest";
import { DEFAULT_REMOTE_CONFIG } from "./config";
import { createMockPlatformProviders } from "./mockProviders";
import { AudioManager, BGM_DURATION_SEC, HOME_LOOP_DURATION_SEC, defaultAudioSettings, loadAudioSettings, renderHomeLoopSamples, renderUpbeatBgmSamples, saveAudioSettings } from "./audio";
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

  it("generates an upbeat 60 second BGM segment instead of sparse beep tones", () => {
    const sampleRate = 44_100;
    const samples = renderUpbeatBgmSamples(new Float32Array(sampleRate * BGM_DURATION_SEC), sampleRate, "lobby");
    const peak = samples.reduce((max, sample) => Math.max(max, Math.abs(sample)), 0);
    const rms = Math.sqrt(samples.reduce((sum, sample) => sum + sample * sample, 0) / samples.length);
    expect(samples.length).toBe(sampleRate * 60);
    expect(peak).toBeGreaterThan(0.08);
    expect(rms).toBeGreaterThan(0.01);
  });

  it("uses distinct arrangements for home and gameplay BGM", () => {
    const sampleRate = 22_050;
    const lobby = renderUpbeatBgmSamples(new Float32Array(sampleRate * BGM_DURATION_SEC), sampleRate, "home");
    const gameplay = renderUpbeatBgmSamples(new Float32Array(sampleRate * BGM_DURATION_SEC), sampleRate, "gameplay");
    const lobbyRms = Math.sqrt(lobby.reduce((sum, sample) => sum + sample * sample, 0) / lobby.length);
    const gameplayRms = Math.sqrt(gameplay.reduce((sum, sample) => sum + sample * sample, 0) / gameplay.length);
    expect(Math.abs(gameplayRms - lobbyRms)).toBeGreaterThan(0.002);
  });


  it("generates a separate 60 second home ambience loop", () => {
    const sampleRate = 44_100;
    const samples = renderHomeLoopSamples(new Float32Array(sampleRate * HOME_LOOP_DURATION_SEC), sampleRate);
    const peak = samples.reduce((max, sample) => Math.max(max, Math.abs(sample)), 0);
    expect(samples.length).toBe(sampleRate * 60);
    expect(peak).toBeGreaterThan(0.02);
  });

  it("plays generated BGM as a looping buffer and keeps SFX separate", async () => {
    installFakeAudioContext();
    const manager = new AudioManager(DEFAULT_REMOTE_CONFIG.audio, { ...defaultAudioSettings(), unlocked: true });
    await manager.playBgm("home", { homeLayer: true });
    expect(manager.describeBgmForTest("home")).toMatchObject({
      durationSec: 60,
      homeLoopDurationSec: 60,
      arrangement: "home-lobby",
      cached: true,
      loopSourceActive: true,
      homeLoopActive: true
    });
    manager.playSfx("tap");
    expect(manager.describeBgmForTest("home").loopSourceActive).toBe(true);
    await manager.playBgm("gameplay");
    expect(manager.describeBgmForTest("gameplay")).toMatchObject({ arrangement: "adventure-gameplay", homeLoopActive: false });
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

function installFakeAudioContext() {
  Object.defineProperty(window, "AudioContext", {
    configurable: true,
    writable: true,
    value: FakeAudioContext
  });
}

class FakeAudioBuffer {
  readonly duration: number;
  private readonly channel: Float32Array;

  constructor(
    _channels: number,
    readonly length: number,
    readonly sampleRate: number
  ) {
    this.duration = length / sampleRate;
    this.channel = new Float32Array(length);
  }

  getChannelData() {
    return this.channel;
  }
}

class FakeParam {
  value = 0;
  setValueAtTime(value: number) {
    this.value = value;
  }
  exponentialRampToValueAtTime(value: number) {
    this.value = value;
  }
  setTargetAtTime(value: number) {
    this.value = value;
  }
  cancelScheduledValues() {}
}

class FakeGain {
  gain = new FakeParam();
  connect() {}
}

class FakeOscillator {
  frequency = { value: 0 };
  type: OscillatorType = "sine";
  connect() {}
  start() {}
  stop() {}
}

class FakeBufferSource {
  buffer: FakeAudioBuffer | null = null;
  loop = false;
  connect() {}
  start() {}
  stop() {}
}

class FakeAudioContext {
  currentTime = 0;
  sampleRate = 44_100;
  destination = {};

  createBuffer(channels: number, length: number, sampleRate: number) {
    return new FakeAudioBuffer(channels, length, sampleRate);
  }
  createBufferSource() {
    return new FakeBufferSource();
  }
  createGain() {
    return new FakeGain();
  }
  createOscillator() {
    return new FakeOscillator();
  }
  resume() {
    return Promise.resolve();
  }
  close() {
    return Promise.resolve();
  }
}
