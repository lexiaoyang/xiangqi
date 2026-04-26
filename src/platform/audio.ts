import { DEFAULT_REMOTE_CONFIG } from "./config";
import { PLATFORM_STORAGE_KEYS, readAudioSettingsCache, writeAudioSettingsCache, writeCache } from "./storage";
import type { AnalyticsEvent, AudioConfig, AudioContextKey, AudioCueId, AudioSettings } from "./types";

export const defaultAudioSettings = (config: AudioConfig = DEFAULT_REMOTE_CONFIG.audio): AudioSettings => ({
  musicEnabled: true,
  sfxEnabled: true,
  muted: false,
  volume: config.defaultVolume,
  unlocked: false,
  updatedAt: new Date().toISOString()
});

export function loadAudioSettings(config: AudioConfig = DEFAULT_REMOTE_CONFIG.audio): AudioSettings {
  return readAudioSettingsCache() ?? defaultAudioSettings(config);
}

export function saveAudioSettings(settings: AudioSettings): AudioSettings {
  return writeAudioSettingsCache({ ...settings, updatedAt: new Date().toISOString() });
}

type AudioLikeContext = {
  createOscillator: () => OscillatorNode;
  createGain: () => GainNode;
  createBuffer: (numberOfChannels: number, length: number, sampleRate: number) => AudioBuffer;
  createBufferSource: () => AudioBufferSourceNode;
  destination: AudioDestinationNode;
  currentTime: number;
  sampleRate: number;
  resume?: () => Promise<void>;
  close?: () => Promise<void>;
};

type BgmPalette = {
  roots: number[];
  chords: number[][];
  bpm: number;
  shimmer: number;
};

const BGM_DURATION_SEC = 48;

const BGM_PALETTES: Record<AudioContextKey, BgmPalette> = {
  lobby: {
    roots: [110, 98, 130.81, 87.31],
    chords: [
      [110, 164.81, 220, 329.63],
      [98, 146.83, 196, 293.66],
      [130.81, 196, 261.63, 392],
      [87.31, 130.81, 174.61, 261.63]
    ],
    bpm: 76,
    shimmer: 0.008
  },
  activity: {
    roots: [130.81, 146.83, 164.81, 110],
    chords: [
      [130.81, 196, 261.63, 392],
      [146.83, 220, 293.66, 440],
      [164.81, 246.94, 329.63, 493.88],
      [110, 164.81, 220, 329.63]
    ],
    bpm: 88,
    shimmer: 0.01
  },
  shop: {
    roots: [123.47, 92.5, 138.59, 103.83],
    chords: [
      [123.47, 185, 246.94, 369.99],
      [92.5, 138.59, 185, 277.18],
      [138.59, 207.65, 277.18, 415.3],
      [103.83, 155.56, 207.65, 311.13]
    ],
    bpm: 72,
    shimmer: 0.007
  },
  rewards: {
    roots: [146.83, 110, 164.81, 130.81],
    chords: [
      [146.83, 220, 293.66, 440],
      [110, 164.81, 220, 329.63],
      [164.81, 246.94, 329.63, 493.88],
      [130.81, 196, 261.63, 392]
    ],
    bpm: 78,
    shimmer: 0.011
  },
  gameplay: {
    roots: [98, 87.31, 110, 73.42],
    chords: [
      [98, 146.83, 196, 293.66],
      [87.31, 130.81, 174.61, 261.63],
      [110, 164.81, 220, 329.63],
      [73.42, 110, 146.83, 220]
    ],
    bpm: 92,
    shimmer: 0.006
  }
};

export class AudioManager {
  private ctx: AudioLikeContext | null = null;
  private bgmSource: AudioBufferSourceNode | null = null;
  private bgmGain: GainNode | null = null;
  private bgmBufferCache = new Map<AudioContextKey, AudioBuffer>();
  private currentContext: AudioContextKey | null = null;
  private settings: AudioSettings;

  constructor(
    private config: AudioConfig = DEFAULT_REMOTE_CONFIG.audio,
    settings: AudioSettings = loadAudioSettings(config)
  ) {
    this.settings = settings;
  }

  getSettings(): AudioSettings {
    return this.settings;
  }

  updateSettings(next: Partial<AudioSettings>): AudioSettings {
    this.settings = saveAudioSettings({ ...this.settings, ...next, updatedAt: new Date().toISOString() });
    if (this.settings.muted || !this.settings.musicEnabled) this.stopBgm();
    this.bgmGain?.gain.setTargetAtTime(this.bgmGainLevel(), this.ctx?.currentTime ?? 0, 0.18);
    return this.settings;
  }

  async unlock(): Promise<boolean> {
    if (!this.config.enabled) return false;
    const ctx = this.getContext();
    if (!ctx) return false;
    try {
      await ctx.resume?.();
      this.updateSettings({ unlocked: true });
      this.trackAudio("audio_unlocked", { unlocked: true });
      return true;
    } catch {
      this.trackAudio("audio_autoplay_blocked", { unlocked: false });
      return false;
    }
  }

  async playBgm(context: AudioContextKey): Promise<void> {
    if (!this.canPlayMusic()) return;
    if (!this.settings.unlocked) await this.unlock();
    if (!this.settings.unlocked) return;
    if (this.currentContext === context && this.bgmSource) return;
    this.stopBgm();
    this.currentContext = context;
    this.startSyntheticBgm(context);
    this.trackAudio("audio_bgm_started", { context, trackId: this.config.bgm[context] });
  }

  stopBgm(): void {
    const now = this.ctx?.currentTime ?? 0;
    if (this.bgmGain) {
      this.bgmGain.gain.cancelScheduledValues(now);
      this.bgmGain.gain.setTargetAtTime(0.0001, now, 0.18);
    }
    try {
      this.bgmSource?.stop(now + 0.55);
    } catch {
      /* already stopped */
    }
    this.bgmSource = null;
    this.bgmGain = null;
    this.currentContext = null;
  }

  playSfx(cue: AudioCueId): void {
    if (!this.canPlaySfx()) return;
    const tones: Record<AudioCueId, Array<[number, number, number, OscillatorType]>> = {
      tap: [[660, 0.035, 0.1, "triangle"]],
      reward_claim: [
        [659.25, 0.08, 0.14, "sine"],
        [987.77, 0.14, 0.1, "sine"]
      ],
      purchase_success: [
        [523.25, 0.07, 0.13, "triangle"],
        [659.25, 0.1, 0.12, "triangle"],
        [1046.5, 0.18, 0.08, "sine"]
      ],
      ad_start: [[392, 0.08, 0.12, "triangle"]],
      ad_complete: [
        [587.33, 0.07, 0.12, "triangle"],
        [880, 0.12, 0.12, "sine"]
      ],
      popup_open: [
        [493.88, 0.08, 0.12, "triangle"],
        [739.99, 0.12, 0.08, "sine"]
      ],
      failure: [[164.81, 0.14, 0.14, "sawtooth"]]
    };
    tones[cue].forEach(([freq, duration, gain, wave], index) => {
      window.setTimeout(() => this.playTone(freq, duration, gain, wave), index * 42);
    });
    this.trackAudio("audio_sfx_played", { cue });
  }

  dispose(): void {
    this.stopBgm();
    this.ctx?.close?.();
    this.ctx = null;
  }

  private canPlayMusic(): boolean {
    return this.config.enabled && this.settings.musicEnabled && !this.settings.muted && this.settings.volume > 0;
  }

  private canPlaySfx(): boolean {
    return this.config.enabled && this.settings.sfxEnabled && !this.settings.muted && this.settings.volume > 0 && this.settings.unlocked;
  }

  private getContext(): AudioLikeContext | null {
    if (this.ctx) return this.ctx;
    const AudioCtor = window.AudioContext ?? window.webkitAudioContext;
    if (!AudioCtor) return null;
    this.ctx = new AudioCtor();
    return this.ctx;
  }

  private startSyntheticBgm(context: AudioContextKey): void {
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const source = ctx.createBufferSource();
    const gain = ctx.createGain();
    source.buffer = this.bgmBufferCache.get(context) ?? this.renderLongBgmBuffer(ctx, context);
    source.loop = true;
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(this.bgmGainLevel(), now + 1.6);
    source.connect(gain);
    gain.connect(ctx.destination);
    source.start(now);
    this.bgmSource = source;
    this.bgmGain = gain;
  }

  private bgmGainLevel(): number {
    return 0.72 * this.settings.volume;
  }

  private renderLongBgmBuffer(ctx: AudioLikeContext, context: AudioContextKey): AudioBuffer {
    const buffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * BGM_DURATION_SEC), ctx.sampleRate);
    const data = buffer.getChannelData(0);
    const palette = BGM_PALETTES[context];
    const sectionSec = BGM_DURATION_SEC / palette.chords.length;

    for (let i = 0; i < data.length; i += 1) {
      const t = i / ctx.sampleRate;
      const sectionFloat = t / sectionSec;
      const section = Math.min(palette.chords.length - 1, Math.floor(sectionFloat));
      const nextSection = (section + 1) % palette.chords.length;
      const local = t - section * sectionSec;
      const blend = smoothstep(sectionSec - 5.5, sectionSec, local);
      const chord = palette.chords[section]!;
      const nextChord = palette.chords[nextSection]!;
      const root = palette.roots[section]!;
      const nextRoot = palette.roots[nextSection]!;
      const loopFade = smoothstep(0, 2.2, t) * (1 - smoothstep(BGM_DURATION_SEC - 2.2, BGM_DURATION_SEC, t));

      let sample = 0;
      for (let n = 0; n < chord.length; n += 1) {
        const freq = lerp(chord[n]!, nextChord[n]!, blend);
        const drift = 1 + 0.003 * Math.sin(TAU * (0.017 + n * 0.005) * t + n);
        const breath = 0.68 + 0.32 * Math.sin(TAU * (0.022 + n * 0.003) * t + n * 1.7);
        sample += Math.sin(TAU * freq * drift * t + n * 0.7) * (0.03 / (n + 1)) * breath;
        sample += Math.sin(TAU * freq * 0.5 * drift * t + n * 0.19) * (0.02 / (n + 1)) * breath;
      }

      const rootBlend = lerp(root, nextRoot, blend);
      sample += Math.sin(TAU * rootBlend * 0.5 * t) * 0.03;
      sample += Math.sin(TAU * rootBlend * 0.25 * t) * 0.026;
      sample += Math.sin(TAU * rootBlend * 1.5 * t + Math.sin(TAU * 0.035 * t) * 1.1) * 0.012;
      sample += Math.sin(TAU * (rootBlend * 3.02) * t + Math.sin(TAU * 0.045 * t) * 2.4) * palette.shimmer;
      sample += softNoise(i) * (0.004 + 0.002 * Math.sin(TAU * 0.015 * t));

      data[i] = clampSample(sample * loopFade * 2.9);
    }

    softenEdges(data, ctx.sampleRate);
    this.bgmBufferCache.set(context, buffer);
    return buffer;
  }

  private playTone(freq: number, duration: number, gainValue: number, wave: OscillatorType = "sine"): void {
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = freq;
      osc.type = wave;
      const now = ctx.currentTime;
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, gainValue * this.settings.volume), now + 0.018);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + duration + 0.02);
    } catch {
      this.trackAudio("audio_playback_failed", { freq });
    }
  }

  private trackAudio(name: string, data: AnalyticsEvent["data"]): void {
    const queue = JSON.parse(localStorage.getItem(PLATFORM_STORAGE_KEYS.analyticsQueue) ?? "[]") as AnalyticsEvent[];
    writeCache(PLATFORM_STORAGE_KEYS.analyticsQueue, [...queue, { name, data, createdAt: new Date().toISOString() }]);
  }
}

const TAU = Math.PI * 2;

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

function softNoise(index: number): number {
  const x = Math.sin(index * 12.9898 + 78.233) * 43758.5453;
  return (x - Math.floor(x) - 0.5) * 0.45;
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function clampSample(sample: number): number {
  return Math.max(-0.92, Math.min(0.92, sample));
}

function softenEdges(data: Float32Array, sampleRate: number): void {
  const fade = Math.min(data.length / 2, Math.floor(sampleRate * 2.5));
  for (let i = 0; i < fade; i += 1) {
    const weight = smoothstep(0, fade, i);
    data[i] *= weight;
    data[data.length - 1 - i] *= weight;
  }
}

declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext;
  }
}
